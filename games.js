javascript:(function () {
    let iframe = null;
    let panel = null;
    let settingsPanel = null;
    let dropdownMenu = null;
    let sidebar = null;
    let buttonConfigs = [];
    const version = 'v1.0';

    function loadGameList() {
        fetch('https://raw.githubusercontent.com/TrulyZeph/Zephware/main/data/gamelist.json')
            .then(response => response.json())
            .then(data => {
                buttonConfigs = data;
                createPanel();
                createDropdownMenu();
            })
            .catch(error => {
                console.error('Error loading game list:', error);
                alert('Error, Try Again.');
            });
    }

    const fredokaFontLink = document.createElement('link');
    fredokaFontLink.id = 'fredoka-font-link';
    fredokaFontLink.rel = 'stylesheet';
    fredokaFontLink.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;700&display=swap';
    document.head.appendChild(fredokaFontLink);

    const fredokaFontStyle = document.createElement('style');
    fredokaFontStyle.type = 'text/css';
    fredokaFontStyle.innerText = `
       * {
          font-family: 'Fredoka', sans-serif !important;
       }
    `;
    document.head.appendChild(fredokaFontStyle);

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
        box-shadow: 0 0 5px #63fd01;
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
        background-color: #63fd01;
    }

    .switch input:checked + .slider:before {
        transform: translateX(26px);
    }
`;

const sidebarStyle = document.createElement('style');
sidebarStyle.innerHTML = `
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 260px;
  background: #222;
  border-right: 1px solid #ccc;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 20px 0;
  z-index: 10;
}

.sidebar-btn {
  background: none;
  color: #63fd01;
  border: none;
  font-size: 20px;
  padding: 12px 24px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.sidebar-btn:hover {
  background: #333;
}
`;

document.head.appendChild(sidebarStyle);

    const fontStyle = document.createElement("style");
    fontStyle.type = "text/css";
    fontStyle.innerText = `
       * {
          font-family: 'Fredoka', sans-serif !important;
       }
    `;
    document.head.appendChild(fontStyle);
    document.head.appendChild(toggle);

    function TitleText() {
        const title = document.createElement('div');
        title.innerHTML = `Hyperware <sup style="font-size: 0.75rem">${version}</sup>`;
        title.style.fontFamily = 'Fredoka';
        title.style.fontWeight = 'bold';
        title.style.color = '#63fd01';
        title.style.fontSize = '32px';
        title.style.textAlign = 'center';
        title.style.marginTop = '15px';
  
        return title;
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
        panel.style.background = '#222';
        panel.style.fontFamily = 'Fredoka, sans-serif';
        panel.style.color = '#63fd01';
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
        `;
        document.head.appendChild(style);

        const titleBar = TitleText();
        panel.appendChild(titleBar);
        if (!sidebar) createSidebar();
        toggleSidebar();

        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.placeholder = 'Search';
        searchBar.style.width = '70%';
        searchBar.style.marginTop = '20px';
        searchBar.style.marginBottom = '-30px';
        searchBar.style.padding = '10px';
        searchBar.style.borderRadius = '10px';
        searchBar.style.border = 'none';
        searchBar.style.fontSize = '14px';
        searchBar.style.outline = 'none';
        searchBar.style.background = '#111';
        searchBar.style.color = '#63fd01';
        searchBar.style.display = 'block';
        searchBar.style.marginLeft = 'auto';
        searchBar.style.marginRight = 'auto';

        searchBar.addEventListener('input', () => {
            const query = searchBar.value.toLowerCase();
            filteredConfigs = buttonConfigs.filter(config =>
               config.label && config.label.toLowerCase().includes(query)
            );
            renderButtons(filteredConfigs);
         });
         

        panel.appendChild(searchBar);


        const sidebarBtn = document.createElement('button');
        sidebarBtn.style.position = 'absolute';
        sidebarBtn.style.top = '25px';
        sidebarBtn.style.left = '25px';
        sidebarBtn.style.width = '30px';
        sidebarBtn.style.height = '24px';
        sidebarBtn.style.background = 'transparent';
        sidebarBtn.style.border = 'none';
        sidebarBtn.style.cursor = 'pointer';
        sidebarBtn.style.color = '#63fd01';
        sidebarBtn.id = 'sidebarBtn';
        sidebarBtn.style.display = 'flex';
        sidebarBtn.style.alignItems = 'center';
        sidebarBtn.style.justifyContent = 'center';
        sidebarBtn.style.padding = '0';

        const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgIcon.setAttribute('width', '30');
        svgIcon.setAttribute('height', '24');
        svgIcon.setAttribute('viewBox', '0 0 30 24');
        svgIcon.setAttribute('fill', 'none');
        svgIcon.innerHTML = `
          <rect y="0" width="25" height="4" rx="2" fill="currentColor"/>
          <rect y="10" width="25" height="4" rx="2" fill="currentColor"/>
          <rect y="20" width="25" height="4" rx="2" fill="currentColor"/>
        `;
        sidebarBtn.appendChild(svgIcon);

        sidebarBtn.onclick = () => {
            showSidebar();
        };

        panel.appendChild(sidebarBtn);
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
        
        let filteredConfigs = buttonConfigs.slice();
        renderButtons(filteredConfigs);

        function renderButtons(configs) {
           container.innerHTML = '';
           configs.forEach(config => {
               const button = document.createElement('button');
               let buttonHeight = '120px';
               const labelText = config.label || '';
               const labelLength = labelText.length;
               let labelFontSize = '12px';
               if (labelLength > 20) {
                   buttonHeight = '130px';
                   labelFontSize = '10px';
               } else if (labelLength > 12) {
                   labelFontSize = '10px';
               }
               button.style.width = '100px';
               button.style.height = buttonHeight;
               button.style.fontSize = '16px';
               button.style.background = 'linear-gradient(45deg, #63fd01, #25fd01)';
               button.style.boxShadow = '0 2px 12px rgba(37,253,1,0.25)';
               button.style.color = '#63fd01';
               button.style.border = 'none';
               button.style.borderRadius = '15px';
               button.style.cursor = 'pointer';
               button.style.padding = '0';
               button.style.display = 'flex';
               button.style.flexDirection = 'column';
               button.style.alignItems = 'center';
               button.style.justifyContent = 'flex-start';
               button.style.position = 'relative';

               const img = document.createElement('img');
               img.src = config.image;
               img.style.width = '100px';
               img.style.height = '100px';
               img.style.borderTopLeftRadius = '15px';
               img.style.borderTopRightRadius = '15px';
               img.style.marginBottom = '0';
               img.style.display = 'block';
               img.style.position = 'relative';
               button.appendChild(img);

               const label = document.createElement('div');
               label.innerText = labelText;
               label.style.fontSize = labelFontSize;
               label.style.fontWeight = 'bold';
               label.style.color = '#fff';
               label.style.textAlign = 'center';
               label.style.padding = '2px 4px';
               label.style.marginTop = '0';
               label.style.borderRadius = '0';
               label.style.boxShadow = 'none';
               label.style.alignSelf = 'center';
               label.style.overflow = 'hidden';
               label.style.display = 'flex';
               label.style.alignItems = 'center';
               label.style.justifyContent = 'center';
               if (labelLength > 20) {
                  label.style.whiteSpace = 'normal';
                  label.style.wordBreak = 'break-word';
                  label.style.lineHeight = '1.1';
                  label.style.height = '28px';
                  label.style.textOverflow = 'clip';
               } else {
                  label.style.whiteSpace = 'nowrap';
                  label.style.textOverflow = 'ellipsis';
                  label.style.height = '14px';
               }
               button.style.position = 'relative';
               button.appendChild(label);

              button.addEventListener('click', () => {
                 panel.remove();

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
              });

              container.appendChild(button);
           });
        }     

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
        settingsPanel.style.fontFamily = 'Fredoka, sans-serif';
        settingsPanel.style.color = '#63fd01';
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
        closeBtn.style.color = '#63fd01';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => {
            settingsPanel.remove();
            if (overlay) overlay.remove();
            hideSidebar();
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
        <h3>Keybinds</h3>
        <p style="color: #63fd01;">Ctrl + E | Hide<br>Ctrl + M | Menu<br>More Soon...</p>
        <h3>Credits</h3>
        <p style="color: #63fd01;">Owner: @etenallyhyper</p>
        <div style="text-align: center; font-size: 10px; margin-top: 35px;">
        Hyperware | <span style="font-size: 0.75rem;">${version}</span>
        </div>
`;

        settingsPanel.appendChild(content);
        document.body.appendChild(settingsPanel);
    }


    function createDropdownMenu() {
    if (dropdownMenu) {
        dropdownMenu.style.visibility = dropdownMenu.style.visibility === 'hidden' ? 'visible' : 'hidden';
        return dropdownMenu;
    }

    dropdownMenu = document.createElement('div');
    dropdownMenu.style.position = 'fixed';
    dropdownMenu.style.top = '30%';
    dropdownMenu.style.left = '42%';
    dropdownMenu.style.background = '#1a1a1a';
    dropdownMenu.style.width = '300px';
    dropdownMenu.style.height = '350px';
    dropdownMenu.style.border = '1px solid #63fd01';
    dropdownMenu.style.borderRadius = '8px';
    dropdownMenu.style.display = 'flex';
    dropdownMenu.style.flexDirection = 'column';
    dropdownMenu.style.justifyContent = 'center';
    dropdownMenu.style.alignItems = 'center';
    dropdownMenu.style.visibility = 'hidden';
    dropdownMenu.style.zIndex = '5';
    dropdownMenu.id = 'dropdownmenu';

    const settingsBtn = document.createElement('button');
    settingsBtn.innerText = 'Settings';
    settingsBtn.style.background = 'transparent';
    settingsBtn.style.fontFamily = 'Fredoka, sans-serif';
    settingsBtn.style.fontWeight = 'bold';
    settingsBtn.style.color = '#63fd01';
    settingsBtn.style.border = 'none';
    settingsBtn.style.fontSize = '32px';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.onclick = () => {
        createSettingsPanel();
        dropdownMenu.style.visibility = 'hidden';
    };

    const hideBtn = document.createElement('button');
    hideBtn.innerText = 'Hide';
    hideBtn.style.background = 'transparent';
    hideBtn.style.fontFamily = 'Fredoka, sans-serif';
    hideBtn.style.fontWeight = 'bold';
    hideBtn.style.color = '#63fd01';
    hideBtn.style.border = 'none';
    hideBtn.style.fontSize = '32px';
    hideBtn.style.cursor = 'pointer';
    hideBtn.onclick = () => {
        if (panel) panel.style.display = 'none';
        if (iframe) iframe.style.display = 'none';
        dropdownMenu.style.visibility = 'hidden';
    };

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Exit';
    closeBtn.style.background = 'transparent';
    closeBtn.style.fontFamily = 'Fredoka, sans-serif';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.color = '#ff0000';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '32px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        panel?.remove();
        iframe?.remove();
        settingsPanel?.remove();
        dropdownMenu?.remove();
        sidebarBtn?.remove();
    };

    const homeBtn = document.createElement('button');
    homeBtn.innerText = 'Home';
    homeBtn.style.background = 'transparent';
    homeBtn.style.fontFamily = 'Fredoka, sans-serif';
    homeBtn.style.fontWeight = 'bold';
    homeBtn.style.color = '#63fd01';
    homeBtn.style.border = 'none';
    homeBtn.style.fontSize = '32px';
    homeBtn.style.cursor = 'pointer';
    homeBtn.style.textAlign = 'center';
    homeBtn.onclick = () => {
        if (document.getElementById('panel') == null) {
            createPanel();
            iframe?.remove();
            dropdownMenu.style.visibility = 'hidden';
        }
    };

    dropdownMenu.appendChild(homeBtn);
    dropdownMenu.appendChild(settingsBtn);
    dropdownMenu.appendChild(hideBtn);
    dropdownMenu.appendChild(closeBtn);

    document.body.appendChild(dropdownMenu);
    return dropdownMenu;
    }

    const style = document.createElement('style');
    style.innerHTML = `
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
    document.head.appendChild(style);

    function createSidebar() {
    if (sidebar) {
        const isHidden = sidebar.classList.contains('sidebar-hidden');
        sidebar.classList.toggle('sidebar-hidden', !isHidden);
        sidebar.classList.toggle('sidebar-visible', isHidden);
        return sidebar;
    }

    const blooketSidebarStyle = document.createElement('style');
    blooketSidebarStyle.textContent = `
    #wp-sidebar {
        width: 200px;
        background: #111;
        display: flex;
        flex-direction: column;
        border-right: 1px solid rgba(255,255,255,0.1);
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 5;
        transform: translateX(-220px);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s cubic-bezier(.4,0,.2,1);
    }
    #wp-sidebar.sidebar-visible {
        transform: translateX(0);
        opacity: 1;
    }
    .wp-sidebar-btn {
        padding: 16px;
        border: none;
        background: none;
        color: #63fd01;
        font-size: 16px;
        cursor: pointer;
        text-align: left;
        transition: background 0.2s;
    }
    .wp-sidebar-btn.active {
        border-left: 4px solid #63fd01;
        background: rgba(255,255,255,0.05);
    }
    .wp-divider {
        width: 100%;
        height: 1px;
        background: rgba(255,255,255,0.1);
        margin: 4px 0;
    }
    `;
    document.head.appendChild(blooketSidebarStyle);

    sidebar = document.createElement('div');
    sidebar.id = 'wp-sidebar';
    sidebar.className = 'sidebar';
    sidebar.style.zIndex = '5';
    sidebar.style.display = 'none';
    const buttons = [
        { label: 'Home', onClick: function() {
            setActiveSidebarBtn(this);
            hideSidebar();
        }},
        { label: 'Random', onClick: function() {
            setActiveSidebarBtn(this);
            rollGame();
        }},
        { label: 'Settings', onClick: function() {
            setActiveSidebarBtn(this);
            createSettingsPanel();
            showOverlay();
        }},
        { label: 'Forms', onClick: function() {
            setActiveSidebarBtn(this);
            window.open('https://forms.gle/h5DHdt5EnsT3bwqP7', '_blank');
        }},
        { label: 'Close', onClick: function() {
            setActiveSidebarBtn(this);
            hideSidebar();
        }},
        { label: 'Exit', onClick: function() {
            setActiveSidebarBtn(this);
            panel?.remove();
            iframe?.remove();
            settingsPanel?.remove();
            sidebar?.remove();
            sidebarBtn?.remove();
        }, style: { color: '#FF0000' } }
    ];
    function setActiveSidebarBtn(btnElem) {
        const allBtns = sidebar.querySelectorAll('.wp-sidebar-btn');
        allBtns.forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
    }
    buttons.forEach((btn, idx) => {
        if (btn.divider) {
            const divider = document.createElement('div');
            divider.className = 'wp-divider';
            sidebar.appendChild(divider);
            return;
        }
        const button = document.createElement('button');
        button.className = 'wp-sidebar-btn' + (idx === 0 ? ' active' : '');
        button.innerText = btn.label;
        if (btn.style) Object.assign(button.style, btn.style);
        button.onclick = btn.onClick;
        sidebar.appendChild(button);
    });
    document.body.appendChild(sidebar);

    return sidebar;
    }

    function hideSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('sidebar-visible');
        setTimeout(() => { sidebar.style.display = 'none'; }, 300);
        if (sidebarBtn) sidebarBtn.style.display = 'flex';
        const allBtns = sidebar.querySelectorAll('.wp-sidebar-btn');
        allBtns.forEach((b, i) => {
            if (i === 0) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        const news = document.getElementById('overlay');
        if (news) news.remove();
        if (settingsPanel && settingsPanel.parentNode) {
            settingsPanel.remove();
        }
    }

    function toggleSidebar(show) {
        if (!sidebar) return;

        const shouldShow = typeof show === 'boolean' ? show : !sidebar.classList.contains('sidebar-visible');

        sidebar.classList.toggle('sidebar-visible', shouldShow);
        sidebar.classList.toggle('sidebar-hidden', !shouldShow);
    }

    function toggleFrames(event) {
        if (event.key === 'e' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();

            if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (iframe) iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
        }
    }

    function toggleMenu(event) {
    if (event.key === 'm' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        
        if (!dropdownMenu) return;
        if (iframe) dropdownMenu.style.visibility = dropdownMenu.style.visibility === 'hidden' ? 'visible' : 'hidden';
    }
}


    function showSidebar() {
        if (!sidebar) return;
        sidebar.style.display = '';
        setTimeout(() => sidebar.classList.add('sidebar-visible'), 10);
        if (sidebarBtn) sidebarBtn.style.display = 'none';
        showOverlay();
    }

    function rollGame() {
    // Close settings panel if open
    if (settingsPanel && settingsPanel.parentNode) {
        settingsPanel.remove();
    }
    // Remove any existing roller
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
    gameBtn.style.background = 'linear-gradient(45deg, #63fd01, #25fd01)';
    gameBtn.style.border = 'none';
    gameBtn.style.borderRadius = '18px';
    gameBtn.style.boxShadow = '0 2px 12px rgba(37,253,1,0.25)';
    gameBtn.style.cursor = 'pointer';
    gameBtn.style.transition = 'box-shadow 0.2s';
    gameBtn.style.position = 'relative';

gameBtn.addEventListener('mouseenter', () => {
  gameBtn.style.boxShadow =
    '0 0 12px rgba(99,253,1,0.8), 0 0 28px rgba(37,253,1,0.6)';
});

gameBtn.addEventListener('mouseleave', () => {
  gameBtn.style.boxShadow =
    '0 2px 12px rgba(37,253,1,0.25)';
});
 
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
    label.style.textShadow = '0 2px 8px #63fd0144';
    gameBtn.appendChild(label);

    const rerollBtn = document.createElement('button');
    rerollBtn.innerText = 'Reroll';
    rerollBtn.style.marginTop = '18px';
    rerollBtn.style.background = '#63fd01';
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
    closeBtn.style.color = '#63fd01';
    closeBtn.style.fontSize = '22px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        modal.remove();
        hideSidebar();
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
                hideSidebar();
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

    document.addEventListener('keydown', toggleFrames);
    document.addEventListener('keydown', toggleMenu);
    loadGameList();
})();
/* 
add disguise (fake background) -- customizable through settings
add tab disguise
add escape button
add console
*/
