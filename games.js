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

let buttonConfigs = [];
let activeTag = null;
let settingsPanel = null;

function loadGameList() {
	fetch('https://raw.githubusercontent.com/trulyzeph/zephware/main/data/gamelist.json')
		.then(response => response.json())
		.then(data => {
			buttonConfigs = data;
			data.slice(0, 10).forEach(cfg => cfg.image && preloadImage(cfg.image));
			createPanel();
		})
		.catch(error => {
			console.error('Error loading game list:', error);
			alert('Error, Try Again.');
		});
}

function injectRuffle() {
	return new Promise((resolve) => {
		if (window.RufflePlayer) {
			resolve();
			return;
		}
		const script = document.createElement('script');
		script.src = "https://unpkg.com/@ruffle-rs/ruffle";
		script.onload = () => resolve();
		document.body.appendChild(script);
	});
}

function convertToRawGitHubURL(url) {
	if (typeof url !== 'string') return url;
	if (url.startsWith('http')) return url;
	const repoPattern = /^([^\/]+)\/([^\/]+)(?:\/(.+))?$/;
	const match = url.match(repoPattern);
	if (!match) return url;
	const username = match[1];
	const repo = match[2];
	let rest = match[3] || 'main';
	if (!rest.endsWith('/')) rest = rest + '/';
	return `https://raw.githubusercontent.com/${username}/${repo}/${rest}`;
}

function makeAbsoluteFromBase(baseUrl, resourcePath) {
	if (!resourcePath) return resourcePath;
	if (/^(https?:|\/\/|data:|mailto:|javascript:|#)/i.test(resourcePath)) return resourcePath;
	if (resourcePath.startsWith('/')) resourcePath = resourcePath.slice(1);
	return baseUrl + resourcePath;
}

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
		if (!resp.ok) throw new Error('Failed to fetch index.html: ' + resp.status);
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

		htmlText = htmlText.replace(/<script[\s\S]*?<\/script>/gi, (m) => {
			for (const p of externalScriptPatterns) {
				if (p.test(m)) return '';
			}
			return m;
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
			const absHref = makeAbsoluteFromBase(baseUrl, href);

			try {
				const cssResp = await cachedFetch(absHref);
				if (!cssResp.ok) throw 0;
				let cssText = await cssResp.text();
				const cssDir = absHref.substring(0, absHref.lastIndexOf('/') + 1);

				cssText = cssText.replace(/url\(([^)]+)\)/gi, (m, p1) => {
					const clean = p1.trim().replace(/^['"]|['"]$/g, '');
					if (/^(data:|https?:|\/\/)/i.test(clean)) return m;
					return `url("${makeAbsoluteFromBase(cssDir, clean)}")`;
				});

				const styleEl = doc.createElement('style');
				styleEl.textContent = cssText;
				link.replaceWith(styleEl);
			} catch {
				link.href = absHref;
			}
		}

		const scriptEls = Array.from(doc.querySelectorAll('script[src]'));
		for (const s of scriptEls) {
			const src = s.getAttribute('src') || '';
			const absSrc = makeAbsoluteFromBase(baseUrl, src);

			try {
				const jsResp = await cachedFetch(absSrc);
				if (!jsResp.ok) throw 0;
				const jsText = await jsResp.text();
				const inline = doc.createElement('script');
				inline.textContent = jsText;
				s.replaceWith(inline);
			} catch {
				s.src = absSrc;
			}
		}

		const ATTRS = [
			{ sel: 'img', attr: 'src' },
			{ sel: 'audio', attr: 'src' },
			{ sel: 'video', attr: 'src' },
			{ sel: 'source', attr: 'src' },
			{ sel: 'iframe', attr: 'src' },
			{ sel: 'a', attr: 'href' },
			{ sel: 'link[rel="icon"]', attr: 'href' }
		];

		for (const { sel, attr } of ATTRS) {
			for (const node of doc.querySelectorAll(sel)) {
				const val = node.getAttribute(attr);
				if (!val) continue;
				if (/^(https?:|\/\/|data:|mailto:|javascript:)/i.test(val)) continue;
				node.setAttribute(attr, makeAbsoluteFromBase(baseUrl, val));
			}
		}

		const runtimeFix = doc.createElement('script');
		runtimeFix.textContent = `
			const __base = ${JSON.stringify(baseUrl)};
			const __origFetch = window.fetch;
			window.fetch = function(input, init){
				try{
					if (typeof input === 'string' && !/^(https?:|data:|blob:)/i.test(input)) {
						input = new URL(input, __base).href;
					}
				}catch{}
				return __origFetch(input, init);
			};

			const __origOpen = XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.open = function(m,u){
				try{
					if (u && !/^(https?:|data:|blob:)/i.test(u)) {
						u = new URL(u, __base).href;
					}
				}catch{}
				return __origOpen.apply(this, arguments);
			};

			const __origWorker = window.Worker;
			window.Worker = function(u, o){
				if (!/^(https?:|blob:)/i.test(u)) {
					u = new URL(u, __base).href;
				}
				return new __origWorker(u, o);
			};
		`;
		(doc.head || doc.documentElement).appendChild(runtimeFix);

		const finalHtml = '<!doctype html>\n' + doc.documentElement.outerHTML;
		return URL.createObjectURL(new Blob([finalHtml], { type: 'text/html' }));
	} catch (e) {
		console.error('Error building game from repo:', e);
		throw e;
	}
}

async function enableRuffleSavePersistence(player, gameUrl) {
	const saveKey = "zephware_ruffle_" + gameUrl;
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

const globalFontLink = document.createElement('link');
globalFontLink.rel = 'stylesheet';
globalFontLink.href = 'https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@100..900&display=swap';
document.head.appendChild(globalFontLink);

const styles = document.createElement('style');
styles.textContent = `
	* { font-family: 'Grenze Gotisch', sans-serif !important; }
	.custom-scroll-panel { scrollbar-width: none; -ms-overflow-style: none; }
	.custom-scroll-panel::-webkit-scrollbar { display: none; }
	
	.optButton {
		background: #0faada !important;
		border: none;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin: 0 6px;
		cursor: pointer;
		transition: background 0.2s;
	}
	.optButton svg path,
    .optButton svg circle {
		fill: #fff !important;
        stroke: #fff !important;
}
	
	#gradient {
		background: linear-gradient(130deg, #053680ff, #204cacff);
		background-size: 200% 200%;
		animation: gradientAnim 5s ease infinite;
	}
	@keyframes gradientAnim {
		0%, 100% { background-position: 10% 0%; }
		50% { background-position: 91% 100%; }
	}
	
	.game-grid {
		display: grid;
		grid-template-columns: repeat(5, 280px);
		gap: 20px;
		justify-content: center;
		margin: 60px 40px 10px;
	}
	
	.tags-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #181818;
		border-radius: 24px;
		box-shadow: 0 8px 32px rgba(0,0,0,0.3);
		padding: 32px;
		z-index: 100000;
		min-width: 320px;
	}
	.tag-btn {
		background: linear-gradient(45deg, #01AEFD, #00C5FF);
		color: #fff;
		border: none;
		border-radius: 18px;
		font-size: 18px;
		font-weight: bold;
		padding: 10px 28px;
		margin: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}
	.tag-btn:hover { background: #015AFD; }
`;
document.head.appendChild(styles);

function TitleBar() {
	const bar = document.createElement('div');
	bar.style.cssText = 'width:60%;height:50px;margin:20px auto 0;border-radius:15px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px;';
	bar.id = 'gradient';

	const left = document.createElement('div');
	left.style.cssText = 'display:flex;align-items:center;gap:10px;';

	const img = document.createElement('img');
	img.src = 'https://raw.githubusercontent.com/TrulyZeph/Zephware/refs/heads/main/assets/Zephware.png';
	img.style.cssText = 'height:45px;width:auto;margin-left:8px;';
	left.appendChild(img);

	const title = document.createElement('div');
	title.textContent = 'Zephware';
	title.style.cssText = 'font-weight:bold;font-size:28px;background:linear-gradient(to bottom,#0faada,#005da1);-webkit-background-clip:text;color:transparent;';
	left.appendChild(title);

	const searchBar = document.createElement('input');
	searchBar.type = 'text';
	searchBar.placeholder = 'Search';
	searchBar.style.cssText = 'width:420px;max-width:45vw;padding:8px 12px;border-radius:10px;border:none;font-size:14px;background:#262327;color:#01AEFD;margin:0 10px;';

	const right = document.createElement('div');
	right.style.cssText = 'display:flex;align-items:center;';

	const btns = [
		{ title: 'Random', svg: '<svg width="35" height="35" viewBox="0 0 20 20"><path d="M174,7927.1047 C172.896,7927.1047 172,7927.9997 172,7929.1047 C172,7930.2097 172.896,7931.1047 174,7931.1047 C175.104,7931.1047 176,7930.2097 176,7929.1047 C176,7927.9997 175.104,7927.1047 174,7927.1047 L174,7927.1047 Z M182,7921.9997 C182,7921.4477 181.552,7920.9997 181,7920.9997 L167,7920.9997 C166.448,7920.9997 166,7921.4477 166,7921.9997 L166,7935.9997 C166,7936.5527 166.448,7936.9997 167,7936.9997 L181,7936.9997 C181.552,7936.9997 182,7936.5527 182,7935.9997 L182,7921.9997 Z" transform="translate(-164,-7918)"/></svg>', fn: rollGame },
		{ title: 'Tags', svg: '<svg width="40" height="40" viewBox="0 0 24 24"><path d="M8.5 3H11.5118C12.2455 3 12.6124 3 12.9577 3.08289L20.5 10M7.5498 10.0498H7.5598" stroke="#000" stroke-width="2"/></svg>', fn: showTagsModal },
		{ title: 'Report', svg: '<svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 1C9.63768 1 8.30808 2.0703 7.63176 3.25386" fill="#0F0F0F"/></svg>', fn: () => window.open('https://forms.gle/h5DHdt5EnsT3bwqP7','_blank') },
		{ title: 'Settings', svg: '<svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="#000" stroke-width="2"/></svg>', fn: createSettingsPanel }
	];

	btns.forEach(b => {
		const btn = document.createElement('button');
		btn.className = 'optButton';
		btn.title = b.title;
		btn.innerHTML = b.svg;
		btn.onclick = () => {
		try {
		b.fn();
		} catch (e) {
		console.error(b.title, 'button failed:', e);
  }
};

};

};

  }
};
		right.appendChild(btn);
	});

	bar.appendChild(left);
	bar.appendChild(searchBar);
	bar.appendChild(right);
	bar._searchBar = searchBar;
	return bar;
}

function createPanel() {
	panel = document.createElement('div');
	panel.style.cssText = 'width:100vw;height:100vh;overflow-y:auto;position:fixed;top:0;left:0;background:#111;color:#01AEFD;z-index:99999;';
	panel.className = 'custom-scroll-panel';

	const titleBar = TitleBar();
	panel.appendChild(titleBar);

	const container = document.createElement('div');
	container.className = 'game-grid';

	let filteredConfigs = buttonConfigs.filter(cfg => !cfg.highlighted);

	titleBar._searchBar.addEventListener('input', () => {
		const query = titleBar._searchBar.value.toLowerCase();
		filteredConfigs = buttonConfigs.filter(cfg =>
			!cfg.highlighted &&
			cfg.label?.toLowerCase().includes(query) &&
			(!activeTag || (Array.isArray(cfg.tag) ? cfg.tag.includes(activeTag) : cfg.tag === activeTag))
		);
		renderButtons(filteredConfigs);
	});

	async function openBuiltGame(url, cfg) {
		let builtUrl = url;
		try {
			if (cfg?.type === 'gameBuild' || (/gameBuilds|github|raw.githubusercontent.com/i.test(url) && !url.endsWith('.swf'))) {
				builtUrl = await loadGameBuild(url);
			}
		} catch (e) {
			console.error('Failed to load game build:', e);
			throw e;
		}
		return builtUrl;
	}

	function renderButtons(configs) {
		container.innerHTML = '';
		configs.forEach(config => {
			const button = document.createElement('button');
			button.style.cssText = 'width:280px;height:150px;background:#000;border:none;border-radius:15px;cursor:pointer;padding:0;position:relative;overflow:hidden;';

			const imgContainer = document.createElement('div');
			imgContainer.style.cssText = 'width:100%;height:100%;position:relative;border-radius:15px;overflow:hidden;';

			const img = document.createElement('img');
			img.src = config.image;
			img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
			imgContainer.appendChild(img);

			const label = document.createElement('div');
			label.textContent = config.label || '';
			label.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;padding:6px 10px;font-size:12px;font-weight:bold;color:#fff;background:linear-gradient(to top,rgba(0,0,0,0.85),rgba(0,0,0,0));';
			imgContainer.appendChild(label);

			button.appendChild(imgContainer);

			button.addEventListener('click', async () => {
				panel.remove();
				let url = config.url;

				try {
					if (config.type === 'gameBuild' || (/gameBuilds|github|raw.githubusercontent.com/i.test(url) && !url.endsWith('.swf'))) {
						url = await loadGameBuild(url);
					}
				} catch (e) {
					console.error('Failed to load game build:', e);
					alert('Failed to load game. Try again.');
					return;
				}

				if (url && url.endsWith('.swf')) {
					try {
						await injectRuffle();
						const ruffle = window.RufflePlayer.newest();
						const player = ruffle.createPlayer();
						player.style.cssText = 'width:100vw;height:100vh;position:fixed;top:0;left:0;z-index:100000;';
						document.body.appendChild(player);
						await enableRuffleSavePersistence(player, config.url || url);
						player.load(url);
					} catch (e) {
						console.error('Ruffle error', e);
						alert('Could not run SWF.');
					}
				} else {
					const iframe = document.createElement('iframe');
					iframe.src = url;
					iframe.allow = "autoplay; fullscreen; gamepad; microphone; camera";
					iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals";
					iframe.style.cssText = 'width:100vw;height:100vh;border:none;position:fixed;top:0;left:0;z-index:100000;';
					document.body.appendChild(iframe);
				}
			});
			container.appendChild(button);
		});
	}

	renderButtons(filteredConfigs);
	window.zwRenderButtons = renderButtons;
	panel.appendChild(container);
	document.body.appendChild(panel);
}

function createSettingsPanel() {
	if (settingsPanel) settingsPanel.remove();
	settingsPanel = document.createElement('div');
	settingsPanel.style.cssText = 'width:300px;height:350px;overflow:auto;border-radius:20px;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#111;color:#01AEFD;padding:20px;z-index:100001;';
	settingsPanel.className = 'custom-scroll-panel';

	const closeBtn = document.createElement('button');
	closeBtn.textContent = '✕';
	closeBtn.style.cssText = 'position:absolute;top:10px;right:15px;background:transparent;border:none;color:#01AEFD;font-size:16px;cursor:pointer;';
	closeBtn.onclick = () => settingsPanel.remove();
	settingsPanel.appendChild(closeBtn);

	const title = document.createElement('div');
	title.textContent = 'Settings';
	title.style.cssText = 'text-align:center;font-size:24px;font-weight:bold;';
	settingsPanel.appendChild(title);

	const content = document.createElement('div');
	content.innerHTML = '<h3>Misc</h3><p>Nothing Yet..</p>';
	settingsPanel.appendChild(content);

	document.body.appendChild(settingsPanel);
}

function showTagsModal() {
	if (document.getElementById('tags-modal')) return;
	const modal = document.createElement('div');
	modal.className = 'tags-modal';
	modal.id = 'tags-modal';

	const closeBtn = document.createElement('button');
	closeBtn.textContent = '×';
	closeBtn.style.cssText = 'position:absolute;top:12px;right:18px;background:#e74c3c;color:#fff;border:none;border-radius:25%;width:36px;height:36px;cursor:pointer;font-size:22px;font-weight:bold;';
	closeBtn.onclick = () => modal.remove();
	modal.appendChild(closeBtn);

	const title = document.createElement('div');
	title.textContent = 'Tags';
	title.style.cssText = 'font-size:24px;font-weight:bold;color:#01AEFD;margin:8px 0 18px;text-align:center;';
	modal.appendChild(title);

	const tagsRow = document.createElement('div');
	tagsRow.style.cssText = 'display:flex;gap:18px;justify-content:center;';

	['Simulator', 'Fighting', 'RPG'].forEach(tag => {
		const tagBtn = document.createElement('button');
		tagBtn.className = 'tag-btn';
		tagBtn.textContent = tag;
		tagBtn.style.background = activeTag === tag ? '#015AFD' : 'linear-gradient(45deg,#01AEFD,#00C5FF)';
		tagBtn.onclick = () => {
			activeTag = activeTag === tag ? null : tag;
			const filtered = buttonConfigs.filter(cfg =>
				!cfg.highlighted && (!activeTag || (Array.isArray(cfg.tag) ? cfg.tag.includes(activeTag) : cfg.tag === activeTag))
			);
			window.zwRenderButtons?.(filtered);
			modal.remove();
		};
		tagsRow.appendChild(tagBtn);
	});

	modal.appendChild(tagsRow);
	document.body.appendChild(modal);
}

function rollGame() {
	const modal = document.createElement('div');
	modal.id = 'random-roller-modal';
	modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:225px;height:275px;background:#181818;border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1000;padding:24px;';

	let rolling = true;
	let currentIdx = Math.floor(Math.random() * buttonConfigs.length);
	let cycles = 0;

	gameBtn.onclick = async () => {
  modal.remove();
  const cfg = buttonConfigs[currentIdx];
};
	gameBtn.style.cssText = 'width:150px;height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(45deg,#038FF9,#00C5FF);border:none;border-radius:18px;cursor:pointer;';

	const img = document.createElement('img');
	img.style.cssText = 'width:120px;height:120px;border-radius:12px;object-fit:cover;margin-bottom:10px;';

	const label = document.createElement('div');
	label.style.cssText = 'font-size:18px;font-weight:bold;color:#fff;text-align:center;';

	gameBtn.appendChild(img);
	gameBtn.appendChild(label);

	function updateBtn() {
		const cfg = buttonConfigs[currentIdx];
		img.src = cfg.image;
		label.textContent = cfg.label || '';
	}

	updateBtn();
	const interval = setInterval(() => {
		currentIdx = Math.floor(Math.random() * buttonConfigs.length);
		updateBtn();
		if (++cycles >= 30) {
			clearInterval(interval);
			rolling = false;
		}
	}, 100);

	const closeBtn = document.createElement('button');
	closeBtn.textContent = '✕';
	closeBtn.style.cssText = 'position:absolute;top:12px;right:18px;background:transparent;border:none;color:#01AEFD;font-size:22px;cursor:pointer;';
	closeBtn.onclick = () => modal.remove();

	modal.appendChild(closeBtn);
	modal.appendChild(gameBtn);
	document.body.appendChild(modal);
}

loadGameList();
