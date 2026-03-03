(function () {
    const nav = document.querySelector(".sgy-tabbed-navigation");
    if (!nav) return console.warn("Error: Navigation Bar not found."), alert("Make sure you're on the schoology website!");

    const li = document.createElement("li");
    li.id = "games-tab";
    li.onclick = () => {
      li.classList.add('active');
      li.setAttribute('aria-current', 'true');
      tabs.forEach(li => {
        if ((li.id === "games-tab") == false) {
          li.classList.remove('active');
          li.setAttribute('aria-current', 'false');
        }
      });
    }
    const a = document.createElement("a");
    a.href = "javascript:void(0)";
    a.textContent = "Games";
    li.appendChild(a);
    nav.appendChild(li);
    const tabs = document.querySelectorAll('.sgy-tabbed-navigation > li');

    async function injectRuffle() {
      if (window.RufflePlayer) return;

      return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/@ruffle-rs/ruffle";
          script.onload = () => resolve();
          script.onerror = reject;
          document.body.appendChild(script);
      });
    }

    const DataLoader = (() => {
        const KEY_PREFIX = 'zephware_save_';
        const SAVE_DEBOUNCE = 250;
        function _hostSet(gameId, obj) { try { localStorage.setItem(KEY_PREFIX + gameId, JSON.stringify(obj)); } catch (e) {} }
        function _hostGet(gameId) { try { const v = localStorage.getItem(KEY_PREFIX + gameId); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
        function _isSameOrigin(iframe) { try { void iframe.contentWindow.location.href; return true; } catch (e) { return false; } }
        async function _directSync(iframe, gameId, options = {}) {
            const win = iframe.contentWindow;
            if (!win) return false;
            const persisted = _hostGet(gameId);
            if (persisted && persisted.__localStorageSnapshot) {
                try { for (const k in persisted.__localStorageSnapshot) { win.localStorage.setItem(k, persisted.__localStorageSnapshot[k]); } } catch {}
            }
            let last = {};
            try { for (let i = 0; i < win.localStorage.length; i++) { const k = win.localStorage.key(i); last[k] = win.localStorage.getItem(k); } } catch { return false; }
            iframe._zwb_directPoll = setInterval(() => {
                try {
                    const snap = {};
                    for (let i = 0; i < win.localStorage.length; i++) snap[win.localStorage.key(i)] = win.localStorage.getItem(win.localStorage.key(i));
                    if (JSON.stringify(snap) !== JSON.stringify(last)) { last = snap; _hostSet(gameId, { __localStorageSnapshot: snap }); }
                } catch (e) { clearInterval(iframe._zwb_directPoll); }
            }, options.pollInterval || 1000);
            return true;
        }
        function _postMessageBridge(iframe, gameId, origin = '*') {
            const target = iframe.contentWindow;
            if (!target) return false;
            window.addEventListener('message', e => { if (e.data.__zwb_type === 'zephware_save') _hostSet(gameId, { __payload: e.data.payload }); });
            const persisted = _hostGet(gameId);
            target.postMessage({ __zwb_type: 'zephware_restore', payload: persisted?.__payload || null }, origin);
            return true;
        }
        async function attach(iframe, opts = {}) {
            if (!iframe || !opts.id) return;
            if (_isSameOrigin(iframe)) { if (await _directSync(iframe, opts.id, opts)) return; }
            _postMessageBridge(iframe, opts.id, opts.origin || '*');
        }
        return { attach, _hostGet, _hostSet };
    })();

    async function enableRuffleSavePersistence(player, gameId) {
        const KEY = 'ruffle_sol_' + gameId;
        player.config = player.config || {};
        player.config.storageBackend = {
            async getItem(n) { return JSON.parse(localStorage.getItem(KEY) || '{}')[n] || null; },
            async setItem(n, v) { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); d[n] = v; localStorage.setItem(KEY, JSON.stringify(d)); }
        };
    }

    async function embedGame(game) {
        const container = document.getElementById("home-feed-container");
        container.innerHTML = `
            <p style="padding:20px;color:#fff;">Loading ${game.label}...</p>
        `;

        const url = game.url.toString();
        container.innerHTML = "";

        if (url.endsWith(".swf")) {
            await injectRuffle();
            const ruffle = window.RufflePlayer.newest();
            const player = ruffle.createPlayer();
            player.style.width = "100%";
            player.style.height = "80vh";
            player.style.border = "none";
            container.appendChild(player);
            await enableRuffleSavePersistence(player, game.url);
            player.load(url);
        } else {
            const iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.style.width = "100%";
            iframe.style.height = "80vh";
            iframe.style.border = "none";
            container.appendChild(iframe);
            DataLoader.attach(iframe, { id: game.url, auto: true, origin: "*" });
        }
    }

    async function showGames() {
        const container = document.getElementById("home-feed-container");
        container.innerHTML = `<p style="padding:20px;">Loading games...</p>`;

        const res = await fetch("https://raw.githubusercontent.com/TrulyZeph/Zephware/main/data/gamelist.json");
        const games = await res.json();
        container.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.flexWrap = "wrap";
        wrapper.style.gap = "10px";
        wrapper.style.padding = "15px";

        games.forEach(game => {
            const card = document.createElement("div");
            card.style.width = "110px";
            card.style.cursor = "pointer";
            card.style.background = "#0677BA";
            card.style.borderRadius = "6px";
            card.style.padding = "6px";
            card.style.textAlign = "center";
            card.style.color = "#fff";

            const img = document.createElement("img");
            img.src = game.image;
            img.style.width = "100%";
            img.style.height = "70px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "4px";

            const title = document.createElement("div");
            title.textContent = game.label;
            title.style.marginTop = "3px";
            title.style.fontSize = "12px";
            title.style.fontWeight = "600";

            card.appendChild(img);
            card.appendChild(title);
            wrapper.appendChild(card);

            card.onclick = () => embedGame(game);
        });

        container.appendChild(wrapper);
    }

    li.addEventListener("click", showGames);
})();