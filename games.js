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

 function TitleBar() {
        const bar = document.createElement('div');
        bar.style.width = '60%';
        bar.style.height = '50px';
        bar.style.marginLeft = '19.5%';
        bar.style.marginTop = '20px';
        bar.style.borderRadius = '15px';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.justifyContent = 'space-between';
        bar.style.gap = '10px';
        bar.style.userSelect = 'none';
        bar.style.padding = '0 12px';
        bar.id = 'gradient';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '10px';

        const img = document.createElement('img');
        img.src = 'https://raw.githubusercontent.com/TrulyZeph/Zephware/refs/heads/main/assets/Zephware.png';
        img.style.height = '45px';
        img.style.width = 'auto';
        img.style.marginLeft = '8px';
        left.appendChild(img);

        const title = document.createElement('div');
        title.textContent = 'Zephware';
        title.style.fontFamily = 'Grenze Gotisch';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '28px';
        title.style.background = 'linear-gradient(to bottom, #0faada, #005da1)';
        title.style.backgroundClip = 'text';
        title.style.webkitBackgroundClip = 'text';
        title.style.color = 'transparent';
        title.style.webkitTextFillColor = 'transparent';
        title.style.display = 'inline-block';
        left.appendChild(title);

        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.placeholder = 'Search';
        searchBar.style.width = '420px';
        searchBar.style.maxWidth = '45vw';
        searchBar.style.padding = '8px 12px';
        searchBar.style.borderRadius = '10px';
        searchBar.style.border = 'none';
        searchBar.style.fontSize = '14px';
        searchBar.style.outline = 'none';
        searchBar.style.background = '#262327ff';
        searchBar.style.color = '#01AEFD';
        searchBar.style.display = 'block';
        searchBar.style.margin = '0 10px';

        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.alignItems = 'center';

        const randomBtn = document.createElement('button');
        randomBtn.className = 'optButton';
        randomBtn.title = 'Random';
        randomBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="35px" height="35px" viewBox="0 0 20 20" version="1.1"> <title>dice [#24]</title> <desc>Created with Sketch.</desc> <defs></defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-220.000000, -8079.000000)" fill="#000000"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M174,7927.1047 C172.896,7927.1047 172,7927.9997 172,7929.1047 C172,7930.2097 172.896,7931.1047 174,7931.1047 C175.104,7931.1047 176,7930.2097 176,7929.1047 C176,7927.9997 175.104,7927.1047 174,7927.1047 L174,7927.1047 Z M182,7921.9997 C182,7921.4477 181.552,7920.9997 181,7920.9997 L167,7920.9997 C166.448,7920.9997 166,7921.4477 166,7921.9997 L166,7935.9997 C166,7936.5527 166.448,7936.9997 167,7936.9997 L181,7936.9997 C181.552,7936.9997 182,7936.5527 182,7935.9997 L182,7921.9997 Z M184,7920.9997 L184,7936.9997 C184,7938.1047 183.105,7938.9997 182,7938.9997 L166,7938.9997 C164.896,7938.9997 164,7938.1047 164,7936.9997 L164,7920.9997 C164,7919.8957 164.896,7918.9997 166,7918.9997 L182,7918.9997 C183.105,7918.9997 184,7919.8957 184,7920.9997 L184,7920.9997 Z M170,7927.1047 C171.104,7927.1047 172,7926.2097 172,7925.1047 C172,7923.9997 171.104,7923.1047 170,7923.1047 C168.896,7923.1047 168,7923.9997 168,7925.1047 C168,7926.2097 168.896,7927.1047 170,7927.1047 L170,7927.1047 Z M170,7931.1047 C168.896,7931.1047 168,7931.9997 168,7933.1047 C168,7934.2097 168.896,7935.1047 170,7935.1047 C171.104,7935.1047 172,7934.2097 172,7933.1047 C172,7931.9997 171.104,7931.1047 170,7931.1047 L170,7931.1047 Z M178,7923.1047 C176.896,7923.1047 176,7923.9997 176,7925.1047 C176,7926.2097 176.896,7927.1047 178,7927.1047 C179.104,7927.1047 180,7926.2097 180,7925.1047 C180,7923.9997 179.104,7923.1047 178,7923.1047 L178,7923.1047 Z M180,7933.1047 C180,7934.2097 179.104,7935.1047 178,7935.1047 C176.896,7935.1047 176,7934.2097 176,7933.1047 C176,7931.9997 176.896,7931.1047 178,7931.1047 C179.104,7931.1047 180,7931.9997 180,7933.1047 L180,7933.1047 Z" id="dice-[#24]"></path> </g> </g> </g></svg>`;
        randomBtn.onclick = typeof rollGame === 'function' ? rollGame : () => {};
        right.appendChild(randomBtn);

        const tagsBtn = document.createElement('button');
        tagsBtn.className = 'optButton';
        tagsBtn.title = 'Tags';
        tagsBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 24 24" fill="none"><path d="M8.5 3H11.5118C12.2455 3 12.6124 3 12.9577 3.08289C13.2638 3.15638 13.5564 3.27759 13.8249 3.44208C14.1276 3.6276 14.387 3.88703 14.9059 4.40589L20.5 10M7.5498 10.0498H7.5598M9.51178 6H8.3C6.61984 6 5.77976 6 5.13803 6.32698C4.57354 6.6146 4.1146 7.07354 3.82698 7.63803C3.5 8.27976 3.5 9.11984 3.5 10.8V12.0118C3.5 12.7455 3.5 13.1124 3.58289 13.4577C3.65638 13.7638 3.77759 14.0564 3.94208 14.3249C4.1276 14.6276 4.38703 14.887 4.90589 15.4059L8.10589 18.6059C9.29394 19.7939 9.88796 20.388 10.5729 20.6105C11.1755 20.8063 11.8245 20.8063 12.4271 20.6105C13.112 20.388 13.7061 19.7939 14.8941 18.6059L16.1059 17.3941C17.2939 16.2061 17.888 15.612 18.1105 14.9271C18.3063 14.3245 18.3063 13.6755 18.1105 13.0729C17.888 12.388 17.2939 11.7939 16.1059 10.6059L12.9059 7.40589C12.387 6.88703 12.1276 6.6276 11.8249 6.44208C11.5564 6.27759 11.2638 6.15638 10.9577 6.08289C10.6124 6 10.2455 6 9.51178 6ZM8.0498 10.0498C8.0498 10.3259 7.82595 10.5498 7.5498 10.5498C7.27366 10.5498 7.0498 10.3259 7.0498 10.0498C7.0498 9.77366 7.27366 9.5498 7.5498 9.5498C7.82595 9.5498 8.0498 9.77366 8.0498 10.0498Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        tagsBtn.onclick = typeof showTagsModal === 'function' ? showTagsModal : () => {};
        right.appendChild(tagsBtn);

        const reportBtn = document.createElement('button');
        reportBtn.className = 'optButton';
        reportBtn.title = 'Report';
        reportBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.47 5.777C6.64843 5.66548 6.82631 5.57017 7.00005 5.48867C7.00341 5.24634 7.03488 5.00375 7.08016 4.76601C7.15702 4.36251 7.31232 3.81288 7.63176 3.25386C8.30808 2.0703 9.63768 1 12 1C14.3623 1 15.6919 2.0703 16.3682 3.25386C16.6877 3.81288 16.843 4.36251 16.9198 4.76601C16.9651 5.00366 16.9966 5.24615 16.9999 5.48839C17.1737 5.56989 17.3516 5.66548 17.53 5.777C18.207 6.20012 18.8425 6.82582 19.2994 7.71927C19.7656 7.53233 20.2282 7.23 20.5429 6.7578C20.7966 6.3773 21 5.82502 21 5C21 4.44772 21.4477 4 22 4C22.5523 4 23 4.44772 23 5C23 6.17498 22.7034 7.1227 22.2071 7.8672C21.5676 8.82639 20.6756 9.34444 19.8991 9.63125C19.9646 10.0513 20 10.5067 20 11V12H22C22.5523 12 23 12.4477 23 13C23 13.5523 22.5523 14 22 14H20V15.5191C19.9891 15.8049 19.9498 16.088 19.9016 16.3697C20.6774 16.6566 21.5683 17.1746 22.2071 18.1328C22.7034 18.8773 23 19.825 23 21C23 21.5523 22.5523 22 22 22C21.4477 22 21 21.5523 21 21C21 20.175 20.7966 19.6227 20.5429 19.2422C20.2401 18.7879 19.8018 18.4912 19.3524 18.3025C19.2288 18.6068 19.0814 18.9213 18.9053 19.237C17.8448 21.1392 15.7816 23 12 23C8.2184 23 6.15524 21.1392 5.09465 19.237C4.91864 18.9213 4.77118 18.6068 4.6476 18.3025C4.19823 18.4912 3.75992 18.7879 3.45705 19.2422C3.20338 19.6227 3 20.175 3 21C3 21.5523 2.55228 22 2 22C1.44772 22 1 21.5523 1 21C1 19.825 1.29662 18.8773 1.79295 18.1328C2.43173 17.1746 3.32255 16.6566 4.09839 16.3697C4.05024 16.0885 4.0127 15.8043 4 15.5191V14H2C1.44772 14 1 13.5523 1 13C1 12.4477 1.44772 12 2 12H4V11C4 10.5067 4.0354 10.0513 4.10086 9.63125C3.3244 9.34444 2.43241 8.82639 1.79295 7.8672C1.29662 7.1227 1 6.17498 1 5C1 4.44772 1.44772 4 2 4C2.55228 4 3 4.44772 3 5C3 5.82502 3.20338 6.3773 3.45705 6.7578C3.77185 7.23 4.2344 7.53233 4.70063 7.71927C5.15748 6.82582 5.79302 6.20012 6.47 5.777ZM14.6318 4.24614C14.7804 4.50632 14.8709 4.77287 14.9251 5H9.07491C9.1291 4.77287 9.21957 4.50632 9.36824 4.24614C9.69192 3.6797 10.3623 3 12 3C13.6377 3 14.3081 3.6797 14.6318 4.24614ZM8.99671 7.00035C8.48495 7.02168 7.96106 7.20358 7.53 7.473C6.84294 7.90241 6 8.81983 6 11V15.4738C6.06537 16.4404 6.37182 17.4207 6.84149 18.263C7.5032 19.4498 8.69637 20.6688 11 20.943V7L8.99671 7.00035ZM13 7V20.943C15.3036 20.6688 16.4968 19.4498 17.1585 18.263C17.6282 17.4206 17.9346 16.4404 18 15.4738V11C18 8.81983 17.1571 7.90241 16.47 7.473C16.0389 7.20358 15.515 7.02168 15.0033 7.00035L13 7Z" fill="#0F0F0F"/></svg>`;
        reportBtn.onclick = () => window.open('https://forms.gle/h5DHdt5EnsT3bwqP7', '_blank');
        right.appendChild(reportBtn);

        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'optButton';
        settingsBtn.title = 'Settings';
        settingsBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 24 24" fill="none"><g id="Interface / Settings"><g id="Vector"><path d="M20.3499 8.92293L19.9837 8.7192C19.9269 8.68756 19.8989 8.67169 19.8714 8.65524C19.5983 8.49165 19.3682 8.26564 19.2002 7.99523C19.1833 7.96802 19.1674 7.93949 19.1348 7.8831C19.1023 7.82677 19.0858 7.79823 19.0706 7.76998C18.92 7.48866 18.8385 7.17515 18.8336 6.85606C18.8331 6.82398 18.8332 6.79121 18.8343 6.72604L18.8415 6.30078C18.8529 5.62025 18.8587 5.27894 18.763 4.97262C18.6781 4.70053 18.536 4.44993 18.3462 4.23725C18.1317 3.99685 17.8347 3.82534 17.2402 3.48276L16.7464 3.1982C16.1536 2.85658 15.8571 2.68571 15.5423 2.62057C15.2639 2.56294 14.9765 2.56561 14.6991 2.62789C14.3859 2.69819 14.0931 2.87351 13.5079 3.22396L13.5045 3.22555L13.1507 3.43741C13.0948 3.47091 13.0665 3.48779 13.0384 3.50338C12.7601 3.6581 12.4495 3.74365 12.1312 3.75387C12.0992 3.7549 12.0665 3.7549 12.0013 3.7549C11.9365 3.7549 11.9024 3.7549 11.8704 3.75387C11.5515 3.74361 11.2402 3.65759 10.9615 3.50224C10.9334 3.48658 10.9056 3.46956 10.8496 3.4359L10.4935 3.22213C9.90422 2.86836 9.60915 2.69121 9.29427 2.62057C9.0157 2.55807 8.72737 2.55634 8.44791 2.61471C8.13236 2.68062 7.83577 2.85276 7.24258 3.19703L7.23994 3.1982L6.75228 3.48124L6.74688 3.48454C6.15904 3.82572 5.86441 3.99672 5.6517 4.23614C5.46294 4.4486 5.32185 4.69881 5.2374 4.97018C5.14194 5.27691 5.14703 5.61896 5.15853 6.3027L5.16568 6.72736C5.16676 6.79166 5.16864 6.82362 5.16817 6.85525C5.16343 7.17499 5.08086 7.48914 4.92974 7.77096C4.9148 7.79883 4.8987 7.8267 4.86654 7.88237C4.83436 7.93809 4.81877 7.96579 4.80209 7.99268C4.63336 8.26452 4.40214 8.49186 4.12733 8.65572C4.10015 8.67193 4.0715 8.68752 4.01521 8.71871L3.65365 8.91908C3.05208 9.25245 2.75137 9.41928 2.53256 9.65669C2.33898 9.86672 2.19275 10.1158 2.10349 10.3872C2.00259 10.6939 2.00267 11.0378 2.00424 11.7255L2.00551 12.2877C2.00706 12.9708 2.00919 13.3122 2.11032 13.6168C2.19979 13.8863 2.34495 14.134 2.53744 14.3427C2.75502 14.5787 3.05274 14.7445 3.64974 15.0766L4.00808 15.276C4.06907 15.3099 4.09976 15.3266 4.12917 15.3444C4.40148 15.5083 4.63089 15.735 4.79818 16.0053C4.81625 16.0345 4.8336 16.0648 4.8683 16.1255C4.90256 16.1853 4.92009 16.2152 4.93594 16.2452C5.08261 16.5229 5.16114 16.8315 5.16649 17.1455C5.16707 17.1794 5.16658 17.2137 5.16541 17.2827L5.15853 17.6902C5.14695 18.3763 5.1419 18.7197 5.23792 19.0273C5.32287 19.2994 5.46484 19.55 5.65463 19.7627C5.86915 20.0031 6.16655 20.1745 6.76107 20.5171L7.25478 20.8015C7.84763 21.1432 8.14395 21.3138 8.45869 21.379C8.73714 21.4366 9.02464 21.4344 9.30209 21.3721C9.61567 21.3017 9.90948 21.1258 10.4964 20.7743L10.8502 20.5625C10.9062 20.5289 10.9346 20.5121 10.9626 20.4965C11.2409 20.3418 11.5512 20.2558 11.8695 20.2456C11.9015 20.2446 11.9342 20.2446 11.9994 20.2446C12.0648 20.2446 12.0974 20.2446 12.1295 20.2456C12.4484 20.2559 12.7607 20.3422 13.0394 20.4975C13.0639 20.5112 13.0885 20.526 13.1316 20.5519L13.5078 20.7777C14.0971 21.1315 14.3916 21.3081 14.7065 21.3788C14.985 21.4413 15.2736 21.4438 15.5531 21.3855C15.8685 21.3196 16.1657 21.1471 16.7586 20.803L17.2536 20.5157C17.8418 20.1743 18.1367 20.0031 18.3495 19.7636C18.5383 19.5512 18.6796 19.3011 18.764 19.0297C18.8588 18.7252 18.8531 18.3858 18.8417 17.7119L18.8343 17.2724C18.8332 17.2081 18.8331 17.1761 18.8336 17.1445C18.8383 16.8247 18.9195 16.5104 19.0706 16.2286C19.0856 16.2007 19.1018 16.1726 19.1338 16.1171C19.166 16.0615 19.1827 16.0337 19.1994 16.0068C19.3681 15.7349 19.5995 15.5074 19.8744 15.3435C19.9012 15.3275 19.9289 15.3122 19.9838 15.2818L19.9857 15.2809L20.3472 15.0805C20.9488 14.7472 21.2501 14.5801 21.4689 14.3427C21.6625 14.1327 21.8085 13.8839 21.8978 13.6126C21.9981 13.3077 21.9973 12.9658 21.9958 12.2861L21.9945 11.7119C21.9929 11.0287 21.9921 10.6874 21.891 10.3828C21.8015 10.1133 21.6555 9.86561 21.463 9.65685C21.2457 9.42111 20.9475 9.25526 20.3517 8.92378L20.3499 8.92293Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.00033 12C8.00033 14.2091 9.79119 16 12.0003 16C14.2095 16 16.0003 14.2091 16.0003 12C16.0003 9.79082 14.2095 7.99996 12.0003 7.99996C9.79119 7.99996 8.00033 9.79082 8.00033 12Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></g></svg>`;
        settingsBtn.onclick = typeof createSettingsPanel === 'function' ? createSettingsPanel : () => {};
        right.appendChild(settingsBtn);

        bar.appendChild(left);
        bar.appendChild(searchBar);
        bar.appendChild(right);

        bar._zw_searchBar = searchBar;
        return bar;
    }

 function createPanel() {
        panel = document.createElement('div');
        panel.style.width = '100vw';
        panel.style.height = '100vh';
        panel.style.overflowY = 'auto';
        panel.style.borderRadius = '0';
        panel.style.zIndex = 1;
        panel.style.position = 'fixed';
        panel.style.top = '0';
        panel.style.left = '0';
        panel.style.transform = 'none';
        panel.style.background = '#111';
        panel.style.fontFamily = 'Grenze Gotisch, sans-serif';
        panel.style.color = '#01AEFD';
        panel.style.padding = '0';
        panel.className = 'custom-scroll-panel';
        panel.id = 'panel';

        const style = document.createElement('style');
        style.textContent = `
            .custom-scroll-panel {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
            .custom-scroll-panel::-webkit-scrollbar {
                display: none;
            }
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
                transition: background 0.2s, box-shadow 0.2s;
            }
            .optButton svg {
                width: 22px;
                height: 22px;
                display: block;
            }
            .top-bar-btn {
                background: none;
                border: none;
                color: #01AEFD;
                font-size: 20px;
                padding: 8px 16px;
                cursor: pointer;
                font-family: 'Grenze Gotisch', sans-serif;
                font-weight: bold;
                border-radius: 8px;
                margin: 0 2px;
                transition: background 0.2s;
            }
            .top-bar-btn:hover {
                background: #333;
            }
            .top-bar {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-top: 20px;
                margin-bottom: -30px;
            }
            .top-bar-left, .top-bar-right {
                display: flex;
                align-items: center;
                gap: 2px;
            }
            .tags-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #181818;
                border-radius: 24px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                padding: 32px 32px 24px 32px;
                z-index: 1001;
                min-width: 320px;
                min-height: 120px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .tags-modal-title {
                color: #01AEFD;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 18px;
            }
            .tags-btn-row {
                display: flex;
                flex-direction: row;
                gap: 18px;
                justify-content: center;
                margin-bottom: 10px;
            }
            .tag-btn {
                background: linear-gradient(45deg, #01AEFD, #00C5FF);
                color: #fff;
                border: none;
                border-radius: 18px;
                font-size: 18px;
                font-family: 'Grenze Gotisch', sans-serif;
                font-weight: bold;
                padding: 10px 28px;
                margin: 0 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .tag-btn:hover {
                background: #015AFD;
            }
            .tags-modal-close {
                margin-top: 18px;
                background: none;
                border: none;
                color: #01AEFD;
                font-size: 22px;
                cursor: pointer;
                font-family: 'Grenze Gotisch', sans-serif;
            }
        `;
        document.head.appendChild(style);
	 
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

	const gameBtn = document.createElement('button');
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
