var ZEPHWARE_URL = "javascript:(()=>{fetch('https://raw.githubusercontent.com/EternallyHyper/Hyperware/main/main.js').then(r=>r.text()).then(t=>{eval(t);console.log('Hyperware Loaded!')}).catch(e=>console.error('Error loading script:',e))})();";

document.title = "Games | Hyperware";

function setFavicon(url) {
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = url;
}

setFavicon("https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/icon.png");

var buttonConfigs = [];
var activeTag = null;
var panel = null;
var slugMap = new Map();
var slugToConfig = new Map();

var imageCache = new Map();

function preloadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  var promise = new Promise((resolve, reject) => {
    var img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function convertToRawGitHubURL(url) {
  if (typeof url !== 'string' || url.startsWith('http')) return url;
  var match = url.match(/^([^\/]+)\/([^\/]+)(?:\/(.+))?$/);
  if (!match) return url;
  var [, username, repo, rest = 'main'] = match;
  var path = rest.endsWith('/') ? rest : rest + '/';
  return `https://raw.githubusercontent.com/${username}/${repo}/${path}`;
}

function makeAbsoluteURL(baseUrl, resourcePath) {
  if (!resourcePath) return resourcePath;
  if (/^(https?:|\/\/|data:|mailto:|javascript:|#)/i.test(resourcePath)) return resourcePath;
  var path = resourcePath.startsWith('/') ? resourcePath.slice(1) : resourcePath;
  return baseUrl + path;
}

function buildSlugMaps(configs) {
  slugMap = new Map();
  slugToConfig = new Map();

  var baseCount = {};

  configs.forEach(cfg => {
    var base = (cfg.label || 'game')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    baseCount[base] = (baseCount[base] || 0) + 1;
  });

  var seen = {};
  configs.forEach(cfg => {
    var base = (cfg.label || 'game')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    var slug;
    if (baseCount[base] > 1) {
      seen[base] = (seen[base] || 0) + 1;
      slug = `${base}-${seen[base]}`;
    } else {
      slug = base;
    }

    slugMap.set(cfg, slug);
    slugToConfig.set(slug, cfg);
  });
}

function getRoute() {
  var hash = window.location.hash.slice(1);
  return hash.startsWith('/') ? hash.slice(1) : '';
}

function setRoute(slug) {
  window.location.hash = slug ? `#/${slug}` : '';
}

function handleRouteChange() {
  var slug = getRoute();
  if (slug && slugToConfig.has(slug)) {
    openGame(slugToConfig.get(slug), true);
  } else {
    closeGame();
  }
}

async function loadGameBuild(rawOrShorthandUrl) {
  try {
    var baseUrl = convertToRawGitHubURL(rawOrShorthandUrl);
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    var fetchCache = new Map();
    var cachedFetch = (url) => {
      if (fetchCache.has(url)) return fetchCache.get(url);
      var p = fetch(url);
      fetchCache.set(url, p);
      return p;
    };

    var resp = await cachedFetch(baseUrl + 'index.html');
    if (!resp.ok) throw new Error(`Failed to fetch Hyperware: ${resp.status}`);
    var htmlText = await resp.text();

    var externalScriptPatterns = [
      /https:\/\/apis\.google\.com/gi,
      /https?:\/\/connect\.facebook\.net/gi,
      /https?:\/\/cdn\.ravenjs\.com/gi,
      /https:\/\/.*doorbell\.io/gi,
      /https?:\/\/.*googvaragmanager/gi,
      /https?:\/\/.*analytics/gi,
      /https?:\/\/static\.addtoany/gi
    ];

    htmlText = htmlText.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
      for (var pattern of externalScriptPatterns) {
        if (pattern.test(match)) return '';
      }
      return match;
    });

    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlText, 'text/html');

    var baseEl = doc.querySelector('base');
    if (!baseEl) {
      baseEl = doc.createElement('base');
      baseEl.href = baseUrl;
      (doc.head || doc.documentElement).insertBefore(baseEl, doc.head?.firstChild || null);
    } else {
      baseEl.href = baseUrl;
    }

    var linkEls = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    for (var link of linkEls) {
      var href = link.getAttribute('href') || '';
      var absHref = makeAbsoluteURL(baseUrl, href);
      try {
        var cssResp = await cachedFetch(absHref);
        if (!cssResp.ok) throw new Error('CSS fetch failed');
        var cssText = await cssResp.text();
        var cssDir = absHref.substring(0, absHref.lastIndexOf('/') + 1);
        cssText = cssText.replace(/url\(([^)]+)\)/gi, (match, p1) => {
          var clean = p1.trim().replace(/^['"]|['"]$/g, '');
          if (/^(data:|https?:|\/\/)/i.test(clean)) return match;
          return `url("${makeAbsoluteURL(cssDir, clean)}")`;
        });
        var styleEl = doc.createElement('style');
        styleEl.textContent = cssText;
        link.replaceWith(styleEl);
      } catch {
        link.href = absHref;
      }
    }

    var scriptEls = Array.from(doc.querySelectorAll('script[src]'));
    for (var script of scriptEls) {
      var src = script.getAttribute('src') || '';
      var absSrc = makeAbsoluteURL(baseUrl, src);
      try {
        var jsResp = await cachedFetch(absSrc);
        if (!jsResp.ok) throw new Error('JS fetch failed');
        var jsText = await jsResp.text();
        var inline = doc.createElement('script');
        inline.textContent = jsText;
        script.replaceWith(inline);
      } catch {
        script.src = absSrc;
      }
    }

    var resourceAttrs = [
      { sel: 'img', attr: 'src' },
      { sel: 'audio', attr: 'src' },
      { sel: 'video', attr: 'src' },
      { sel: 'source', attr: 'src' },
      { sel: 'iframe', attr: 'src' },
      { sel: 'a', attr: 'href' },
      { sel: 'link[rel="icon"]', attr: 'href' }
    ];

    for (var { sel, attr } of resourceAttrs) {
      for (var node of doc.querySelectorAll(sel)) {
        var val = node.getAttribute(attr);
        if (!val || /^(https?:|\/\/|data:|mailto:|javascript:)/i.test(val)) continue;
        node.setAttribute(attr, makeAbsoluteURL(baseUrl, val));
      }
    }

    var runtimeFix = doc.createElement('script');
    runtimeFix.textContent = `
      (function() {
        var base = ${JSON.stringify(baseUrl)};
        var origFetch = window.fetch;
        window.fetch = function(input, init) {
          try {
            if (typeof input === 'string' && !/^(https?:|data:|blob:)/i.test(input)) {
              input = new URL(input, base).href;
            }
          } catch(e) {}
          return origFetch.call(this, input, init);
        };

        var origXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
          try {
            if (url && !/^(https?:|data:|blob:)/i.test(url)) {
              url = new URL(url, base).href;
            }
          } catch(e) {}
          return origXHROpen.apply(this, arguments);
        };

        var origWorker = window.Worker;
        window.Worker = function(url, options) {
          if (!/^(https?:|blob:)/i.test(url)) {
            url = new URL(url, base).href;
          }
          return new origWorker(url, options);
        };
      })();
    `;
    (doc.head || doc.documentElement).appendChild(runtimeFix);

    var finalHtml = '<!doctype html>\n' + doc.documentElement.outerHTML;
    return URL.createObjectURL(new Blob([finalHtml], { type: 'text/html' }));
  } catch (e) {
    console.error('Error building game:', e);
    throw e;
  }
}

async function injectRuffle() {
  return new Promise((resolve) => {
    if (window.RufflePlayer) { resolve(); return; }
    var script = document.createElement('script');
    script.src = "https://unpkg.com/@ruffle-rs/ruffle";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

async function enableRuffleSave(player, gameUrl) {
  var saveKey = `zephware_ruffle_${gameUrl}`;
  try {
    var savedData = localStorage.getItem(saveKey);
    if (savedData && player.setLocalStorageData) {
      player.setLocalStorageData(JSON.parse(savedData));
    }
  } catch (e) {
    console.warn('Could not load Ruffle save:', e);
  }
  setInterval(() => {
    try {
      var saveData = player.getLocalStorageData?.();
      if (saveData) localStorage.setItem(saveKey, JSON.stringify(saveData));
    } catch (e) {}
  }, 3000);
}

function getGameSaveKey(config) {
  return `zephware_game_${config.label || config.url}`;
}

function saveGameState(config, iframe) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    var saveKey = getGameSaveKey(config);
    var state = { url: iframe.src, timestamp: Date.now() };
    localStorage.setItem(saveKey, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save game state:', e);
  }
}

async function openGame(config, fromRoute = false) {
  if (panel) panel.style.display = 'none';

  document.querySelectorAll('.game-player, .game-back-bar').forEach(el => el.remove());

  if (!fromRoute) {
    setRoute(slugMap.get(config) || '');
  }

  var backBar = document.createElement('div');
  backBar.className = 'game-back-bar';

  var backBtn = document.createElement('button');
  backBtn.className = 'game-back-btn';
  backBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
    Back to Games
  `;
  backBtn.addEventListener('click', () => {
    setRoute('');
  });

  var gameTitle = document.createElement('div');
  gameTitle.className = 'game-back-title';
  gameTitle.textContent = config.label || '';

  backBar.appendChild(backBtn);
  backBar.appendChild(gameTitle);
  document.body.appendChild(backBar);

  var url = config.url;

  if (config.type === 'gameBuild' || (/gameBuilds|github|raw.githubusercontent.com/i.test(url) && !url.endsWith('.swf'))) {
    try {
      url = await loadGameBuild(url);
    } catch (e) {
      console.error('Failed to load game build:', e);
      alert('Failed to load game. Please try again.');
      closeGame();
      return;
    }
  }

  if (url && url.endsWith('.swf')) {
    try {
      await injectRuffle();
      var ruffle = window.RufflePlayer.newest();
      var player = ruffle.createPlayer();
      player.className = 'game-player';
      document.body.appendChild(player);
      await enableRuffleSave(player, config.url || url);
      player.load(url);
    } catch (e) {
      console.error('Ruffle error:', e);
      alert('Could not run Flash game.');
      closeGame();
    }
    return;
  }

  var iframe = document.createElement('iframe');
  iframe.className = 'game-player';
  iframe.src = url;
  iframe.allow = "autoplay; fullscreen; gamepad; microphone; camera";
  iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals";
  document.body.appendChild(iframe);

  if (config.type === 'gameBuild') {
    setInterval(() => saveGameState(config, iframe), 5000);
  }
}

function closeGame() {
  document.querySelectorAll('.game-player, .game-back-bar').forEach(el => el.remove());
  if (panel) panel.style.display = '';
}

function createTitleBar() {
  var bar = document.createElement('div');
  bar.className = 'title-bar';

  var left = document.createElement('div');
  left.className = 'title-bar-left';

  var logo = document.createElement('img');
  logo.className = 'title-bar-logo';
  logo.src = 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/icon.png';
  left.appendChild(logo);

  var title = document.createElement('div');
  title.className = 'title-bar-title';
  title.textContent = 'Hyperware';
  left.appendChild(title);

  var searchBar = document.createElement('input');
  searchBar.className = 'title-bar-search';
  searchBar.type = 'text';
  searchBar.placeholder = 'Search games...';

  var right = document.createElement('div');
  right.className = 'title-bar-right';

  var buttons = [
    {
      title: 'Zephware',
      svg: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
      handler: () => { window.location.href = ZEPHWARE_URL; }
    },
    {
      title: 'Random',
      svg: '<svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/></svg>',
      handler: rollGame
    },
    {
      title: 'Tags',
      svg: '<svg viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>',
      handler: showTagsModal
    },
    {
      title: 'Settings',
      svg: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
      handler: createSettingsPanel
    }
  ];

  buttons.forEach(btn => {
    var button = document.createElement('button');
    button.className = 'icon-button';
    button.title = btn.title;
    button.innerHTML = btn.svg;
    button.onclick = btn.handler;
    right.appendChild(button);
  });

  bar.appendChild(left);
  bar.appendChild(searchBar);
  bar.appendChild(right);

  bar._searchBar = searchBar;
  return bar;
}

function renderGames(configs) {
  var container = document.querySelector('.game-grid');
  if (!container) return;

  container.innerHTML = '';

  configs.forEach(config => {
    var card = document.createElement('button');
    card.className = 'game-card';

    var img = document.createElement('img');
    img.className = 'game-card-image';
    img.src = config.image;
    img.alt = config.label || '';
    card.appendChild(img);

    var label = document.createElement('div');
    label.className = 'game-card-label';
    label.textContent = config.label || '';
    card.appendChild(label);

    card.addEventListener('click', () => {
      setRoute(slugMap.get(config) || '');
    });

    container.appendChild(card);
  });
}

function showTagsModal() {
  if (document.querySelector('.modal-overlay')) return;

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  var modal = document.createElement('div');
  modal.className = 'modal';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.remove();
  modal.appendChild(closeBtn);

  var title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Filter by Tag';
  modal.appendChild(title);

  var tagsContainer = document.createElement('div');
  tagsContainer.className = 'tags-container';

  var tags = ['Simulator', 'Fighting', 'RPG', 'Puzzle', 'Action', 'Strategy'];
  tags.forEach(tag => {
    var btn = document.createElement('button');
    btn.className = 'tag-button';
    if (activeTag === tag) btn.classList.add('active');
    btn.textContent = tag;
    btn.onclick = () => {
      activeTag = activeTag === tag ? null : tag;
      var filtered = buttonConfigs.filter(cfg =>
        !cfg.highlighted &&
        (!activeTag || (Array.isArray(cfg.tag) ? cfg.tag.includes(activeTag) : cfg.tag === activeTag))
      );
      window.zwRenderGames?.(filtered);
      overlay.remove();
    };
    tagsContainer.appendChild(btn);
  });

  modal.appendChild(tagsContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function rollGame() {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  var modal = document.createElement('div');
  modal.className = 'modal roller-modal';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.remove();
  modal.appendChild(closeBtn);

  var currentIdx = Math.floor(Math.random() * buttonConfigs.length);
  var cycles = 0;

  var gameBtn = document.createElement('button');
  gameBtn.className = 'roller-game';

  var img = document.createElement('img');
  img.className = 'roller-image';
  gameBtn.appendChild(img);

  var label = document.createElement('div');
  label.className = 'roller-label';
  gameBtn.appendChild(label);

  function updateGame() {
    var cfg = buttonConfigs[currentIdx];
    img.src = cfg.image;
    label.textContent = cfg.label || '';
  }

  updateGame();

  var interval = setInterval(() => {
    currentIdx = Math.floor(Math.random() * buttonConfigs.length);
    updateGame();
    if (++cycles >= 30) {
      clearInterval(interval);
      gameBtn.onclick = () => {
        overlay.remove();
        setRoute(slugMap.get(buttonConfigs[currentIdx]) || '');
      };
    }
  }, 100);

  modal.appendChild(gameBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function createSettingsPanel() {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  var modal = document.createElement('div');
  modal.className = 'modal settings-panel';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.remove();
  modal.appendChild(closeBtn);

  var title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Settings';
  modal.appendChild(title);

  var content = document.createElement('div');
  content.className = 'settings-content';
  content.innerHTML = '<h3>Miscellaneous</h3><p>No settings available yet.</p>';
  modal.appendChild(content);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function createPanel() {
    fetch('https://raw.githubusercontent.com/EternallyHyper/Hyperware/main/data/css/games.css')
    .then(r => r.text())
    .then(css => {
      var style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    })
    .catch(err => console.error('CSS failed to load:', err));

var fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap';
  document.head.appendChild(fontLink);

  panel = document.createElement('div');
  panel.className = 'games-panel custom-scroll';

  var titleBar = createTitleBar();
  panel.appendChild(titleBar);

  var container = document.createElement('div');
  container.className = 'game-grid';
  panel.appendChild(container);

  var filteredConfigs = buttonConfigs.filter(cfg => !cfg.highlighted);

  titleBar._searchBar.addEventListener('input', (e) => {
    var query = e.target.value.toLowerCase();
    filteredConfigs = buttonConfigs.filter(cfg =>
      !cfg.highlighted &&
      cfg.label?.toLowerCase().includes(query) &&
      (!activeTag || (Array.isArray(cfg.tag) ? cfg.tag.includes(activeTag) : cfg.tag === activeTag))
    );
    renderGames(filteredConfigs);
  });

  window.zwRenderGames = renderGames;
  document.body.appendChild(panel);
  renderGames(filteredConfigs);
}

function loadGameList() {
  fetch('https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/data/json/gamelist.json')
    .then(response => response.json())
    .then(data => {
      buttonConfigs = data;
      buildSlugMaps(data);
      data.slice(0, 10).forEach(cfg => {
        if (cfg.image) preloadImage(cfg.image);
      });
      createPanel();

      window.addEventListener('hashchange', handleRouteChange);
      var initialRoute = getRoute();
      if (initialRoute) {
        handleRouteChange();
      }
    })
    .catch(error => {
      console.error('Error loading game list:', error);
      alert('Failed to load games. Please try again.');
    });
}

loadGameList();