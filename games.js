// === Config ===
let buttonConfigs = [];
let activeTag = null;
let panel = null;

// === Utility Functions ===
const imageCache = new Map();

function preloadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function convertToRawGitHubURL(url) {
  if (typeof url !== 'string' || url.startsWith('http')) return url;
  const match = url.match(/^([^\/]+)\/([^\/]+)(?:\/(.+))?$/);
  if (!match) return url;
  const [, username, repo, rest = 'main'] = match;
  const path = rest.endsWith('/') ? rest : rest + '/';
  return `https://raw.githubusercontent.com/${username}/${repo}/${path}`;
}

function makeAbsoluteURL(baseUrl, resourcePath) {
  if (!resourcePath) return resourcePath;
  if (/^(https?:|\/\/|data:|mailto:|javascript:|#)/i.test(resourcePath)) return resourcePath;
  const path = resourcePath.startsWith('/') ? resourcePath.slice(1) : resourcePath;
  return baseUrl + path;
}

// === Game Loading Functions ===
async function loadGameBuild(rawOrShorthandUrl) {
  try {
    let baseUrl = convertToRawGitHubURL(rawOrShorthandUrl);
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    const fetchCache = new Map();
    const cachedFetch = (url) => {
      if (fetchCache.has(url)) return fetchCache.get(url);
      const p = fetch(url);
      fetchCache.set(url, p);
      return p;
    };

    const resp = await cachedFetch(baseUrl + 'index.html');
    if (!resp.ok) throw new Error(`Failed to fetch index.html: ${resp.status}`);
    let htmlText = await resp.text();

    const externalScriptPatterns = [
      /https:\/\/apis\.google\.com/gi,
      /https?:\/\/connect\.facebook\.net/gi,
      /https?:\/\/cdn\.ravenjs\.com/gi,
      /https:\/\/.*doorbell\.io/gi,
      /https?:\/\/.*googletagmanager/gi,
      /https?:\/\/.*analytics/gi,
      /https?:\/\/static\.addtoany/gi
    ];

    htmlText = htmlText.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
      for (const pattern of externalScriptPatterns) {
        if (pattern.test(match)) return '';
      }
      return match;
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    let baseEl = doc.querySelector('base');
    if (!baseEl) {
      baseEl = doc.createElement('base');
      baseEl.href = baseUrl;
      (doc.head || doc.documentElement).insertBefore(baseEl, doc.head?.firstChild || null);
    } else {
      baseEl.href = baseUrl;
    }

    const linkEls = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    for (const link of linkEls) {
      const href = link.getAttribute('href') || '';
      const absHref = makeAbsoluteURL(baseUrl, href);

      try {
        const cssResp = await cachedFetch(absHref);
        if (!cssResp.ok) throw new Error('CSS fetch failed');
        let cssText = await cssResp.text();
        const cssDir = absHref.substring(0, absHref.lastIndexOf('/') + 1);

        cssText = cssText.replace(/url\(([^)]+)\)/gi, (match, p1) => {
          const clean = p1.trim().replace(/^['"]|['"]$/g, '');
          if (/^(data:|https?:|\/\/)/i.test(clean)) return match;
          return `url("${makeAbsoluteURL(cssDir, clean)}")`;
        });

        const styleEl = doc.createElement('style');
        styleEl.textContent = cssText;
        link.replaceWith(styleEl);
      } catch {
        link.href = absHref;
      }
    }

    const scriptEls = Array.from(doc.querySelectorAll('script[src]'));
    for (const script of scriptEls) {
      const src = script.getAttribute('src') || '';
      const absSrc = makeAbsoluteURL(baseUrl, src);

      try {
        const jsResp = await cachedFetch(absSrc);
        if (!jsResp.ok) throw new Error('JS fetch failed');
        const jsText = await jsResp.text();
        const inline = doc.createElement('script');
        inline.textContent = jsText;
        script.replaceWith(inline);
      } catch {
        script.src = absSrc;
      }
    }

    const resourceAttrs = [
      { sel: 'img', attr: 'src' },
      { sel: 'audio', attr: 'src' },
      { sel: 'video', attr: 'src' },
      { sel: 'source', attr: 'src' },
      { sel: 'iframe', attr: 'src' },
      { sel: 'a', attr: 'href' },
      { sel: 'link[rel="icon"]', attr: 'href' }
    ];

    for (const { sel, attr } of resourceAttrs) {
      for (const node of doc.querySelectorAll(sel)) {
        const val = node.getAttribute(attr);
        if (!val || /^(https?:|\/\/|data:|mailto:|javascript:)/i.test(val)) continue;
        node.setAttribute(attr, makeAbsoluteURL(baseUrl, val));
      }
    }

    const runtimeFix = doc.createElement('script');
    runtimeFix.textContent = `
      (function() {
        const base = ${JSON.stringify(baseUrl)};
        const origFetch = window.fetch;
        window.fetch = function(input, init) {
          try {
            if (typeof input === 'string' && !/^(https?:|data:|blob:)/i.test(input)) {
              input = new URL(input, base).href;
            }
          } catch(e) {}
          return origFetch.call(this, input, init);
        };

        const origXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
          try {
            if (url && !/^(https?:|data:|blob:)/i.test(url)) {
              url = new URL(url, base).href;
            }
          } catch(e) {}
          return origXHROpen.apply(this, arguments);
        };

        const origWorker = window.Worker;
        window.Worker = function(url, options) {
          if (!/^(https?:|blob:)/i.test(url)) {
            url = new URL(url, base).href;
          }
          return new origWorker(url, options);
        };
      })();
    `;
    (doc.head || doc.documentElement).appendChild(runtimeFix);

    const finalHtml = '<!doctype html>\n' + doc.documentElement.outerHTML;
    return URL.createObjectURL(new Blob([finalHtml], { type: 'text/html' }));
  } catch (e) {
    console.error('Error building game:', e);
    throw e;
  }
}

async function injectRuffle() {
  return new Promise((resolve) => {
    if (window.RufflePlayer) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@ruffle-rs/ruffle";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

async function enableRuffleSave(player, gameUrl) {
  const saveKey = `zephware_ruffle_${gameUrl}`;
  
  try {
    const savedData = localStorage.getItem(saveKey);
    if (savedData && player.setLocalStorageData) {
      player.setLocalStorageData(JSON.parse(savedData));
    }
  } catch (e) {
    console.warn('Could not load Ruffle save:', e);
  }

  setInterval(() => {
    try {
      const saveData = player.getLocalStorageData?.();
      if (saveData) {
        localStorage.setItem(saveKey, JSON.stringify(saveData));
      }
    } catch (e) {}
  }, 3000);
}

// === Game Build Saving ===
function getGameSaveKey(config) {
  return `zephware_game_${config.label || config.url}`;
}

function saveGameState(config, iframe) {
  if (!iframe || !iframe.contentWindow) return;
  
  try {
    const saveKey = getGameSaveKey(config);
    const state = {
      url: iframe.src,
      timestamp: Date.now()
    };
    localStorage.setItem(saveKey, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save game state:', e);
  }
}

// === UI ===
function createTitleBar() {
  const bar = document.createElement('div');
  bar.className = 'title-bar';

  const left = document.createElement('div');
  left.className = 'title-bar-left';

  const logo = document.createElement('img');
  logo.className = 'title-bar-logo';
  logo.src = 'https://raw.githubusercontent.com/TrulyZeph/Zephware/refs/heads/main/assets/Zephware.png';
  left.appendChild(logo);

  const title = document.createElement('div');
  title.className = 'title-bar-title';
  title.textContent = 'Zephware';
  left.appendChild(title);

  const searchBar = document.createElement('input');
  searchBar.className = 'title-bar-search';
  searchBar.type = 'text';
  searchBar.placeholder = 'Search games...';

  const right = document.createElement('div');
  right.className = 'title-bar-right';

  const buttons = [
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
      title: 'Report',
      svg: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
      handler: () => window.open('https://forms.gle/h5DHdt5EnsT3bwqP7', '_blank')
    },
    {
      title: 'Settings',
      svg: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
      handler: createSettingsPanel
    }
  ];

  buttons.forEach(btn => {
    const button = document.createElement('button');
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
  const container = document.querySelector('.game-grid');
  if (!container) return;

  container.innerHTML = '';
  
  configs.forEach(config => {
    const card = document.createElement('button');
    card.className = 'game-card';

    const img = document.createElement('img');
    img.className = 'game-card-image';
    img.src = config.image;
    img.alt = config.label || '';
    card.appendChild(img);

    const label = document.createElement('div');
    label.className = 'game-card-label';
    label.textContent = config.label || '';
    card.appendChild(label);

    card.addEventListener('click', () => openGame(config));
    container.appendChild(card);
  });
}

async function openGame(config) {
  if (!panel) return;
  panel.remove();

  let url = config.url;

  if (config.type === 'gameBuild' || (/gameBuilds|github|raw.githubusercontent.com/i.test(url) && !url.endsWith('.swf'))) {
    try {
      url = await loadGameBuild(url);
    } catch (e) {
      console.error('Failed to load game build:', e);
      alert('Failed to load game. Please try again.');
      return;
    }
  }

  if (url && url.endsWith('.swf')) {
    try {
      await injectRuffle();
      const ruffle = window.RufflePlayer.newest();
      const player = ruffle.createPlayer();
      player.className = 'game-player';
      document.body.appendChild(player);
      await enableRuffleSave(player, config.url || url);
      player.load(url);
    } catch (e) {
      console.error('Ruffle error:', e);
      alert('Could not run Flash game.');
    }
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.className = 'game-player';
  iframe.src = url;
  iframe.allow = "autoplay; fullscreen; gamepad; microphone; camera";
  iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals";
  document.body.appendChild(iframe);

  if (config.type === 'gameBuild') {
    setInterval(() => saveGameState(config, iframe), 5000);
  }
}

function createPanel() {
  fetch('https://raw.githubusercontent.com/EternallyHyper/Hyperware/main/data/css/games.css')
    .then(r => r.text())
    .then(css => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    })
    .catch(err => console.error('CSS failed to load:', err));

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap';
  document.head.appendChild(fontLink);

  panel = document.createElement('div');
  panel.className = 'games-panel custom-scroll';

  const titleBar = createTitleBar();
  panel.appendChild(titleBar);

  const container = document.createElement('div');
  container.className = 'game-grid';
  panel.appendChild(container);

  let filteredConfigs = buttonConfigs.filter(cfg => !cfg.highlighted);

  titleBar._searchBar.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
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

// === Modal Functions ===
function showTagsModal() {
  if (document.querySelector('.modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.remove();
  modal.appendChild(closeBtn);

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Filter by Tag';
  modal.appendChild(title);

  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'tags-container';

  const tags = ['Simulator', 'Fighting', 'RPG', 'Puzzle', 'Action', 'Strategy'];
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag-button';
    if (activeTag === tag) btn.classList.add('active');
    btn.textContent = tag;
    btn.onclick = () => {
      activeTag = activeTag === tag ? null : tag;
      const filtered = buttonConfigs.filter(cfg =>
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
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal roller-modal';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.remove();
  modal.appendChild(closeBtn);

  let rolling = true;
  let currentIdx = Math.floor(Math.random() * buttonConfigs.length);
  let cycles = 0;

  const gameBtn = document.createElement('button');
  gameBtn.className = 'roller-game';

  const img = document.createElement('img');
  img.className = 'roller-image';
  gameBtn.appendChild(img);

  const label = document.createElement('div');
  label.className = 'roller-label';
  gameBtn.appendChild(label);

  function updateGame() {
    const cfg = buttonConfigs[currentIdx];
    img.src = cfg.image;
    label.textContent = cfg.label || '';
  }

  updateGame();

  const interval = setInterval(() => {
    currentIdx = Math.floor(Math.random() * buttonConfigs.length);
    updateGame();
    if (++cycles >= 30) {
      clearInterval(interval);
      rolling = false;
      gameBtn.onclick = () => {
        overlay.remove();
        openGame(buttonConfigs[currentIdx]);
      };
    }
  }, 100);

  modal.appendChild(gameBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function createSettingsPanel() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal settings-panel';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.remove();
  modal.appendChild(closeBtn);

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Settings';
  modal.appendChild(title);

  const content = document.createElement('div');
  content.className = 'settings-content';
  content.innerHTML = '<h3>Miscellaneous</h3><p>No settings available yet.</p>';
  modal.appendChild(content);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// === Loading ===
function loadGameList() {
  fetch('https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/data/json/gamelist.json')
    .then(response => response.json())
    .then(data => {
      buttonConfigs = data;
      data.slice(0, 10).forEach(cfg => {
        if (cfg.image) preloadImage(cfg.image);
      });
      createPanel();
    })
    .catch(error => {
      console.error('Error loading game list:', error);
      alert('Failed to load games. Please try again.');
    });
}

loadGameList();
