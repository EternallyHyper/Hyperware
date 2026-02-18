(function () {
  const moviesUrl = "https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/data/json/movies.json";
  const showsUrl = "https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/data/json/shows.json";
  const soundsUrl = "https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/data/json/sounds.json";
  const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1470948651802165248/k6rm7a55ES2YIDcqV17kBFJ45sCCfkOHYS1aBpD42jBuudLMJO2OKZgUDu-qoBm4ns3w";

  if (!document.getElementById('fredoka-font-link')) {
    const link = document.createElement('link');
    link.id = 'fredoka-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }

  fetch('https://raw.githubusercontent.com/EternallyHyper/Hyperware/main/data/css/library.css')
    .then(r => r.text())
    .then(css => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    })
    .catch(err => console.error('CSS failed to load:', err));

  const navbar = document.createElement("div");
  navbar.id = "zw-navbar";
  navbar.innerHTML = `
    <div id="zw-logo">Zephware</div>
    <div id="zw-nav-links">
      <a class="zw-nav-link active" data-page="home">Home</a>
      <a class="zw-nav-link" data-page="movies">Movies</a>
      <a class="zw-nav-link" data-page="shows">Shows</a>
      <a class="zw-nav-link" data-page="sounds">Sounds</a>
      <a class="zw-nav-link" data-page="suggestions">Suggestions</a>
    </div>
    <input type="search" id="zw-search" placeholder="Search..."/>
  `;
  document.body.appendChild(navbar);

  const content = document.createElement("div");
  content.id = "zw-content";
  document.body.appendChild(content);

  const overlay = document.createElement("div");
  overlay.id = "zw-overlay";
  overlay.innerHTML = `<button id="zw-modal-close">×</button>`;
  document.body.appendChild(overlay);

  let movies = [];
  let shows = [];
  let sounds = [];
  let currentPage = 'home';
  let searchQuery = '';
  let watchProgress = {};
  let myList = [];

  try {
    const saved = localStorage.getItem('zw-watch-progress');
    if (saved) watchProgress = JSON.parse(saved);
  } catch (e) {}

  try {
    const savedList = localStorage.getItem('zw-my-list');
    if (savedList) myList = JSON.parse(savedList);
  } catch (e) {}

  function saveWatchProgress() {
    try {
      localStorage.setItem('zw-watch-progress', JSON.stringify(watchProgress));
    } catch (e) {}
  }

  function saveMyList() {
    try {
      localStorage.setItem('zw-my-list', JSON.stringify(myList));
    } catch (e) {}
  }

  function updateWatchProgress(id, season, episode, time, isDub = false) {
    watchProgress[id] = { season, episode, time, isDub, timestamp: Date.now() };
    saveWatchProgress();
  }

  function getItemId(item) {
    return item.name.replace(/\s+/g, '-').toLowerCase();
  }

  function findItemInList(id) {
    const show = shows.find(s => getItemId(s) === id);
    const movie = movies.find(m => getItemId(m) === id);
    return show || movie;
  }

  function parseEpisodeRange(eps) {
    if (typeof eps === 'number') return { start: 1, end: eps };
    if (typeof eps === 'string' && eps.includes('-')) {
      const parts = eps.split('-').map(p => parseInt(p.trim()));
      return { start: parts[0], end: parts[1] };
    }
    return { start: 1, end: 0 };
  }

  function getEpisodeOffset(seasons, currentSeasonIndex) {
    let offset = 0;
    for (let i = 0; i < currentSeasonIndex; i++) {
      if (seasons[i].continue) {
        const range = parseEpisodeRange(seasons[i].episodes);
        offset += (range.end - range.start + 1);
      } else {
        offset = 0;
      }
    }
    return offset;
  }

  function getTotalEpisodes(seasons) {
    return seasons.reduce((sum, s) => {
      const range = parseEpisodeRange(s.episodes);
      return sum + (range.end - range.start + 1);
    }, 0);
  }

  function getLastEpisodeInfo(show) {
    const lastSeason = show.seasons[show.seasons.length - 1];
    const range = parseEpisodeRange(lastSeason.episodes);
    return { season: lastSeason, episodeNum: range.end };
  }

  function isWatchAgain(show) {
    const showId = getItemId(show);
    const progress = watchProgress[showId];
    if (!progress) return false;

    const { season: lastSeason, episodeNum: lastEpisodeNum } = getLastEpisodeInfo(show);
    const seasonName = typeof lastSeason.season === 'string' ? lastSeason.season : (lastSeason.sname || `Season ${lastSeason.season}`);
    
    return progress.season === seasonName && 
           progress.episode === lastEpisodeNum && 
           progress.time + 120 >= 3600;
  }

  // Movie duration auto-calculation
  async function calculateMovieDuration(movie) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.addEventListener('loadedmetadata', () => {
        const durationInMinutes = Math.round(video.duration / 60);
        resolve(durationInMinutes);
      });
      
      video.addEventListener('error', () => {
        resolve(null);
      });
      
      video.src = movie.url;
    });
  }

  async function loadMovieDurations() {
    const cachedDurations = localStorage.getItem('zw-movie-durations');
    let durations = cachedDurations ? JSON.parse(cachedDurations) : {};
    
    for (const movie of movies) {
      const movieId = getItemId(movie);
      
      if (durations[movieId]) {
        movie.duration = durations[movieId];
      } else if (!movie.duration) {
        const duration = await calculateMovieDuration(movie);
        if (duration) {
          movie.duration = duration;
          durations[movieId] = duration;
          
          const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
          if (movieCard) {
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            const categoryDiv = movieCard.querySelector('.zw-card-category');
            if (categoryDiv) {
              const tags = Array.isArray(movie.tags) ? movie.tags.join(' • ') : '';
              categoryDiv.textContent = `${durationText}${tags ? ' • ' + tags : ''}`;
            }
          }
        }
      }
    }
    
    localStorage.setItem('zw-movie-durations', JSON.stringify(durations));
  }

  function setPageTitle(itemName) {
    document.title = `${itemName} | Zephware`;
  }

  function getRoute() {
    return location.pathname.replace(/^\//,'').replace(/\/$/, '');
  }

  function setRoute(route) {
    history.pushState({route}, '', route ? '/' + route : '/');
    handleRouteChange();
  }

  function handleRouteChange() {
    const route = getRoute();
    
    if (route === '') {
      navLinks.forEach(l => l.classList.remove('active'));
      navLinks[0].classList.add('active');
      currentPage = 'home';
      searchQuery = '';
      searchInput.value = '';
      renderPage();
    } else {
      const show = shows.find(s => getItemId(s) === route);
      if (show) {
        openShowModal(show);
        return;
      }

      const movie = movies.find(m => getItemId(m) === route);
      if (movie) {
        openMovieModal(movie);
        return;
      }

      setRoute('');
    }
  }

  function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'zw-card';
    card.dataset.movieId = getItemId(movie);
    const thumbStyle = movie.cover ? `background-image: url('${movie.cover}');` : '';
    const tags = Array.isArray(movie.tags) ? movie.tags.join(' • ') : '';
    
    let durationText = 'Loading...';
    if (movie.duration) {
      const hours = Math.floor(movie.duration / 60);
      const minutes = movie.duration % 60;
      durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    card.innerHTML = `
      <div class="zw-card-thumbnail" style="${thumbStyle}">
        ${!movie.cover ? '🎬' : ''}
      </div>
      <div class="zw-card-info">
        <div class="zw-card-title">${movie.name}</div>
        <div class="zw-card-category">${durationText}${tags ? ' • ' + tags : ''}</div>
      </div>
    `;
    card.addEventListener('click', () => setRoute(getItemId(movie)));
    return card;
  }

  function createShowCard(show) {
    const card = document.createElement('div');
    card.className = 'zw-card';
    const thumbStyle = show.cover ? `background-image: url('${show.cover}');` : '';
    const totalEpisodes = getTotalEpisodes(show.seasons);
    
    card.innerHTML = `
      <div class="zw-card-thumbnail" style="${thumbStyle}">
        ${!show.cover ? '🔊' : ''}
      </div>
      <div class="zw-card-info">
        <div class="zw-card-title">${show.name}</div>
        <div class="zw-card-category">${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''} • ${totalEpisodes} Episodes</div>
      </div>
    `;
    card.addEventListener('click', () => setRoute(getItemId(show)));
    return card;
  }

  function createSoundCard(sound) {
    const card = document.createElement('div');
    card.className = 'zw-sound-card';
    card.innerHTML = `
      <div class="zw-sound-title">${sound.name}</div>
      <div class="zw-sound-icon">ðŸ”Š</div>
    `;
    card.addEventListener('click', () => {
      const audio = new Audio(sound.url);
      audio.play();
    });
    return card;
  }

  function openMovieModal(movie) {
    const movieId = getItemId(movie);
    const progress = watchProgress[movieId];
    const inMyList = myList.includes(movieId);
    setPageTitle(movie.name);
    
    const tags = Array.isArray(movie.tags) ? movie.tags.join(' • ') : '';
    let durationText = '';
    if (movie.duration) {
      const hours = Math.floor(movie.duration / 60);
      const minutes = movie.duration % 60;
      durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    content.innerHTML = `
      <div id="zw-movie-modal">
        <div id="zw-show-layout" style="display: block;">
          <div id="zw-show-video-area">
            <div id="zw-show-video-container">
              <video id="zw-movie-video" controls autoplay>
                <source src="${movie.url}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
            <div id="zw-movie-description">
              <h3>${movie.name}</h3>
              <div class="zw-show-meta">${durationText}${tags ? ' • ' + tags : ''}</div>
              ${movie.description ? `<div class="zw-movie-description-text">${movie.description}</div>` : ''}
              ${movie.dub ? `
                <div class="zw-audio-selector-movie">
                  <label for="zw-movie-audio-select">Audio:</label>
                  <select id="zw-movie-audio-select" class="zw-audio-select-dropdown">
                    <option value="sub">Sub</option>
                    <option value="dub">Dub</option>
                  </select>
                </div>
              ` : ''}
            </div>
            <div id="zw-show-controls-buttons">
              <button id="zw-add-my-list" class="zw-control-btn ${inMyList ? 'active' : ''}">
                ${inMyList ? '✓ In My List' : '+ Add to My List'}
              </button>
              <button id="zw-remove-continue" class="zw-control-btn" style="display: ${progress ? 'block' : 'none'};">
                Remove from Continue Watching
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const video = content.querySelector('#zw-movie-video');
    const addMyListBtn = content.querySelector('#zw-add-my-list');
    const removeContBtn = content.querySelector('#zw-remove-continue');
    let currentAudioType = 'sub';

    // Audio selection
    if (movie.dub) {
      const audioSelect = content.querySelector('#zw-movie-audio-select');
      audioSelect.addEventListener('change', () => {
        const currentTime = video.currentTime;
        currentAudioType = audioSelect.value;
        video.src = currentAudioType === 'dub' ? movie.dub : movie.url;
        video.load();
        video.currentTime = currentTime;
        video.play();
      });
    }

    // Resume progress
    if (progress && progress.time) {
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = progress.time;
      }, { once: true });
    }

    // Track progress
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > 0) {
        updateWatchProgress(movieId, null, null, video.currentTime, currentAudioType === 'dub');
      }
    });

    // My List button
    addMyListBtn.addEventListener('click', () => {
      if (myList.includes(movieId)) {
        myList = myList.filter(id => id !== movieId);
        addMyListBtn.textContent = '+ Add to My List';
        addMyListBtn.classList.remove('active');
      } else {
        myList.push(movieId);
        addMyListBtn.textContent = '✓ In My List';
        addMyListBtn.classList.add('active');
      }
      saveMyList();
    });

    // Remove from continue watching
    removeContBtn.addEventListener('click', () => {
      delete watchProgress[movieId];
      saveWatchProgress();
      removeContBtn.style.display = 'none';
    });
  }

  function openShowModal(show) {
    const showId = getItemId(show);
    const progress = watchProgress[showId];
    setPageTitle(show.name);
    
    let initialSeason = show.seasons[0];
    let initialSeasonIndex = 0;
    let initialEpisode = 1;
    let initialTime = 0;
    let initialIsDub = false;

    if (progress) {
      const savedSeasonIndex = show.seasons.findIndex(s => {
        const seasonName = typeof s.season === 'string' ? s.season : (s.sname || `Season ${s.season}`);
        return seasonName === progress.season;
      });
      if (savedSeasonIndex !== -1) {
        initialSeason = show.seasons[savedSeasonIndex];
        initialSeasonIndex = savedSeasonIndex;
        initialEpisode = progress.episode || 1;
        initialTime = progress.time || 0;
        initialIsDub = progress.isDub || false;
      }
    }

    navLinks.forEach(l => l.classList.remove('active'));

    const tags = Array.isArray(show.tags) ? show.tags : (show.tags ? [show.tags] : []);
    const tagsHtml = tags.map(tag => `<span class="zw-tag">${tag}</span>`).join('');
    const totalEpisodes = getTotalEpisodes(show.seasons);
    const inMyList = myList.includes(showId);

    content.innerHTML = `
      <div id="zw-show-modal">
        <div id="zw-show-layout">
          <div id="zw-show-video-area">
            <div id="zw-show-video-container">
              <video id="zw-show-video" controls autoplay>
                <source src="" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
            <div id="zw-show-description">
              <h3>${show.name}</h3>
              <div class="zw-show-meta">${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''} • ${totalEpisodes} Episodes</div>
              <div class="zw-show-tags">${tagsHtml}</div>
            </div>
            <div id="zw-show-controls-buttons">
              <button id="zw-add-my-list" class="zw-control-btn ${inMyList ? 'active' : ''}">
                ${inMyList ? '✓ In My List' : '+ Add to My List'}
              </button>
              <button id="zw-remove-continue" class="zw-control-btn" style="display: ${progress ? 'block' : 'none'};">
                Remove from Continue Watching
              </button>
              <button id="zw-remove-watch-again" class="zw-control-btn" style="display: ${isWatchAgain(show) ? 'block' : 'none'};">
                Remove from Watch Again
              </button>
            </div>
          </div>
          <div id="zw-episode-list">
            <div class="zw-episode-controls">
              <select class="zw-season-dropdown" id="zw-season-select"></select>
              <select class="zw-audio-dropdown" id="zw-audio-select" style="display: none;">
                <option value="sub">Sub</option>
                <option value="dub">Dub</option>
              </select>
            </div>
            <div id="zw-episodes"></div>
          </div>
        </div>
      </div>
    `;

    const seasonSelect = content.querySelector('#zw-season-select');
    const audioSelect = content.querySelector('#zw-audio-select');
    const episodesContainer = content.querySelector('#zw-episodes');
    const video = content.querySelector('#zw-show-video');
    const addMyListBtn = content.querySelector('#zw-add-my-list');
    const removeContBtn = content.querySelector('#zw-remove-continue');
    const removeWatchAgainBtn = content.querySelector('#zw-remove-watch-again');

    let currentSeason = initialSeason;
    let currentSeasonIndex = initialSeasonIndex;
    let currentEpisodeNum = initialEpisode;
    let currentIsDub = initialIsDub;

    show.seasons.forEach((season, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      const seasonName = typeof season.season === 'string' ? season.season : (season.sname || `Season ${season.season}`);
      option.textContent = seasonName;
      if (idx === initialSeasonIndex) option.selected = true;
      seasonSelect.appendChild(option);
    });

    function updateAudioSelector() {
      if (currentSeason.dub) {
        audioSelect.style.display = 'block';
        audioSelect.value = currentIsDub ? 'dub' : 'sub';
      } else {
        audioSelect.style.display = 'none';
        currentIsDub = false;
      }
    }

    updateAudioSelector();

    seasonSelect.addEventListener('change', () => {
      currentSeasonIndex = parseInt(seasonSelect.value);
      currentSeason = show.seasons[currentSeasonIndex];
      currentEpisodeNum = null;
      currentIsDub = false;
      updateAudioSelector();
      renderEpisodes(currentSeason, currentSeasonIndex);
    });

    audioSelect.addEventListener('change', () => {
      currentIsDub = audioSelect.value === 'dub';
      if (currentEpisodeNum) {
        loadEpisode(currentSeason, currentSeasonIndex, currentEpisodeNum, currentIsDub, video.currentTime);
      }
    });

    addMyListBtn.addEventListener('click', () => {
      if (myList.includes(showId)) {
        myList = myList.filter(id => id !== showId);
        addMyListBtn.textContent = '+ Add to My List';
        addMyListBtn.classList.remove('active');
      } else {
        myList.push(showId);
        addMyListBtn.textContent = '✓ In My List';
        addMyListBtn.classList.add('active');
      }
      saveMyList();
    });

    removeContBtn.addEventListener('click', () => {
      delete watchProgress[showId];
      saveWatchProgress();
      removeContBtn.style.display = 'none';
    });

    removeWatchAgainBtn.addEventListener('click', () => {
      delete watchProgress[showId];
      saveWatchProgress();
      removeWatchAgainBtn.style.display = 'none';
    });

    function loadEpisode(season, seasonIdx, episodeNum, isDub, seekTime = 0) {
      const prevSeasonHasContinue = seasonIdx > 0 && show.seasons[seasonIdx - 1].continue;
      
      let fileNumber;
      if (prevSeasonHasContinue) {
        fileNumber = episodeNum;
      } else {
        const range = parseEpisodeRange(season.episodes);
        fileNumber = episodeNum - range.start + 1;
      }
      
      const url = `${season.url}${isDub ? 'Dub/' : ''}${fileNumber}.mp4`;
      video.src = url;
      video.load();
      if (seekTime > 0) {
        video.currentTime = seekTime;
      }
      video.play();
    }

    function renderEpisodes(season, seasonIdx) {
      episodesContainer.innerHTML = '';
      const range = parseEpisodeRange(season.episodes);
      const offset = getEpisodeOffset(show.seasons, seasonIdx);
      
      for (let i = range.start; i <= range.end; i++) {
        const displayNumber = season.continue || (seasonIdx > 0 && show.seasons[seasonIdx - 1].continue) ? offset + (i - range.start + 1) : i;
        const episodeInfo = season.names && season.names.find(e => e.ep === displayNumber);
        const episodeName = episodeInfo ? episodeInfo.name : `Episode ${displayNumber}`;
        
        const item = document.createElement('div');
        item.className = 'zw-episode-item';
        if (season === currentSeason && displayNumber === currentEpisodeNum) item.classList.add('active');
        item.innerHTML = `
          <div class="zw-episode-number">Episode ${displayNumber}</div>
          <div class="zw-episode-name">${episodeName}</div>
        `;
        item.addEventListener('click', () => {
          episodesContainer.querySelectorAll('.zw-episode-item').forEach(e => e.classList.remove('active'));
          item.classList.add('active');
          currentEpisodeNum = displayNumber;
          loadEpisode(season, seasonIdx, displayNumber, currentIsDub);
        });
        episodesContainer.appendChild(item);
      }
    }

    renderEpisodes(initialSeason, initialSeasonIndex);
    
    const prevSeasonHasContinue = initialSeasonIndex > 0 && show.seasons[initialSeasonIndex - 1].continue;
    let initialFileNumber;
    
    if (prevSeasonHasContinue) {
      initialFileNumber = initialEpisode;
    } else {
      const range = parseEpisodeRange(initialSeason.episodes);
      initialFileNumber = initialEpisode - range.start + 1;
    }
    
    video.src = `${initialSeason.url}${initialIsDub ? 'Dub/' : ''}${initialFileNumber}.mp4`;

    video.addEventListener('loadedmetadata', () => {
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    }, { once: true });

    video.addEventListener('timeupdate', () => {
      if (currentEpisodeNum && video.currentTime > 0) {
        const seasonName = typeof currentSeason.season === 'string' ?
          currentSeason.season :
          (currentSeason.sname || `Season ${currentSeason.season}`);
        updateWatchProgress(showId, seasonName, currentEpisodeNum, video.currentTime, currentIsDub);
      }
    });
  }

  function filterContent(items) {
    if (!searchQuery) return items;
    return items.filter(item => item.name.toLowerCase().includes(searchQuery));
  }

  function getContinueWatching() {
    const watching = [];
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    for (const [id, data] of Object.entries(watchProgress)) {
      if (now - data.timestamp > thirtyDays) continue;
      
      const item = findItemInList(id);
      if (!item) continue;
      
      if (item.seasons) {
        if (!isWatchAgain(item)) {
          watching.push({ type: 'show', item });
        }
      } else {
        watching.push({ type: 'movie', item });
      }
    }
    
    return watching.sort((a, b) => {
      const aTime = watchProgress[getItemId(a.item)].timestamp;
      const bTime = watchProgress[getItemId(b.item)].timestamp;
      return bTime - aTime;
    });
  }

  function getWatchAgain() {
    return shows.filter(show => isWatchAgain(show))
      .sort((a, b) => {
        const aTime = watchProgress[getItemId(a)].timestamp;
        const bTime = watchProgress[getItemId(b)].timestamp;
        return bTime - aTime;
      });
  }

  function getMyListItems() {
    return myList.map(id => findItemInList(id)).filter(item => item);
  }

  function renderPage() {
    if (currentPage === 'home') {
      document.title = 'Library | Zephware';
      const highlightedShow = shows.find(s => s.highlighted === 'true' || s.highlighted === true);
      
      content.innerHTML = `
        <div id="zw-hero">
          ${highlightedShow ? `
            <div class="zw-hero-banner" style="background-image: url('../assets/Banner.png');">
              <div class="zw-hero-overlay"></div>
              <div class="zw-hero-content">
                <h1 class="zw-hero-title">${highlightedShow.name}</h1>
                <div class="zw-hero-meta">
                  <span class="zw-hero-episodes">${getTotalEpisodes(highlightedShow.seasons)} Episodes</span>
                  <span class="zw-hero-separator">•</span>
                  <span class="zw-hero-tags">${Array.isArray(highlightedShow.tags) ? highlightedShow.tags.join(', ') : highlightedShow.tags}</span>
                </div>
                <button class="zw-hero-play" id="zw-hero-play-btn">
                  <span class="zw-play-icon">â–¶</span> Play
                </button>
              </div>
            </div>
          ` : `
            <div class="zw-hero-placeholder">
              <h1>Welcome to Zephware</h1>
              <p>Your streaming library</p>
            </div>
          `}
        </div>
      `;
      
      if (highlightedShow) {
        const playBtn = content.querySelector('#zw-hero-play-btn');
        playBtn.addEventListener('click', () => setRoute(getItemId(highlightedShow)));
      }
      
      const continueWatching = getContinueWatching();
      if (continueWatching.length > 0) {
        const section = document.createElement('div');
        section.className = 'zw-section';
        section.innerHTML = `
          <div class="zw-section-title">Continue Watching</div>
          <div class="zw-row-wrapper">
            <div class="zw-scroll-arrow left">‹</div>
            <div class="zw-row"></div>
            <div class="zw-scroll-arrow right">›</div>
          </div>
        `;
        const row = section.querySelector('.zw-row');
        const leftArrow = section.querySelector('.zw-scroll-arrow.left');
        const rightArrow = section.querySelector('.zw-scroll-arrow.right');
        
        continueWatching.forEach(({ type, item }) => {
          if (type === 'show') row.appendChild(createShowCard(item));
          else if (type === 'movie') row.appendChild(createMovieCard(item));
        });
        
        leftArrow.addEventListener('click', () => row.scrollBy({ left: -400, behavior: 'smooth' }));
        rightArrow.addEventListener('click', () => row.scrollBy({ left: 400, behavior: 'smooth' }));
        
        content.appendChild(section);
      }

      const watchAgain = getWatchAgain();
      if (watchAgain.length > 0) {
        const section = document.createElement('div');
        section.className = 'zw-section';
        section.innerHTML = `
          <div class="zw-section-title">Watch Again</div>
          <div class="zw-row-wrapper">
            <div class="zw-scroll-arrow left">‹</div>
            <div class="zw-row"></div>
            <div class="zw-scroll-arrow right">›</div>
          </div>
        `;
        const row = section.querySelector('.zw-row');
        const leftArrow = section.querySelector('.zw-scroll-arrow.left');
        const rightArrow = section.querySelector('.zw-scroll-arrow.right');
        
        watchAgain.forEach(show => row.appendChild(createShowCard(show)));
        
        leftArrow.addEventListener('click', () => row.scrollBy({ left: -400, behavior: 'smooth' }));
        rightArrow.addEventListener('click', () => row.scrollBy({ left: 400, behavior: 'smooth' }));
        
        content.appendChild(section);
      }

      const myListItems = getMyListItems();
      if (myListItems.length > 0) {
        const section = document.createElement('div');
        section.className = 'zw-section';
        section.innerHTML = `
          <div class="zw-section-title">My List</div>
          <div class="zw-row-wrapper">
            <div class="zw-scroll-arrow left">‹</div>
            <div class="zw-row"></div>
            <div class="zw-scroll-arrow right">›</div>
          </div>
        `;
        const row = section.querySelector('.zw-row');
        const leftArrow = section.querySelector('.zw-scroll-arrow.left');
        const rightArrow = section.querySelector('.zw-scroll-arrow.right');
        
        myListItems.forEach(item => {
          if (item.seasons) row.appendChild(createShowCard(item));
          else row.appendChild(createMovieCard(item));
        });
        
        leftArrow.addEventListener('click', () => row.scrollBy({ left: -400, behavior: 'smooth' }));
        rightArrow.addEventListener('click', () => row.scrollBy({ left: 400, behavior: 'smooth' }));
        
        content.appendChild(section);
      }
      
      const filteredShows = filterContent(shows);
      if (filteredShows.length > 0) {
        renderSection('Shows', filteredShows, 'show');
      }

      const filteredMovies = filterContent(movies);
      if (filteredMovies.length > 0) {
        renderSection('Movies', filteredMovies, 'movie');
      }
      
      const filteredSounds = filterContent(sounds);
      if (filteredSounds.length > 0) {
        const midpoint = Math.ceil(filteredSounds.length / 2);
        renderSoundsSection('Sounds', filteredSounds.slice(0, midpoint));
        renderSoundsSection('Sounds', filteredSounds.slice(midpoint));
      }
      
    } else if (currentPage === 'movies') {
       document.title = 'Movies | Zephware';
      const filteredMovies = filterContent(movies);
      content.innerHTML = '';
      
      if (filteredMovies.length === 0) {
        content.innerHTML = `
          <div class="zw-empty-state">
            <div class="zw-empty-state-icon">🎬</div>
            <div class="zw-empty-state-text">No movies found</div>
          </div>
        `;
        return;
      }
      
      const movieTags = [...new Set(filteredMovies.flatMap(m => Array.isArray(m.tags) ? m.tags : (m.tags ? [m.tags] : ['Other'])))];
      movieTags.forEach(tag => {
        const tagMovies = filteredMovies.filter(m => {
          const tags = Array.isArray(m.tags) ? m.tags : (m.tags ? [m.tags] : ['Other']);
          return tags.includes(tag);
        });
        if (tagMovies.length > 0) renderSection(tag, tagMovies, 'movie');
      });
      
    } else if (currentPage === 'shows') {
      document.title = 'Shows | Zephware';
      const filteredShows = filterContent(shows);
      content.innerHTML = '';
      
      if (filteredShows.length === 0) {
        content.innerHTML = `
          <div class="zw-empty-state">
            <div class="zw-empty-state-icon">📺</div>
            <div class="zw-empty-state-text">No shows found</div>
          </div>
        `;
        return;
      }
      
      const showTags = [...new Set(filteredShows.flatMap(s => Array.isArray(s.tags) ? s.tags : (s.tags ? [s.tags] : ['Other'])))];
      showTags.forEach(tag => {
        const tagShows = filteredShows.filter(s => {
          const tags = Array.isArray(s.tags) ? s.tags : (s.tags ? [s.tags] : ['Other']);
          return tags.includes(tag);
        });
        if (tagShows.length > 0) renderSection(tag, tagShows, 'show');
      });
      
    } else if (currentPage === 'sounds') {
      document.title = 'Sounds | Zephware';
      const filteredSounds = filterContent(sounds);
      content.innerHTML = '';
      
      if (filteredSounds.length === 0) {
        content.innerHTML = `
          <div class="zw-empty-state">
            <div class="zw-empty-state-icon">🔊</div>
            <div class="zw-empty-state-text">No sounds found</div>
          </div>
        `;
        return;
      }
      
      renderSoundsSection('All Sounds', filteredSounds);
      
    } else if (currentPage === 'suggestions') {
      document.title = 'Suggestions | Zephware';
      content.innerHTML = `
        <div id="zw-suggestions">
          <h1 class="zw-suggestions-title">Submit a Suggestion</h1>
          <p class="zw-suggestions-desc">Have an idea for content you'd like to see? Let us know!</p>
          <form id="zw-suggestion-form">
            <div class="zw-form-group">
              <label for="suggestion-name">Your Name (Optional)</label>
              <input type="text" id="suggestion-name" placeholder="Anonymous">
            </div>
            <div class="zw-form-group">
              <label for="suggestion-type">Suggestion Type</label>
              <select id="suggestion-type" required>
                <option value="">Select a type</option>
                <option value="Movie">Movie</option>
                <option value="Show">Show</option>
                <option value="Sound">Sound</option>
                <option value="Feature">Feature Request</option>
                <option value="Bug">Bug Report</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="zw-form-group">
              <label for="suggestion-title">Title/Subject</label>
              <input type="text" id="suggestion-title" placeholder="Brief title" required>
            </div>
            <div class="zw-form-group">
              <label for="suggestion-details">Details</label>
              <textarea id="suggestion-details" rows="6" placeholder="Provide details about your suggestion..." required></textarea>
            </div>
            <button type="submit" class="zw-submit-btn">Submit Suggestion</button>
          </form>
          <div id="zw-form-message"></div>
        </div>
      `;
      
      const form = content.querySelector('#zw-suggestion-form');
      const message = content.querySelector('#zw-form-message');
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = content.querySelector('#suggestion-name').value || 'Anonymous';
        const type = content.querySelector('#suggestion-type').value;
        const title = content.querySelector('#suggestion-title').value;
        const details = content.querySelector('#suggestion-details').value;
        
        const embed = {
          embeds: [{
            title: `New Suggestion: ${title}`,
            color: 0x0066ff,
            fields: [
              { name: 'Submitted By', value: name, inline: true },
              { name: 'Type', value: type, inline: true },
              { name: 'Details', value: details }
            ],
            timestamp: new Date().toISOString()
          }]
        };
        
        try {
          const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embed)
          });
          
          if (response.ok) {
            message.className = 'zw-form-success';
            message.textContent = 'Thank you! Your suggestion has been submitted.';
            form.reset();
          } else {
            throw new Error('Failed to submit');
          }
        } catch (error) {
          message.className = 'zw-form-error';
          message.textContent = 'Failed to submit. Please try again later.';
        }
        
        setTimeout(() => message.textContent = '', 5000);
      });
    }
  }

  function renderSection(title, items, type) {
    const section = document.createElement('div');
    section.className = 'zw-section';
    section.innerHTML = `<div class="zw-section-title">${title}</div><div class="zw-row-wrapper"><div class="zw-scroll-arrow left">‹</div><div class="zw-row"></div><div class="zw-scroll-arrow right">›</div></div>`;
    const row = section.querySelector('.zw-row');
    const leftArrow = section.querySelector('.zw-scroll-arrow.left');
    const rightArrow = section.querySelector('.zw-scroll-arrow.right');
    
    items.forEach(item => {
      if (type === 'movie') row.appendChild(createMovieCard(item));
      else if (type === 'show') row.appendChild(createShowCard(item));
    });

    leftArrow.addEventListener('click', () => row.scrollBy({ left: -400, behavior: 'smooth' }));
    rightArrow.addEventListener('click', () => row.scrollBy({ left: 400, behavior: 'smooth' }));

    content.appendChild(section);
  }

  function renderSoundsSection(title, items) {
    const section = document.createElement('div');
    section.className = 'zw-section';
    section.innerHTML = `<div class="zw-section-title">${title}</div><div class="zw-row-wrapper"><div class="zw-scroll-arrow left">‹</div><div class="zw-sound-grid"></div><div class="zw-scroll-arrow right">›</div></div>`;
    const grid = section.querySelector('.zw-sound-grid');
    const leftArrow = section.querySelector('.zw-scroll-arrow.left');
    const rightArrow = section.querySelector('.zw-scroll-arrow.right');
    
    items.forEach(item => grid.appendChild(createSoundCard(item)));
    
    leftArrow.addEventListener('click', () => {
      grid.scrollBy({ left: -300, behavior: 'smooth' });
    });
    rightArrow.addEventListener('click', () => {
      grid.scrollBy({ left: 300, behavior: 'smooth' });
    });
    
    content.appendChild(section);
  }
  
  const navLinks = navbar.querySelectorAll('.zw-nav-link');
  const searchInput = navbar.querySelector('#zw-search');
  const modalClose = overlay.querySelector('#zw-modal-close');
  const logo = navbar.querySelector('#zw-logo');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const video = content.querySelector('#zw-show-video') || content.querySelector('#zw-movie-video');
      if (video) video.pause();
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentPage = link.dataset.page;
      searchQuery = '';
      searchInput.value = '';
      setRoute('');
      renderPage();
    });
  });

  logo.addEventListener('click', () => {
    const video = content.querySelector('#zw-show-video') || content.querySelector('#zw-movie-video');
    if (video) video.pause();
    
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks[0].classList.add('active');
    currentPage = 'home';
    searchQuery = '';
    searchInput.value = '';
    setRoute('');
    renderPage();
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderPage();
  });

  modalClose.addEventListener('click', () => {
    const video = content.querySelector('#zw-movie-video');
    if (video) video.pause();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      const video = overlay.querySelector('#zw-movie-video');
      if (video) video.pause();
    }
  });

  window.addEventListener('popstate', handleRouteChange);

  Promise.all([
    fetch(moviesUrl).then(r => r.json()).catch(() => []),
    fetch(showsUrl).then(r => r.json()).catch(() => []),
    fetch(soundsUrl).then(r => r.json()).catch(() => [])
  ]).then(([moviesData, showsData, soundsData]) => {
    movies = moviesData;
    shows = showsData;
    sounds = soundsData;
    
    const route = getRoute();
    if (route) {
      handleRouteChange();
    } else {
      renderPage();
    }
    
    // Load movie durations in background
    loadMovieDurations();
  });
})();