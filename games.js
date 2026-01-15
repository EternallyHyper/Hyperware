(function () {
    let iframe = null;
    let panel = null;
    let settingsPanel = null;
    let activeTag = null;
    let buttonConfigs = [];
    function loadGameList() {
        fetch('https://raw.githubusercontent.com/trulyzeph/zephware/main/data/gamelist.json')
            .then(response => response.json())
            .then(data => {
                buttonConfigs = data;
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

    function saveGameProgress(gameUrl, dataObj) {
    const key = "zephware_" + gameUrl;
    localStorage.setItem(key, JSON.stringify(dataObj));
    }

    function loadGameProgress(gameUrl) {
    const key = "zephware_" + gameUrl;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
    }

    async function injectRuffleSaveSupport(iframe, gameUrl) {
    const saveKey = "zephware_" + gameUrl;

    const savedData = localStorage.getItem(saveKey);
    if (savedData) {
        iframe.contentWindow.localStorage.setItem("RuffleSavedData", savedData);
    }

    setInterval(() => {
        try {
            const rData = iframe.contentWindow.localStorage.getItem("RuffleSavedData");
            if (rData) localStorage.setItem(saveKey, rData);
        } catch {}
    }, 2000);
    }

    const globalFontLink = document.createElement('link');
    globalFontLink.id = 'Grenze Gotisch-font-link';
    globalFontLink.rel = 'stylesheet';
    globalFontLink.href = 'https://fonts.googleapis.com/css2?family=Aldrich&family=Eater&family=Grenze+Gotisch:wght@100..900&family=Orbitron:wght@400..900&family=UnifrakturCook:wght@700&family=WDXL+Lubrifont+TC&display=swap';
    document.head.appendChild(globalFontLink);

    const globalFontStyle = document.createElement('style');
    globalFontStyle.type = 'text/css';
    globalFontStyle.innerText = `
       * {
          font-family: 'Grenze Gotisch', sans-serif !important;
       }
    `;
    document.head.appendChild(globalFontStyle);

    const toggle = document.createElement('style');
    toggle.innerHTML = `
    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #444;
        transition: .4s;
        border-radius: 24px;
        box-shadow: 0 0 5px #01AEFD;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    .switch input:checked + .slider {
        background-color: #01AEFD;
    }

    .switch input:checked + .slider:before {
        transform: translateX(26px);
    }
    #gradient
    {
        height:300px;
        width:300px;
        border:1px solid black;
        font-size:30px;
        background: linear-gradient(130deg, #053680ff, #204cacff);
        background-size: 200% 200%;

        -webkit-animation: Animation 5s ease infinite;
        -moz-animation: Animation 5s ease infinite;
        animation: Animation 5s ease infinite;
    }

    @-webkit-keyframes Animation {
        0%{background-position:10% 0%}
        50%{background-position:91% 100%}
        100%{background-position:10% 0%}
    }
    @-moz-keyframes Animation {
        0%{background-position:10% 0%}
        50%{background-position:91% 100%}
        100%{background-position:10% 0%}
    }
    @keyframes Animation { 
        0%{background-position:10% 0%}
        50%{background-position:91% 100%}
        100%{background-position:10% 0%}
    }
`;

    document.head.appendChild(toggle);

    const keyframesStyle = document.createElement('style');
    keyframesStyle.innerHTML = `
        @keyframes pulseLine {
            0% {
                transform: scaleX(0);
                opacity: 0.2;
            }
            50% {
                transform: scaleX(1);
                opacity: 0.6;
            }
            100% {
                transform: scaleX(0);
                opacity: 0.2;
            }
        }
    `;
    document.head.appendChild(keyframesStyle);

    let filteredConfigs = buttonConfigs.filter(cfg => !cfg.highlighted);

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

        const titleBar = TitleBar();
        panel.appendChild(titleBar);

        const searchBar = titleBar._zw_searchBar;
        let filteredConfigs = buttonConfigs.filter(cfg => !cfg.highlighted)
        if (searchBar) {
            searchBar.addEventListener('input', () => {
                const query = searchBar.value.toLowerCase();
                filteredConfigs = buttonConfigs.filter(config =>
                    (!config.highlighted) &&
                    config.label && config.label.toLowerCase().includes(query) &&
                    (!activeTag || (Array.isArray(config.tag) ? config.tag.includes(activeTag) : config.tag === activeTag))
                );
            renderButtons(filteredConfigs);
         });
    }

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.justifyContent = 'space-around';
        container.style.alignItems = 'center';
        container.style.gap = '20px';
        container.style.marginTop = '60px';
        container.style.marginBottom = '10px';
        container.style.marginLeft = '40px';
        container.style.marginRight = '40px';

        renderButtons(filteredConfigs);

        function renderButtons(configs) {
            container.innerHTML = '';
            configs.forEach(config => {
               const button = document.createElement('button');
               let buttonHeight = '150px';
               const labelText = config.label || '';
               const labelLength = labelText.length;
               let labelFontSize = '12px';
               if (labelLength > 20) {
                   buttonHeight = '130px';
                   labelFontSize = '10px';
               } else if (labelLength > 12) {
                   labelFontSize = '10px';
               }
               button.style.width = '280px';
               button.style.height = buttonHeight;
               button.style.fontSize = '16px';
               button.style.background = '#000';
               button.style.color = '#000000ff';
               button.style.border = 'none';
               button.style.borderRadius = '15px';
               button.style.cursor = 'pointer';
               button.style.padding = '0';
               button.style.display = 'flex';
               button.style.position = 'relative';
               button.style.overflow = 'hidden';

               const imgContainer = document.createElement('div');
               imgContainer.style.width = '100%';
               imgContainer.style.height = '100%';
               imgContainer.style.position = 'relative';
               imgContainer.style.borderTopLeftRadius = '15px';
               imgContainer.style.borderTopRightRadius = '15px';
               imgContainer.style.overflow = 'hidden';

               const img = document.createElement('img');
               img.src = config.image;
               img.style.width = '100%';
               img.style.height = '100%';
               img.style.objectFit = 'cover';
               imgContainer.appendChild(img);

               const label = document.createElement('div');
               label.innerText = labelText;
               label.style.position = 'absolute';
               label.style.bottom = '0';
               label.style.left = '0';
               label.style.width = '100%';
               label.style.padding = '6px 10px';
               label.style.fontSize = labelFontSize;
               label.style.fontWeight = 'bold';
               label.style.color = '#fff';
               label.style.background = 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))'; 
               label.style.display = 'flex';
               label.style.alignItems = 'center';
               label.style.justifyContent = 'flex-start';
               label.style.boxSizing = 'border-box';

                imgContainer.appendChild(label);

                button.appendChild(imgContainer);

                button.addEventListener('click', async () => {
                    panel.remove();
                    const url = config.url;

                    let html = null;

                    try {
                        const res = await fetch(url);
                        if (res.ok) html = await res.text();
                    } catch {}

                    const iframe = document.createElement('iframe');
                    iframe.allow = "autoplay; fullscreen";
                    iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";
                    iframe.style.cssText = `
                        width: 100vw;
                        height: 100vh;
                        border: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        z-index: 2147483647;
                    `;

                    if (!html) iframe.src = url;
                    else iframe.srcdoc = html;

                    document.body.appendChild(iframe);

                    if (url.endsWith(".swf")) {
                        await injectRuffle();
                        const ruffle = window.RufflePlayer.newest();
                        injectRuffleSaveSupport(iframe, url);
                    }

                    const stored = loadGameProgress(url);
                    for (const k in stored) {
                        try { iframe.contentWindow.localStorage.setItem(k, stored[k]); } catch {}
                    }

                    const saveInterval = setInterval(() => {
                        try {
                            let snap = {};
                            for (let i = 0; i < iframe.contentWindow.localStorage.length; i++) {
                                const k = iframe.contentWindow.localStorage.key(i);
                                snap[k] = iframe.contentWindow.localStorage.getItem(k);
                            }
                            saveGameProgress(url, snap);
                        } catch {}
                    }, 2000);

                    iframe._zeph_clean = () => clearInterval(saveInterval);
                });
                container.appendChild(button);
            });
        }

        window.zwRenderButtons = renderButtons;
        panel.appendChild(container);
        document.body.appendChild(panel);

    }

    function createSettingsPanel() {
        settingsPanel = document.createElement('div');
        settingsPanel.style.width = '300px';
        settingsPanel.style.height = '350px';
        settingsPanel.style.overflowY = 'scroll';
        settingsPanel.style.overflow = 'auto';
        settingsPanel.style.borderRadius = '20px';
        settingsPanel.style.position = 'fixed';
        settingsPanel.style.top = '50%';
        settingsPanel.style.left = '50%';
        settingsPanel.style.transform = 'translate(-50%, -50%)';
        settingsPanel.style.background = '#111';
        settingsPanel.style.fontFamily = 'Grenze Gotisch, sans-serif';
        settingsPanel.style.color = '#01AEFD';
        settingsPanel.style.padding = '20px';
        settingsPanel.style.zIndex = '5';
        settingsPanel.className = 'custom-scroll-panel';
        if (settingsPanel) settingsPanel.remove();
        let oldRoller = document.getElementById('random-roller-modal');
        if (oldRoller) oldRoller.remove();

        const closeBtn = document.createElement('button');
        closeBtn.innerText = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '15px';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#01AEFD';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
            settingsPanel.remove();
            if (overlay) overlay.remove();
        };
        settingsPanel.appendChild(closeBtn);

        const title = document.createElement('div');
        title.innerText = 'Settings';
        title.style.textAlign = 'center';
        title.style.fontSize = '24px';
        title.style.fontWeight = 'bold';
        settingsPanel.appendChild(title);

        const content = document.createElement('div');
        content.innerHTML = `
        <h3>Misc</h3>
        <div id="misc-section"></div>
        <p>Nothing Yet..</p>
`;

        settingsPanel.appendChild(content);
        document.body.appendChild(settingsPanel);
    }

    function showTagsModal() {
        if (document.getElementById('tags-modal')) return;
        const modal = document.createElement('div');
        modal.className = 'tags-modal';
        modal.id = 'tags-modal';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tags-modal-close';
        closeBtn.innerText = '×';
        closeBtn.title = 'Close';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '18px';
        closeBtn.style.background = '#e74c3c';
        closeBtn.style.color = '#fff';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.fontSize = '22px';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '25%';
        closeBtn.style.width = '36px';
        closeBtn.style.height = '36px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => modal.remove();
        modal.appendChild(closeBtn);
        const title = document.createElement('div');
        title.className = 'tags-modal-title';
        title.innerText = 'Tags';
        title.style.marginTop = '8px';
        modal.appendChild(title);
        const tagsRow = document.createElement('div');
        tagsRow.className = 'tags-btn-row';
        tagsRow.style.marginTop = '8px';
        const tags = ['Simulator', 'Fighting', 'RPG'];
        tags.forEach(tag => {
            const tagBtn = document.createElement('button');
            tagBtn.className = 'tag-btn';
            tagBtn.innerText = tag;
            tagBtn.style.fontSize = '14px';
            tagBtn.style.padding = '6px 16px';
            tagBtn.style.margin = '0 4px';
            tagBtn.style.borderRadius = '14px';
            tagBtn.style.minWidth = 'unset';
            tagBtn.style.background = (activeTag === tag) ? '#015AFD' : 'linear-gradient(45deg, #01AEFD, #00C5FF)';
            tagBtn.style.color = '#fff';
            tagBtn.style.fontWeight = 'bold';
            tagBtn.style.transition = 'background 0.2s';
            tagBtn.onclick = () => {
                if (activeTag === tag) {
                    activeTag = null;
                    tagBtn.style.background = 'linear-gradient(45deg, #01AEFD, #00C5FF)';
                } else {
                    activeTag = tag;
                    tagsRow.querySelectorAll('.tag-btn').forEach(btn => btn.style.background = 'linear-gradient(45deg, #01AEFD, #00C5FF)');
                    tagBtn.style.background = '#015AFD';
                }
                filteredConfigs = buttonConfigs.filter(config =>
                    (!config.highlighted) && (!activeTag || (Array.isArray(config.tag) ? config.tag.includes(activeTag) : config.tag === activeTag))
                );
                if (typeof renderButtons === 'function') {
                    renderButtons(filteredConfigs);
                } else if (typeof window.zwRenderButtons === 'function') {
                    window.zwRenderButtons(filteredConfigs);
                } else {
                    console.warn('renderButtons not available to update UI after tag change');
                }
                modal.remove();
            };
            tagsRow.appendChild(tagBtn);
        });
        modal.appendChild(tagsRow);
        document.body.appendChild(modal);
    }

    function rollGame() {
    if (settingsPanel && settingsPanel.parentNode) {
        settingsPanel.remove();
    }
    let oldRoller = document.getElementById('random-roller-modal');
    if (oldRoller) oldRoller.remove();

    const modal = document.createElement('div');
    modal.id = 'random-roller-modal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.width = '225px';
    modal.style.height = '275px';
    modal.style.background = '#181818';
    modal.style.borderRadius = '24px';
    modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.style.padding = '24px';
    modal.style.userSelect = 'none';

    let rolling = true;
    let currentIdx = Math.floor(Math.random() * buttonConfigs.length);
    let cycles = 0;
    let maxCycles = 30;
    let interval = null;

    const gameBtn = document.createElement('button');
    gameBtn.style.width = '150px';
    gameBtn.style.height = '190px';
    gameBtn.style.display = 'flex';
    gameBtn.style.flexDirection = 'column';
    gameBtn.style.alignItems = 'center';
    gameBtn.style.justifyContent = 'center';
    gameBtn.style.background = 'linear-gradient(45deg, #038FF9, #00C5FF)';
    gameBtn.style.border = 'none';
    gameBtn.style.borderRadius = '18px';
    gameBtn.style.boxShadow = '0 2px 12px rgba(1,174,253,0.2)';
    gameBtn.style.cursor = 'pointer';
    gameBtn.style.transition = 'box-shadow 0.2s';
    gameBtn.style.position = 'relative';

    const img = document.createElement('img');
    img.style.width = '120px';
    img.style.height = '120px';
    img.style.borderRadius = '12px';
    img.style.objectFit = 'cover';
    img.style.marginBottom = '10px';
    gameBtn.appendChild(img);

    const label = document.createElement('div');
    label.style.fontSize = '18px';
    label.style.fontWeight = 'bold';
    label.style.color = '#fff';
    label.style.textAlign = 'center';
    label.style.marginTop = '0';
    label.style.textShadow = '0 2px 8px #01AEFD44';
    gameBtn.appendChild(label);

    const rerollBtn = document.createElement('button');
    rerollBtn.innerText = 'Reroll';
    rerollBtn.style.marginTop = '18px';
    rerollBtn.style.background = '#01AEFD';
    rerollBtn.style.color = '#fff';
    rerollBtn.style.border = 'none';
    rerollBtn.style.borderRadius = '8px';
    rerollBtn.style.padding = '8px 24px';
    rerollBtn.style.fontSize = '16px';
    rerollBtn.style.cursor = 'pointer';
    rerollBtn.style.display = 'none';

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '12px';
    closeBtn.style.right = '18px';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#01AEFD';
    closeBtn.style.fontSize = '22px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        modal.remove();
        const overlayElem = document.getElementById('overlay');
        if (overlayElem) overlayElem.remove();
    };
    modal.appendChild(closeBtn);

    function updateGameBtn(idx) {
        const config = buttonConfigs[idx];
        img.src = config.image;
        label.innerText = config.label || '';
        if (!rolling) {
            gameBtn.onclick = function() {
                modal.remove();
                const overlayElem = document.getElementById('overlay');
                if (overlayElem) overlayElem.remove();
                if (panel) panel.remove();
                iframe = document.createElement('iframe');
                iframe.src = config.url;
                iframe.style.width = '100vw';
                iframe.style.height = '100vh';
                iframe.style.border = 'none';
                iframe.style.borderRadius = '0';
                iframe.style.display = 'block';
                iframe.style.margin = '0';
                iframe.style.zIndex = 2;
                iframe.style.position = 'fixed';
                iframe.style.top = '0';
                iframe.style.left = '0';
                document.body.appendChild(iframe);
            };
        } else {
            gameBtn.onclick = function() {
                if (rolling) stopRolling();
            };
        }
    }

    function rollStep() {
        currentIdx = Math.floor(Math.random() * buttonConfigs.length);
        updateGameBtn(currentIdx);
        cycles++;
        if (!rolling) return;
        if (cycles >= maxCycles) {
            stopRolling();
        }
    }

    function stopRolling() {
        if (!rolling) return;
        rolling = false;
        clearInterval(interval);
        updateGameBtn(currentIdx);
        rerollBtn.style.display = 'block';
    }

    updateGameBtn(currentIdx);
    interval = setInterval(rollStep, 100);

    rerollBtn.onclick = function() {
        rolling = true;
        cycles = 0;
        rerollBtn.style.display = 'none';
        interval = setInterval(rollStep, 100);
        updateGameBtn(currentIdx);
    };

    modal.appendChild(gameBtn);
    modal.appendChild(rerollBtn);
    document.body.appendChild(modal);
}

function showOverlay() {
    if (document.getElementById('overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(17, 17, 17, 0.7)';
    overlay.style.zIndex = '3';
    overlay.style.pointerEvents = 'auto';
    document.body.appendChild(overlay);
}
    loadGameList();
})();
