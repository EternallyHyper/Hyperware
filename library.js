(function () {
  const moviesUrl = "https://d1kusoubqqwr7w.cloudfront.net/data/json/movies.json";
  const showsUrl = "https://d1kusoubqqwr7w.cloudfront.net/data/json/shows.json";
  const soundsUrl = "https://d1kusoubqqwr7w.cloudfront.net/data/json/sounds.json";
  const updatelogUrl = "https://d1kusoubqqwr7w.cloudfront.net/data/json/updatelog.json";

  if (!document.getElementById('fredoka-font-link')) {
    const link = document.createElement('link');
    link.id = 'fredoka-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'data/css/library.css';
  document.head.appendChild(style);

  const navbar = document.createElement("div");
  navbar.id = "zw-navbar";
  navbar.innerHTML = `
    <div id="zw-logo">Hyperware</div>
    <div id="zw-nav-links">
      <a class="zw-nav-link active" data-page="home">Home</a>
      <a class="zw-nav-link" data-page="movies">Movies</a>
      <a class="zw-nav-link" data-page="shows">Shows</a>
      <a class="zw-nav-link" data-page="sounds">Sounds</a>
      <a class="zw-nav-link" data-page="updatelog">Update Log</a>
    </div>
    <input type="search" id="zw-search" placeholder="Search..."/>
  `;
  document.body.appendChild(navbar);

  const content = document.createElement("div");
  content.id = "zw-content";
  document.body.appendChild(content);

  const overlay = document.createElement("div");
  overlay.id = "zw-overlay";
  overlay.innerHTML = `<button id="zw-modal-close">Ã—</button>`;
  document.body.appendChild(overlay);

  let movies = [];
  let shows = [];
  let sounds = [];
  let updatelogData = { new: [], next: [], old: []};
  let currentPage = 'home';
  let searchQuery = '';
  let watchupdatelog = {};

  try {
    const saved = localStorage.getItem('zw-watch-updatelog');
    if (saved) watchupdatelog = JSON.parse(saved);
  } catch (e) {}

  function saveWatchupdatelog() {
    try {
      localStorage.setItem('zw-watch-updatelog', JSON.stringify(watchupdatelog));
    } catch (e) {}
  }

  function updateWatchupdatelog(id, season, episode, time, isDub = false) {
    watchupdatelog[id] = { season, episode, time, isDub, timestamp: Date.now() };
    saveWatchupdatelog();
  }

  const navLinks = navbar.querySelectorAll('.zw-nav-link');
  const searchInput = navbar.querySelector('#zw-search');
  const modalClose = overlay.querySelector('#zw-modal-close');
  const logo = navbar.querySelector('#zw-logo');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (content.querySelector('#zw-show-modal')) {
        const video = content.querySelector('#zw-show-video');
        if (video) video.pause();
      }
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentPage = link.dataset.page;
      searchQuery = '';
      searchInput.value = '';
      renderPage();
    });
  });

  logo.addEventListener('click', () => {
    if (content.querySelector('#zw-show-modal')) {
      currentPage = 'home';
      navLinks.forEach(l => l.classList.remove('active'));
      navLinks[0].classList.add('active');
      searchQuery = '';
      searchInput.value = '';
      renderPage();
      return;
    }
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks[0].classList.add('active');
    currentPage = 'home';
    searchQuery = '';
    searchInput.value = '';
    renderPage();
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderPage();
  });

  modalClose.addEventListener('click', () => {
    overlay.classList.remove('active');
    overlay.innerHTML = `<button id="zw-modal-close">Ã—</button>`;
    const newClose = overlay.querySelector('#zw-modal-close');
    newClose.addEventListener('click', () => {
      overlay.classList.remove('active');
      overlay.innerHTML = `<button id="zw-modal-close">Ã—</button>`;
      modalClose.addEventListener('click', arguments.callee);
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      overlay.innerHTML = `<button id="zw-modal-close">Ã—</button>`;
      const newClose = overlay.querySelector('#zw-modal-close');
      newClose.addEventListener('click', () => {
        overlay.classList.remove('active');
        overlay.innerHTML = `<button id="zw-modal-close">Ã—</button>`;
        modalClose.addEventListener('click', arguments.callee);
      });
    }
  });

  function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'zw-card';
    const thumbStyle = movie.cover ? `background-image: url('${movie.cover}');` : '';
    const tags = Array.isArray(movie.tags) ? movie.tags.join(' â€¢ ') : movie.tags || movie.category || '';
    card.innerHTML = `
      <div class="zw-card-thumbnail" style="${thumbStyle}">
        ${!movie.cover ? 'ðŸŽ¬' : ''}
      </div>
      <div class="zw-card-info">
        <div class="zw-card-title">${movie.name}</div>
        <div class="zw-card-category">${tags}</div>
      </div>
    `;
    card.addEventListener('click', () => openMovieModal(movie));
    return card;
  }

  function createShowCard(show) {
    const card = document.createElement('div');
    card.className = 'zw-card';
    const thumbStyle = show.cover ? `background-image: url('${show.cover}');` : '';
    
    function parseEpisodeCount(s) {
      if (typeof s.episodes === 'number') return s.episodes;
      if (typeof s.episodes === 'string' && s.episodes.includes('-')) {
        const parts = s.episodes.split('-').map(p => parseInt(p.trim()));
        return parts[1] - parts[0] + 1;
      }
      return 0;
    }
    
    const totalEpisodes = show.seasons.reduce((sum, s) => sum + parseEpisodeCount(s), 0);
    card.innerHTML = `
      <div class="zw-card-thumbnail" style="${thumbStyle}">
        ${!show.cover ? 'ðŸ“º' : ''}
      </div>
      <div class="zw-card-info">
        <div class="zw-card-title">${show.name}</div>
        <div class="zw-card-category">${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''} â€¢ ${totalEpisodes} Episodes</div>
      </div>
    `;
    card.addEventListener('click', () => openShowModal(show));
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
    const movieId = movie.name.replace(/\s+/g, '-').toLowerCase();
    const updatelog = watchupdatelog[movieId];
    
    overlay.innerHTML = `
      <button id="zw-modal-close">Ã—</button>
      <div id="zw-movie-modal">
        <div id="zw-movie-video-container">
          <video id="zw-movie-video" controls autoplay>
            <source src="${movie.url}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        <div id="zw-movie-title">${movie.name}</div>
        <div id="zw-movie-category">${Array.isArray(movie.tags) ? movie.tags.join(' â€¢ ') : movie.tags || movie.category || ''}</div>
      </div>
    `;
    
    const newClose = overlay.querySelector('#zw-modal-close');
    newClose.addEventListener('click', () => {
      overlay.classList.remove('active');
      overlay.innerHTML = `<button id="zw-modal-close">Ã—</button>`;
    });
    
    const video = overlay.querySelector('#zw-movie-video');
    
    if (updatelog && updatelog.time) {
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = updatelog.time;
      }, { once: true });
    }
    
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > 0) {
        updateWatchupdatelog(movieId, null, null, video.currentTime);
      }
    });
    
    overlay.classList.add('active');
  }

  function openShowModal(show) {
    const showId = show.name.replace(/\s+/g, '-').toLowerCase();
    const updatelog = watchupdatelog[showId];
    
    function parseEpisodeRange(eps) {
      if (typeof eps === 'number') return { start: 1, end: eps };
      if (typeof eps === 'string' && eps.includes('-')) {
          const parts = eps.split('-').map(p => parseInt(p.trim()));
          return { start: parts[0], end: parts[1] };
      }
      return { start: 1, end: 0 };
    }

    function getSeasonStartEpisode(seasons, seasonIndex) {
      let start = 1;
      for (let i = 0; i < seasonIndex; i++) {
          const prev = seasons[i];
          const range = parseEpisodeRange(prev.episodes);
          start += (range.end - range.start + 1);
      }
      return start;
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

    function initSeasonPlayback(initialSeason) {
      const seasonIndex = show.seasons.indexOf(initialSeason);
      const seasonStart = initialSeason.continue
          ? getSeasonStartEpisode(show.seasons, seasonIndex)
          : 1;

      currentSeason = initialSeason;
      currentSeasonIndex = seasonIndex;
      currentEpisodeNum = seasonStart;

      const fileNumber = initialSeason.continue
          ? seasonStart
          : 1;

      video.src = `${initialSeason.url}${currentIsDub ? 'Dub/' : ''}${fileNumber}.mp4`;
      video.load();
      video.play();

      renderEpisodes(initialSeason, seasonIndex);
    }

    let initialSeason = show.seasons[0];
    let initialEpisode = 1;
    let initialTime = 0;
    let initialIsDub = false;

    if (updatelog) {
      const savedSeason = show.seasons.find(s => {
        const seasonName = typeof s.season === 'string' ? s.season : (s.sname || `Season ${s.season}`);
        return seasonName === updatelog.season;
      });
      if (savedSeason) {
        initialSeason = savedSeason;
        initialEpisode = updatelog.episode || 1;
        initialTime = updatelog.time || 0;
        initialIsDub = updatelog.isDub || false;
      }
    }

    const initialRange = parseEpisodeRange(initialSeason.episodes);
    const firstEpisode = initialSeason.names && initialSeason.names.length > 0 ?
      (initialSeason.names.find(e => e.ep === initialEpisode) || { ep: initialEpisode, name: `Episode ${initialEpisode}` }) :
      { ep: initialEpisode, name: `Episode ${initialEpisode}` };

    navLinks.forEach(l => l.classList.remove('active'));

    const tags = Array.isArray(show.tags) ? show.tags : (show.tags ? [show.tags] : []);
    const tagsHtml = tags.map(tag => `<span class="zw-tag">${tag}</span>`).join('');
    
    function getTotalEpisodes() {
      return show.seasons.reduce((sum, s) => {
        const range = parseEpisodeRange(s.episodes);
        return sum + (range.end - range.start + 1);
      }, 0);
    }

    content.innerHTML = `
      <div id="zw-show-modal">
        <div id="zw-show-layout">
          <div id="zw-show-video-area">
            <div id="zw-show-video-container">
              <video id="zw-show-video" controls autoplay>
                <source src="${initialSeason.url}${initialIsDub && initialSeason.dub ? 'Dub/' : ''}${firstEpisode.ep}.mp4" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
            <div id="zw-show-description">
              <h3>${show.name}</h3>
              <div class="zw-show-meta">${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''} â€¢ ${getTotalEpisodes()} Episodes</div>
              <div class="zw-show-tags">${tagsHtml}</div>
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

    let currentSeason = initialSeason;
    let currentSeasonIndex = 0;
    let currentEpisodeNum = initialEpisode;
    let currentIsDub = initialIsDub;

    show.seasons.forEach((season, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      const seasonName = typeof season.season === 'string' ? season.season : (season.sname || `Season ${season.season}`);
      option.textContent = seasonName;
      if (season === initialSeason) {
        option.selected = true;
        currentSeasonIndex = idx;
      }
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
        const range = parseEpisodeRange(currentSeason.episodes);
        const fileNumber = currentEpisodeNum - range.start + 1;
        const url = `${currentSeason.url}${currentIsDub ? 'Dub/' : ''}${fileNumber}.mp4`;
        const currentTime = video.currentTime;
        video.src = url;
        video.load();
        video.currentTime = currentTime;
        video.play();
      }
    });

    function renderEpisodes(season, seasonIdx) {
      episodesContainer.innerHTML = '';

      const range = parseEpisodeRange(season.episodes);
      const globalStart = season.continue
          ? getSeasonStartEpisode(show.seasons, seasonIdx)
          : 1;

      for (let i = 0; i < range.end; i++) {
          const displayNumber = globalStart + i;

          const item = document.createElement('div');
          item.className = 'zw-episode-item';
          if (displayNumber === currentEpisodeNum) item.classList.add('active');

          item.innerHTML = `
            <div class="zw-episode-number">Episode ${displayNumber}</div>
            <div class="zw-episode-name">Episode ${displayNumber}</div>
          `;

          item.addEventListener('click', () => {
            episodesContainer.querySelectorAll('.zw-episode-item').forEach(e => e.classList.remove('active'));
            item.classList.add('active');

            currentEpisodeNum = displayNumber;

            const fileNumber = season.continue
                ? displayNumber
                : i + 1;

            video.src = `${season.url}${currentIsDub ? 'Dub/' : ''}${fileNumber}.mp4`;
            video.load();
            video.play();
          });

          episodesContainer.appendChild(item);
      }
    }

    renderEpisodes(initialSeason, currentSeasonIndex);

    video.addEventListener('loadedmetadata', () => {
      if (initialTime > 0 && Math.abs(video.currentTime - initialTime) > 1) {
        video.currentTime = initialTime;
      }
    }, { once: true });

    video.addEventListener('timeupdate', () => {
      if (currentEpisodeNum && video.currentTime > 0) {
        const seasonName = typeof currentSeason.season === 'string' ?
          currentSeason.season :
          (currentSeason.sname || `Season ${currentSeason.season}`);
        updateWatchupdatelog(showId, seasonName, currentEpisodeNum, video.currentTime, currentIsDub);
      }
    });
  }

  function filterContent(items, type) {
    if (!searchQuery) return items;
    return items.filter(item => item.name.toLowerCase().includes(searchQuery));
  }

  function getContinueWatching() {
    const watching = [];
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    for (const [id, data] of Object.entries(watchupdatelog)) {
      if (now - data.timestamp > thirtyDays) continue;
      
      const show = shows.find(s => s.name.replace(/\s+/g, '-').toLowerCase() === id);
      const movie = movies.find(m => m.name.replace(/\s+/g, '-').toLowerCase() === id);
      
      if (show) {
        watching.push({ type: 'show', item: show, updatelog: data });
      } else if (movie) {
        watching.push({ type: 'movie', item: movie, updatelog: data });
      }
    }
    
    return watching.sort((a, b) => b.updatelog.timestamp - a.updatelog.timestamp);
  }

  function renderPage() {
    if (currentPage === 'home') {
      content.innerHTML = `
        <div id="zw-hero">
          <div id="zw-hero-text">
            <h1>Zephware Library</h1>
            <p><i>your favorite content, at school, unblocked.</i></p>
          </div>
        </div>
      `;
      
      const continueWatching = getContinueWatching();
      if (continueWatching.length > 0) {
        const section = document.createElement('div');
        section.className = 'zw-section';
        section.innerHTML = `
          <div class="zw-section-title">Continue Watching</div>
          <div class="zw-row-wrapper">
            <div class="zw-scroll-arrow left">â€¹</div>
            <div class="zw-row"></div>
            <div class="zw-scroll-arrow right">â€º</div>
          </div>
        `;
        const row = section.querySelector('.zw-row');
        const leftArrow = section.querySelector('.zw-scroll-arrow.left');
        const rightArrow = section.querySelector('.zw-scroll-arrow.right');
        
        continueWatching.forEach(({ type, item }) => {
          if (type === 'show') row.appendChild(createShowCard(item));
          else if (type === 'movie') row.appendChild(createMovieCard(item));
        });
        
        leftArrow.addEventListener('click', () => {
          row.scrollBy({ left: -400, behavior: 'smooth' });
        });
        
        rightArrow.addEventListener('click', () => {
          row.scrollBy({ left: 400, behavior: 'smooth' });
        });
        
        content.appendChild(section);
      }
      
      const filteredMovies = filterContent(movies, 'movies');
      const filteredShows = filterContent(shows, 'shows');
      const filteredSounds = filterContent(sounds, 'sounds');
      
      if (filteredMovies.length > 0) renderSection('Movies', filteredMovies, 'movie');
      if (filteredShows.length > 0) renderSection('Shows', filteredShows, 'show');
      if (filteredSounds.length > 0) {
        const homeSounds = filteredSounds.slice(0, 14);
        renderSoundsSection('Sounds', homeSounds);
      }
      
    } else if (currentPage === 'movies') {
      const filteredMovies = filterContent(movies, 'movies');
      content.innerHTML = '';
      
      if (filteredMovies.length === 0) {
        content.innerHTML = `
          <div class="zw-empty-state">
            <div class="zw-empty-state-icon">ðŸŽ¬</div>
            <div class="zw-empty-state-text">No movies found</div>
          </div>
        `;
        return;
      }
      
      const categories = [...new Set(filteredMovies.map(m => {
        if (Array.isArray(m.tags)) return m.tags[0];
        return m.tags || m.category || 'Other';
      }))];
      categories.forEach(cat => {
        const catMovies = filteredMovies.filter(m => {
          if (Array.isArray(m.tags)) return m.tags.includes(cat);
          return (m.tags || m.category) === cat;
        });
        renderSection(cat, catMovies, 'movie');
      });
      
    } else if (currentPage === 'shows') {
      const filteredShows = filterContent(shows, 'shows');
      content.innerHTML = '';
      
      if (filteredShows.length === 0) {
        content.innerHTML = `
          <div class="zw-empty-state">
            <div class="zw-empty-state-icon">ðŸ“º</div>
            <div class="zw-empty-state-text">No shows found</div>
          </div>
        `;
        return;
      }
      
      const categories = [...new Set(filteredShows.map(s => {
        if (Array.isArray(s.tags)) return s.tags[0];
        return s.tags || s.category || 'Other';
      }))];
      categories.forEach(cat => {
        const catShows = filteredShows.filter(s => {
          if (Array.isArray(s.tags)) return s.tags.includes(cat);
          return (s.tags || s.category) === cat;
        });
        renderSection(cat, catShows, 'show');
      });
      
    } else if (currentPage === 'sounds') {
      const filteredSounds = filterContent(sounds, 'sounds');
      content.innerHTML = '';
      
      if (filteredSounds.length === 0) {
        content.innerHTML = `
          <div class="zw-empty-state">
            <div class="zw-empty-state-icon">ðŸ”Š</div>
            <div class="zw-empty-state-text">No sounds found</div>
          </div>
        `;
        return;
      }
      
      renderSoundsSection('All Sounds', filteredSounds);
      
    } else if (currentPage === 'updatelog') {
      content.innerHTML = `
        <div class="zw-updatelog-tabs">
          <button class="zw-updatelog-tab active" data-week="new">What's New</button>
          <button class="zw-updatelog-tab" data-week="next">What's Next</button>
          <button class="zw-updatelog-tab" data-week="old">What'd I Miss</button>
        </div>
        <div class="zw-updatelog-content" id="zw-updatelog-display"></div>
      `;
      
      const tabs = content.querySelectorAll('.zw-updatelog-tab');
      const display = content.querySelector('#zw-updatelog-display');
      
      function showWeek(week) {
        const items = updatelogData[week] || [];
        display.innerHTML = '';
        
        if (items.length === 0) {
          display.innerHTML = '<div class="zw-empty-state"><div class="zw-empty-state-icon">ðŸ“…</div><div class="zw-empty-state-text">No updates scheduled for this week</div></div>';
          return;
        }
        
        items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'zw-updatelog-item';
          div.innerHTML = `
            <h4>${item.title}</h4>
            <p>${item.description}</p>
          `;
          display.appendChild(div);
        });
      }
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          showWeek(tab.dataset.week);
        });
      });
      
      showWeek('new');
    }
  }

  function renderSection(title, items, type) {
    const section = document.createElement('div');
    section.className = 'zw-section';
    section.innerHTML = `
      <div class="zw-section-title">${title}</div>
      <div class="zw-row-wrapper">
        <div class="zw-scroll-arrow left">â€¹</div>
        <div class="zw-row"></div>
        <div class="zw-scroll-arrow right">â€º</div>
      </div>
    `;
    const row = section.querySelector('.zw-row');
    const leftArrow = section.querySelector('.zw-scroll-arrow.left');
    const rightArrow = section.querySelector('.zw-scroll-arrow.right');
    
    items.forEach(item => {
      if (type === 'movie') row.appendChild(createMovieCard(item));
      else if (type === 'show') row.appendChild(createShowCard(item));
    });
    
    leftArrow.addEventListener('click', () => {
      row.scrollBy({ left: -400, behavior: 'smooth' });
    });
    
    rightArrow.addEventListener('click', () => {
      row.scrollBy({ left: 400, behavior: 'smooth' });
    });
    
    content.appendChild(section);
  }

  function renderSoundsSection(title, items) {
    const section = document.createElement('div');
    section.className = 'zw-section';
    section.innerHTML = `
      <div class="zw-section-title">${title}</div>
      <div class="zw-sound-grid"></div>
    `;
    const grid = section.querySelector('.zw-sound-grid');
    items.forEach(item => {
      grid.appendChild(createSoundCard(item));
    });
    content.appendChild(section);
  }

  Promise.all([
    fetch(moviesUrl).then(r => r.json()).catch(() => []),
    fetch(showsUrl).then(r => r.json()).catch(() => []),
    fetch(soundsUrl).then(r => r.json()).catch(() => []),
    fetch(updatelogUrl).then(r => r.json()).catch(() => ({ new: [], next: [], old: []}))
  ]).then(([moviesData, showsData, soundsData, updatelogJson]) => {
    movies = moviesData;
    shows = showsData;
    sounds = soundsData;
    updatelogData = updatelogJson;
    renderPage();
  });
})();