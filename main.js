javascript:(function(){if(window.location.hostname.indexOf('google.com')>-1){javascript:(function(){document.open();document.write("");document.close(); 

 if (!document.getElementById('fredoka-font-link')) {
    const link = document.createElement('link');
    link.id = 'fredoka-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka&display=swap';
    document.head.appendChild(link);
  }

const themes = {
   default: {
      color1: '#63fd01',
      color2: '#25fd01',   
      img1: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/default/Current.jpg',
      img2: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/default/Previous.png',
      waves: ['#87ff63ff','#72f73eff','#3ee029ff']
   },
   blue: {
      color1: '#01AEFD',
      color2: '#015AFD',
      img1: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/blue/Current.png',
      img2: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/blue/Previous.png',
      waves: ['#63baff','#3ea7f7','#298ee0']
   },
   orange: {
      color1: '#f7ab1dff',
      color2: '#eb6c04ff',
      img1: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/halloween/Current.png',
      img2: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/halloween/Previous.png',
      waves: ['#fdba01ff','#f77e1dff','#e26817ff']
   },
   red: {
      color1: '#ff6363ff',
      color2: '#e03e3eff',
      img1: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/red/Current.png',
      img2: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/red/Previous.png',
      waves: ['#ff6363ff','#e03e3eff','#b31515ff']
   },
   purple: {
      color1: '#b463ffff',
      color2: '#8d3ee0ff',
      img1: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/purple/Current.png',
      img2: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/purple/Previous.png',
      waves: ['#b463ffff','#8d3ee0ff','#5a15b3ff']
   },
   pink: {
      color1: '#fc57e6ff',
      color2: '#ff008cff',
      img1: 'https://d1kusoubqqwr7w.cloudfront.net/assets/themes/pink/Current.png',
      img2: 'https://d1kusoubqqwr7w.cloudfront.net/assets/themes/pink/Previous.png',
      waves: ['#ff00c8ff', '#e645cbff', '#f571d4ff']
   },
   christmas: {
      color1: '#00ff2aff',
      color2: '#ff0000ff',
      img1: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/christmas/Current.png',
      img2: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/themes/christmas/Previous.png',
      waves: ['#e0dbdbff','#f0f0f0ff','#fdfdfdff']
   }
};
let currentTheme = localStorage.getItem("hyperware-theme") || "red";
let theme = themes[currentTheme];
setTimeout(() => applyThemeEffects(currentTheme), 100);

  const style = document.createElement('style');
  style.textContent = `
    ::selection{background-color: salmon; color: white;}

    .parallax > use{
      animation:move-forever 12s linear infinite;
    }
    .parallax > use:nth-child(1){animation-delay:-2s;}
    .parallax > use:nth-child(2){animation-delay:-2s; animation-duration:5s}
    .parallax > use:nth-child(3){animation-delay:-4s; animation-duration:3s}

    @keyframes move-forever{
      0%{transform: translate(-90px , 0%)}
      100%{transform: translate(85px , 0%)}
    }

    .editorial {
      display: block;
      width: 100%;
      height: 10em;
      max-height: 100vh;
      margin: 0;
      position: fixed;
      bottom: 10vh;
      left: 0;
      z-index: 10;
    }

    body {
      background-color: #234;
      margin: 0;    
      max-height: 100vh;
      overflow: hidden;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      height: 100vh;
    }

    .header1 {
      position: fixed;
      width: 100%;
      text-align: center;
      font-weight: bold;
      font-family: 'Fredoka', sans-serif;
      background: linear-gradient(to bottom, ${theme.color1}, ${theme.color2});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      -webkit-user-select: none;
      z-index: 100;
    }

    .header2 {
      position: fixed;
      top: 4.25em;
      width: 100%;
      text-align: center;
      font-weight: bold;
      font-family: 'Fredoka', sans-serif;
      background: linear-gradient(to bottom, ${theme.color1}, ${theme.color2});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      -webkit-user-select: none;
      z-index: 100;
    }
    
    .description {
      position: fixed;
      top: 19.5em;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: 1.2em;
      color: #bbb;
      font-weight: 400;
      font-style: italic;
      font-family: 'Fredoka', sans-serif;
      -webkit-user-select: none;
      z-index: 100;
    }

    .input-area {
      position: fixed;
      top: 26em;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      color: #000000;
      gap: 0.5em;
      z-index: 100;
    }

    .input-area .label-text {
      font-family: 'Fredoka', sans-serif;
      font-size: 1.4em;
      color: #ddd;
      font-weight: 500;
      -webkit-user-select: none;
      white-space: nowrap;
    }

    .input-area select {
      font-family: 'Fredoka', sans-serif;
      font-size: 1.2em;
      font-weight: 500;
      color: ${theme.color1};
      padding: 0.3em 0.6em;
      border: none;
      border-radius: 5px;
      outline: none;
      background-color:rgb(42, 42, 42);
      cursor: pointer;
      width: 200px;
    }

    .input-area button {
      font-family: 'Fredoka', sans-serif;
      font-size: 1.2em;
      padding: 0.4em 1em;
      border: none;
      border-radius: 5px;
      background: linear-gradient(to bottom, ${theme.color1}, ${theme.color2});
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: none;
    }

    @media (max-width:50em){
      .description {
        font-size: 3vw;
      }
      .input-area .label-text {
        font-size: 5vw;
      }
      .header {
        font-size: 6vw;
      }
      .input-area select, .input-area button {
        font-size: 3.5vw;
        width: auto;
      }
    }
    #overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      z-index: 3;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #overlay-box {
      background: rgba(17, 17, 17, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      max-width: 520px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      text-align: center;
    }
    #overlay-box h1 {
      font-size: 24px;
      color: #01AEFD;
      margin-bottom: 16px;
    }
    #overlay-box p {
      color: white;
      margin-bottom: 24px;
    }
    #overlay-box button {
      font-size: 16px;
      font-family: 'Fredoka', sans-serif;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      background-color: ${theme.color1};
      color: white;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const oldSVG = document.querySelector('svg.editorial');
  if(oldSVG) oldSVG.remove();
  const oldContent = document.querySelector('div.content');
  if(oldContent) oldContent.remove();
  const oldHeader = document.querySelector('div.header');
  if(oldHeader) oldHeader.remove();
  const oldDesc = document.querySelector('div.description');
  if(oldDesc) oldDesc.remove();
  const oldInputArea = document.querySelector('div.input-area');
  if(oldInputArea) oldInputArea.remove();

  const svgNS = "http://www.w3.org/2000/svg";
  const xlinkNS = "http://www.w3.org/1999/xlink";
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'editorial');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('xmlns:xlink', xlinkNS);
  svg.setAttribute('viewBox', '0 24 150 28');
  svg.setAttribute('preserveAspectRatio', 'none');

  const defs = document.createElementNS(svgNS, 'defs');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('id', 'gentle-wave');
  path.setAttribute('d', `M-160 44c30 0 
    58-18 88-18s
    58 18 88 18 
    58-18 88-18 
    58 18 88 18
    v44h-352z`);
  defs.appendChild(path);
  svg.appendChild(defs);

  const g = document.createElementNS(svgNS, 'g');
  g.setAttribute('class', 'parallax');

  const ys = ['0','3','6'];
  for(let i=0; i<3; i++){
    const use = document.createElementNS(svgNS, 'use');
    use.setAttributeNS(xlinkNS, 'xlink:href', '#gentle-wave');
    use.setAttribute('x', '50');
    use.setAttribute('y', ys[i]);
    use.setAttribute('fill', theme.waves[i]);
    g.appendChild(use);
  }
  svg.appendChild(g);
  document.body.appendChild(svg);

  var guiWidth = 600,
  guiHeight = 500,
  borderRadius = 20,
  guiDiv = document.createElement('div');

  var password = 'password';
  var panelVisible = true;
  
  guiDiv.style.position = 'fixed';
  guiDiv.style.top = '50%';
  guiDiv.style.left = '50%';
  guiDiv.style.transform = 'translate(-50%, -50%)';
  guiDiv.style.width = guiWidth + 'px';
  guiDiv.style.height = guiHeight + 'px';
  guiDiv.style.borderRadius = borderRadius + 'px';
  guiDiv.style.overflow = 'hidden';
  guiDiv.style.zIndex = 9999;
  guiDiv.style.background = '#111';
  guiDiv.style.textAlign = 'center';
  guiDiv.style.fontFamily = 'Verdana, sans-serif';

  var title = document.createElement('div');
  title.className = 'header1';
  title.textContent = 'Hyperware';
  title.style.marginTop = '70px';
  title.style.fontSize = '3em';
  title.style.padding = '0.5em 0';

  var inputBox = document.createElement('input');
  inputBox.style.position = 'absolute';
  inputBox.style.left = '50%';
  inputBox.style.top = '170px';
  inputBox.style.transform = 'translateX(-50%)';
  inputBox.style.width = '300px';
  inputBox.style.height = '35px';
  inputBox.style.border = '2px solid';
  inputBox.style.borderColor = theme.color2;
  inputBox.style.borderRadius = '15px';
  inputBox.style.background = 'transparent';
  inputBox.style.color = theme.color2;
  inputBox.style.fontSize = '18px';
  inputBox.style.paddingLeft = '10px';
  inputBox.style.outline = 'none';
  inputBox.style.textAlign = 'center';
  inputBox.placeholder = 'Enter Password';
  inputBox.type = 'password';

  var graybg = document.createElement('div');
  graybg.id = 'news-overlay';
  graybg.style.position = 'fixed';
  graybg.style.top = '0';
  graybg.style.left = '0';
  graybg.style.width = '100vw';
  graybg.style.height = '100vh';
  graybg.style.background = 'rgba(0,0,0,0.9)';
  graybg.style.zIndex = '100';
  graybg.style.display = 'flex';
  graybg.style.justifyContent = 'center';
  graybg.style.alignItems = 'center';
  graybg.style.fontFamily = "'Fredoka', sans-serif";
  document.body.appendChild(graybg);

  inputBox.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      checkPassword();
    }
  });

  function checkPassword() {
    if (inputBox.value === password) {
      closePanel();
      showNewsPanel();
    } else {
      alert('Incorrect Password!');
    }
  }

  function closePanel() {
    if (guiDiv.parentNode) guiDiv.parentNode.removeChild(guiDiv);
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === ']') {
      panelVisible = !panelVisible;
      guiDiv.style.display = panelVisible ? 'block' : 'none';
    }
  });

  var passdesc = document.createElement('div');
  passdesc.style.position = 'absolute';
  passdesc.style.left = '50%';
  passdesc.style.top = '215px';
  passdesc.style.transform = 'translateX(-50%)';
  passdesc.style.fontSize = '11px';
  passdesc.style.fontWeight = 'bold';
  passdesc.style.color = '#3D3636';
  passdesc.innerText = 'Hyperware requires a password to hide from GoGuardian';

  var hint = document.createElement('div');
  hint.style.position = 'absolute';
  hint.style.left = '50%';
  hint.style.top = '275px';
  hint.style.transform = 'translateX(-50%)';
  hint.style.fontSize = '11px';
  hint.style.fontWeight = 'bold';
  hint.style.color = '#FFFFFF';
  hint.style.width = '95%';
  hint.style.textAlign = 'center';
  hint.style.whiteSpace = 'normal';
  hint.style.lineHeight = '1.1';

  var randomBtn = document.createElement('button');
  randomBtn.innerText = 'New Message';
  randomBtn.style.position = 'absolute';
  randomBtn.style.left = '50%';
  randomBtn.style.top = '325px';
  randomBtn.style.transform = 'translateX(-50%)';
  randomBtn.style.padding = '5px 10px';
  randomBtn.style.cursor = 'pointer';
  randomBtn.style.backgroundColor = theme.color2;
  randomBtn.style.borderRadius = '15px';
  randomBtn.style.border = 'none';
  randomBtn.style.color = 'white';

  var messages = [
  'The password is designed to be very “Human” - EternallyHyper',
  'Just put the password - EternallyHyper',
  'It’s all lowercase btw - EternallyHyper',
  'Had a lot of fun typing these messages, the password is ******** - EternallyHyper',
  'It’s not hard to put the password - EternallyHyper',
  'Check out the GitHub: www.github.com/EternallyHyper/Hyperware - EternallyHyper',
  'How did you not type the password already - EternallyHyper',
  'Maybe ask a teacher lol - EternallyHyper',
  'You should probably type in the password',
  'dude this message feature cannot be this fun',
  'hmm',
  'who needs 67 when we got 21 lol - EternallyHyper',
  'ok ok fine the password is [Censored] - EternallyHyper',
  'screw goguardian - EternallyHyper',
  'Maybe try testing every single password known to man - EternallyHyper',
  'idk the password bro sry - EternallyHyper',
  'How are you still here - EternallyHyper',
  'Maybe the password is right there - EternallyHyper',
  'Stop pressing that button - EternallyHyper',
  'Why am I typing this? - EternallyHyper',
  'As you can see I am very hyper - EternallyHyper',
  '”Are you sure?”',
  'As one wise man once said, “Screw GoGuardian, Enjoy Hyperware” - EternallyHyper',
  'GoGuardian shouldn’t exist, who’s with me? - EternallyHyper',
  'This message is VERY rare, go screenshot it',
  'lol',
  '😭🙏',
  'Also try Hypackel Games',
  'Please finish your homework before using this',
  'Hyperware was lowkey fun to make - EternallyHyper',
  'If you use another blocker then I’m sry for you - EternallyHyper',
  'Go play some games',
  'There’s like a ton of messages here - EternallyHyper',
  'can’t believe you are still here',
  'Dude just type the password',
  'Btw i know the password - EternallyHyper',
  'If this ain’t peak idk what is',
  'Hyperware > Zephware',
  'What is this',
  'ts is peak',
  'Also try TotallyScience',
  'Also try FreezeNova.Cloud',
  'Also try ClassroomGames Unblocked',
  'Did you know that the longest word is pneumonoultramicroscopicsilicovolcanoconiosis',
  'Don’t bother asking me for the password - EternallyHyper',
  'Try smth else - EternallyHyper',
  'go to sleep - EternallyHyper',
  'You probably shouldn’t be doing this rn - EternallyHyper',
  'Also try Zephware',
  'Try “tookforeversry” for learning tools - EternallyHyper',
  'JUST PUT THE PASSWORD ALREADY',
  'I should put the password for other stuff here - EternallyHyper',
  'These messages got to go bro 😭 - EternallyHyper',
  'If you want to access blooket hacks just use “back2schoolggs” - EternallyHyper',
  'Took forever to incorporate learning tools lol - EternallyHyper',
  'I added a cooldown lol - EternallyHyper',
  'did you know that you can use the space bar - EternallyHyper',
  'blockers should not exist - EternallyHyper',
  'EternallyHyper shut up already - Hyperware',
  'Why am I even gatekeeping the password - EternallyHyper',
  'Maybe check the github - EternallyHyper',
  '💔🥀',
  'w speed',
  'Dude it ain’t that hard to enter in a password bro like stop - Hyperware',
  'Going to shut down this whole thing if you don’t stop pressing that button - EternallyHyper',
  'I am typing these messages as you press that button - EternallyHyper',
  'I am hyper for eternity - EternallyHyper',
  'Also try frogie’s arcade',
  '…',
  'Idk why EternallyHyper is gatekeeping the password, its password - Hyperware',
  'The password is very simple. - EternallyHyper'
  ];

  function updateHint() {
  if (randomBtn.disabled) return;

  randomBtn.disabled = true;
  randomBtn.style.cursor = 'not-allowed';
  randomBtn.style.opacity = '0.5';

  var randomMessage = messages[Math.floor(Math.random() * messages.length)];
  hint.innerText = randomMessage;

  setTimeout(function() {
    randomBtn.disabled = false;
    randomBtn.style.cursor = 'pointer';
    randomBtn.style.opacity = '1';
  }, 4000);
}

window.addEventListener('keydown', function(event) {
  if (event.repeat) return; 

  if (event.key === " " || event.code === "Space") {
    event.preventDefault(); 
    updateHint();
  }
});

randomBtn.addEventListener('click', updateHint);

var randomMessage = messages[Math.floor(Math.random() * messages.length)];
hint.innerText = randomMessage;

  guiDiv.appendChild(title);
  guiDiv.appendChild(inputBox);
  guiDiv.appendChild(passdesc);
  guiDiv.appendChild(hint);
  guiDiv.appendChild(randomBtn);
  document.body.appendChild(guiDiv);
  document.body.appendChild(graybg);

  const coverBox = document.createElement('div');
  coverBox.style.position = 'fixed';
  coverBox.style.left = '0';
  coverBox.style.right = '0';
  coverBox.style.bottom = '0';
  coverBox.style.height = '11vh';
  coverBox.style.backgroundColor = theme.waves[2];
  coverBox.style.zIndex = '5';
  document.body.appendChild(coverBox);

  const content = document.createElement('div');
  content.className = 'content';
  document.body.appendChild(content);

  const header = document.createElement('div');
  header.className = 'header2';
  header.textContent = 'Hyperware';
  header.style.fontSize = '4em';
  header.style.padding = '0.25em 0';
  document.body.appendChild(header);

  const description = document.createElement('div');
  description.className = 'description';
  description.textContent = 'The Bookmarklet On Steroids';
  document.body.appendChild(description);

  const inputArea = document.createElement('div');
  inputArea.className = 'input-area';

  const labelText = document.createElement('div');
  labelText.className = 'label-text';
  labelText.textContent = 'I want to access';
  labelText.setAttribute('for', 'selector');
  inputArea.appendChild(labelText);

  const select = document.createElement('select');
  select.id = 'selector';
  select.setAttribute('title', '');
  const options = ['Games', 'Library', 'Zephware', 'News', 'Themes', 'Schoology Utilities', 'Inspect Element', 'Learning Tools', 'Marketplace', 'Blooket Hacks', 'Gimkit Hacks'];
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.toLowerCase();
    option.textContent = opt;
    select.appendChild(option);
  });
  inputArea.appendChild(select);

  const button = document.createElement('button');
  button.textContent = 'Go';
  inputArea.appendChild(button);

   function getNewsPages() {
  return [
    {
      title: "What's New?",
      desc: "v1.2.1 : Week of February 15th, 2026",
      images: [
        { src: theme.img1 }
      ],
      changes: [
        { text: "Data Saving", desc: "Games and Library save data now" },
        { text: "Themes", desc: "Themes are here! Use the themes option to choose. Seasonal Themes are included and have their corresponding features." }
      ]
    },
    {
      title: "What'd I Miss?",
      desc: "v1.2.0 : Week of February 8st, 2026",
      images: [
        { src: theme.img2 }
      ],
      changes: [
        { text: "Lock Screen Additions", desc: "added funni messages, a disclaimer and extended the gui" },
        { text: "Drop Down Menu Extension", desc: "Options like Schoology utilities fully appear now" },
        { text: "Games and Library", desc: "they’re back go enjoy them" },
        { text: "Inspect Element", desc: "iPad users can now enjoy the inspect tool lol" }
      ]
    },
    {
      title: "What's Next?",
      desc: "v1.2.2 : Coming Soon!",
      images: [
        { src: "https://placehold.co/600x400/000000/FFF?text=Coming+Soon" }
      ],
      changes: [
        { text: "Learning Tools Completion", desc: "Adding Calculator, Marker Tool, etc." },
        { text: "IXL+ Hacks", desc: "Paid $5 for it lol" },
        { text: "Gimkit Hacks", desc: "Working on it, might be patched though." },
        { text: "Games Rework", desc: "Will be branded with Hyperware soon" },
        { text: "TinyTask Web Port", desc: "still trying to incorporate tinytask for browsers" }
      ]
    }
  ];
}

function showThemePanel() {
  const old = document.getElementById('overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'overlay';
  overlay.style.zIndex = '99999';
  overlay.style.fontFamily = "'Fredoka', sans-serif";

  let themeOptionsHTML = Object.keys(themes).map(key => `
    <div 
      style="
        padding:12px;
        margin:8px;
        border-radius:12px;
        cursor:pointer;
        background:linear-gradient(to right, ${themes[key].color1}, ${themes[key].color2});
        font-weight:bold;
        text-align:center;
      "
      data-theme="${key}"
    >
      ${key.toUpperCase()}
    </div>
  `).join("");

  overlay.innerHTML = `
    <div id="overlay-box" style="font-family:'Fredoka',sans-serif;max-height:500px;overflow-y:auto;">
      <h1 style="color:${theme.color1};">Select Theme</h1>
      ${themeOptionsHTML}
      <br>
      <button id="theme-close" style="font-family:'Fredoka',sans-serif;">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('[data-theme]').forEach(el => {
    el.onclick = () => {
      const selected = el.getAttribute('data-theme');
      applyTheme(selected);
    };
  });

  overlay.querySelector('#theme-close').onclick = () => {
    overlay.remove();
  };
}

let activeEffect = null;

function clearThemeEffects() {
  if (activeEffect && activeEffect.cleanup) {
    activeEffect.cleanup();
  }
  activeEffect = null;
}

function applyThemeEffects(themeName) {
  clearThemeEffects();

  switch(themeName) {

    /* ❄ CHRISTMAS → Snowfall */
    case "christmas":
      activeEffect = createSnowfall();
      break;

    /* ❤️ RED → Red Hearts */
    case "red":
      activeEffect = createHeartfall("❤️");
      break;

    /* 💗 PINK → Pink Hearts */
    case "pink":
      activeEffect = createHeartfall("💗");
      break;

    /* 👻 ORANGE (Halloween) → Jumpscare Flicker */
    case "orange":
      activeEffect = createJumpScare();
      break;

    default:
      break;
  }
}

function applyTheme(name) {
  theme = themes[name];
  localStorage.setItem("hyperware-theme", name);

  document.querySelectorAll('.header1, .header2').forEach(el => {
    el.style.background = `linear-gradient(to bottom, ${theme.color1}, ${theme.color2})`;
    el.style.webkitBackgroundClip = "text";
    el.style.webkitTextFillColor = "transparent";
  });

  document.querySelectorAll('button').forEach(btn => {
    if (!btn.disabled) {
      btn.style.background = `linear-gradient(to bottom, ${theme.color1}, ${theme.color2})`;
    }
  });

  const select = document.querySelector('select');
  if (select) {
    select.style.color = theme.color1;
  }

  document.querySelectorAll('input').forEach(inp => {
    inp.style.borderColor = theme.color2;
    inp.style.color = theme.color2;
  });

  const waves = document.querySelectorAll('.parallax use');
  waves.forEach((wave, i) => {
    wave.setAttribute('fill', theme.waves[i]);
  });

  const cover = document.querySelector('div[style*="11vh"]');
  if (cover) cover.style.backgroundColor = theme.waves[2];

  document.querySelectorAll('#overlay-box h1').forEach(h1 => {
    h1.style.color = theme.color1;
  });

const newsOverlay = document.getElementById('news-overlay');
if (newsOverlay) {
  const img = newsOverlay.querySelector('img');
  if (img) {
    let pages = getNewsPages();
    img.src = pages[0].images[0].src;
  }
}

document.body.style.transition = "background 0.4s ease";

applyThemeEffects(name);
}

function showNewsPanel() {
let newsPages = getNewsPages();
  let pageIdx = 0;
  let imgIdx = 0;

  const old = document.getElementById('news-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'news-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.75)';
  overlay.style.zIndex = '100000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.fontFamily = "'Fredoka', sans-serif";

  const panel = document.createElement('div');
  panel.style.width = '600px';
  panel.style.height = '500px';
  panel.style.background = 'rgba(17,17,17,0.97)';
  panel.style.borderRadius = '24px';
  panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'center';
  panel.style.position = 'relative';
  panel.style.padding = '32px 24px 24px 24px';
  panel.style.textAlign = 'center';
  panel.style.overflow = 'hidden';

  const panelContent = document.createElement('div');
  panelContent.style.flex = '1';
  panelContent.style.overflowY = 'auto';
  panelContent.style.width = '100%';
  panelContent.style.display = 'flex';
  panelContent.style.flexDirection = 'column';
  panelContent.style.alignItems = 'center';
  panelContent.style.scrollbarWidth = 'none';
  panelContent.style.msOverflowStyle = 'none';
  panelContent.style.overflowX = 'hidden';
  panelContent.classList.add('hide-scrollbar');

  const navRow = document.createElement('div');
  navRow.style.display = 'flex';
  navRow.style.alignItems = 'center';
  navRow.style.justifyContent = 'center';
  navRow.style.width = '100%';
  navRow.style.marginBottom = '12px';

  const leftArrow = document.createElement('span');
  leftArrow.textContent = '<';
  leftArrow.style.fontSize = '2em';
  leftArrow.style.cursor = 'pointer';
  leftArrow.style.userSelect = 'none';
  leftArrow.style.marginRight = '8px';
  leftArrow.style.color = theme.color1;
  leftArrow.title = 'Previous';

  const rightArrow = document.createElement('span');
  rightArrow.textContent = '>';
  rightArrow.style.fontSize = '2em';
  rightArrow.style.cursor = 'pointer';
  rightArrow.style.userSelect = 'none';
  rightArrow.style.marginLeft = '8px';
  rightArrow.style.color = theme.color1;
  rightArrow.title = 'Next';

  const title = document.createElement('span');
  title.style.fontSize = '2em';
  title.style.fontWeight = 'bold';
  title.style.color = theme.color1;
  title.style.fontFamily = "'Fredoka', sans-serif";
  navRow.appendChild(leftArrow);
  navRow.appendChild(title);
  navRow.appendChild(rightArrow);

  const pageDesc = document.createElement('div');
  pageDesc.style.fontSize = '1.05em';
  pageDesc.style.color = '#aaa';
  pageDesc.style.margin = '2px 0 10px 0';
  pageDesc.style.minHeight = '1.2em';
  pageDesc.style.fontFamily = "'Fredoka', sans-serif";

  const imgWrap = document.createElement('div');
  imgWrap.style.width = '100%';
  imgWrap.style.height = '240px';
  imgWrap.style.display = 'flex';
  imgWrap.style.justifyContent = 'center';
  imgWrap.style.alignItems = 'center';
  imgWrap.style.margin = '0 0 18px 0';
  imgWrap.style.borderRadius = '32px';
  imgWrap.style.position = 'relative';
  imgWrap.style.background = 'rgba(40,40,40,0.18)';
  imgWrap.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
  imgWrap.style.padding = '0';
  imgWrap.style.overflow = 'hidden';

  const img = document.createElement('img');
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '32px';
  img.style.display = 'block';
  img.style.margin = '0';
  img.style.padding = '0';
  img.draggable = false;
  imgWrap.appendChild(img);

  let startX = null;
  imgWrap.addEventListener('touchstart', e => {
    if (e.touches.length === 1) startX = e.touches[0].clientX;
  });
  imgWrap.addEventListener('touchend', e => {
    if (startX === null) return;
    const endX = e.changedTouches[0].clientX;
    const imgs = newsPages[pageIdx].images;
    if (endX - startX > 40) {
      imgIdx = (imgIdx - 1 + imgs.length) % imgs.length;
      render();
    } else if (startX - endX > 40) {
      imgIdx = (imgIdx + 1) % imgs.length;
      render();
    }
    startX = null;
  });

  let dragStartX = null;
  imgWrap.addEventListener('mousedown', e => {
    dragStartX = e.clientX;
    document.body.style.userSelect = 'none';
  });
  imgWrap.addEventListener('mouseup', e => {
    if (dragStartX === null) return;
    const dragEndX = e.clientX;
    const imgs = newsPages[pageIdx].images;
    if (dragEndX - dragStartX > 40) {
      imgIdx = (imgIdx - 1 + imgs.length) % imgs.length;
      render();
    } else if (dragStartX - dragEndX > 40) {
      imgIdx = (imgIdx + 1) % imgs.length;
      render();
    }
    dragStartX = null;
    document.body.style.userSelect = '';
  });

  const changesList = document.createElement('ul');
  changesList.style.listStyle = 'none';
  changesList.style.padding = '0';
  changesList.style.margin = '0';
  changesList.style.width = '100%';
  changesList.style.textAlign = 'left';
  changesList.style.marginTop = '18px';
  changesList.style.color = '#fff';
  changesList.style.fontSize = '1.18em';
  changesList.style.fontFamily = "'Fredoka', sans-serif";

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.title = 'Close';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '18px';
  closeBtn.style.right = '24px';
  closeBtn.style.background = '#e74c3c';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '8px';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.width = '36px';
  closeBtn.style.height = '36px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.zIndex = '2';

  closeBtn.onclick = () => {
    overlay.remove();
    document.body.appendChild(inputArea);
  };

  function render() {
    title.textContent = newsPages[pageIdx].title;
    if (newsPages[pageIdx].desc && newsPages[pageIdx].desc.trim()) {
      pageDesc.textContent = newsPages[pageIdx].desc;
      pageDesc.style.display = '';
    } else {
      pageDesc.textContent = '';
      pageDesc.style.display = 'none';
    }
    const imgs = newsPages[pageIdx].images;
    img.src = imgs[imgIdx].src;
    changesList.innerHTML = '';
    newsPages[pageIdx].changes.forEach(change => {
      const li = document.createElement('li');
      li.style.marginBottom = change.desc ? '10px' : '6px';
      li.style.display = 'flex';
      li.style.flexDirection = 'column';
      li.style.gap = '2px';

      const main = document.createElement('span');
      main.textContent = '• ' + change.text;
      main.style.fontWeight = '500';
      main.style.fontSize = '1.08em';
      main.style.color = '#fff';

      li.appendChild(main);

      if (change.desc && change.desc.trim()) {
        const desc = document.createElement('span');
        desc.textContent = change.desc;
        desc.style.fontSize = '0.95em';
        desc.style.color = '#aaa';
        desc.style.marginLeft = '18px';
        li.appendChild(desc);
      }
      changesList.appendChild(li);
    });
  }

  rightArrow.onclick = () => {
    pageIdx = (pageIdx - 1 + newsPages.length ) % newsPages.length;
    imgIdx = 0;
    render();
  };
  leftArrow.onclick = () => {
    pageIdx = (pageIdx + 1) % newsPages.length;
    imgIdx = 0;
    render();
  };

  overlay.tabIndex = 0;
  overlay.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') leftArrow.onclick();
    if (e.key === 'ArrowRight') rightArrow.onclick();
    if (e.key === 'Escape') overlay.remove();
  });

  panelContent.appendChild(navRow);
  panelContent.appendChild(pageDesc);
  panelContent.appendChild(imgWrap);
  panelContent.appendChild(changesList);
  panel.appendChild(panelContent);
  panel.appendChild(closeBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  render();
  overlay.focus();
 }

  let lockedTabs = { 'blooket hacks': true || false, 'learning tools' : true};

button.addEventListener('click', () => {
    const val = select.value.toLowerCase();
    if (lockedTabs[val]) {
        if (val === 'learning tools') {
            showPasswordOverlay(() => {
                showInstructionsOverlay('https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/lt.js');
            }, 'tookforeversry');
        } else {
            showPasswordOverlay(() => showInstructionsOverlay());
        }
        return;
    }

if (val === 'themes') {
  showThemePanel();
  return;
}

   if (val === 'schoology utilities') {
   showInstructionsOverlay('https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/bridge.js');
        return;
    }

   if (val === 'inspect element') {
   showInstructionsOverlay('https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/devconsole.js');
        return;
    }

if (val === 'news') {
  showNewsPanel();
  return;
}

    if (val === 'zephware' || val === 'games' || val === 'library') {
        clearThemeEffects();
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        let file;
        if (val === 'zephware') file = 'zephware.js'; 
       else if (val === 'games') file = 'games.js';
       else if (val === 'library') file = 'library.js';
fetch(`https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/${file}`)
            .then(response => response.text())
            .then(scriptContent => {
                const script = document.createElement('script');
                script.innerHTML = scriptContent;
                document.body.appendChild(script);
            })
            .catch(error => {
                console.error(`Failed to load ${file}.`, error);
                alert('Failed, Try Again.');
            });
    }
});

function showPasswordOverlay(onSuccess, customPassword) {
    const old = document.getElementById('overlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.zIndex = '99999';
    overlay.style.fontFamily = "'Fredoka', sans-serif";
   overlay.innerHTML = `
  <div id="overlay-box" style="font-family:'Fredoka',sans-serif;position:relative;">
   <button id="password-x-close" style="
      position:absolute;
      top:12px;
      right:12px;
      background:none;
      border:none;
      font-size:22px;
      cursor:pointer;
      color:#aaa;
      font-family:'Fredoka',sans-serif;
    ">✕</button>

    <h1 style="color:${theme.color1};">Password Required</h1>
    <p>Enter the password to access this section.</p>

    <input id="password-input" type="password" placeholder="Password"
      style="font-size:16px;padding:8px 12px;border-radius:8px;border:1px solid #444;width:80%;margin-bottom:16px;outline:none;font-family:'Fredoka',sans-serif;" />
    <br>

    <button id="password-submit" style="font-family:'Fredoka',sans-serif;">Submit</button>

    <div id="password-error" style="color:#ff5555;margin-top:10px;display:none;">
      Incorrect password.
    </div>
  </div>
`;



    const input = overlay.querySelector('#password-input');
    const submit = overlay.querySelector('#password-submit');
    const error = overlay.querySelector('#password-error');
    input.focus();
    function unlock() {
        const passwordToCheck = customPassword || "back2schoolggs";
        if (input.value === passwordToCheck) {
            overlay.remove();
            onSuccess();
        } else {
            error.style.display = 'block';
            input.value = '';
            input.focus();
        }
    }
    submit.onclick = unlock;
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') unlock();
    });
    document.body.appendChild(overlay);
    document.getElementById('password-x-close').onclick = () => {
  overlay.remove();
};
}

function showInstructionsOverlay(customLink) {
    const old = document.getElementById('overlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.style.zIndex = '99999';
    overlay.style.fontFamily = "'Fredoka', sans-serif";
    overlay.innerHTML = `
      <div id="overlay-box" style="font-family:'Fredoka',sans-serif;">
        <h1 style="color:${theme.color1};">Instructions</h1>
        <ol id="instructions-list" style="text-align:center;margin:0 0 24px 0;padding-left:0;font-size:16px;list-style-position:inside;color:#fff;">
          <li style="margin:8px 0;">Create a bookmark</li>
          <li style="margin:8px 0;">Click the "Copy" button below</li>
          <li style="margin:8px 0;">Press Cmd + C (or Ctrl + C if you are on PC)</li>
          <li style="margin:8px 0;">Set the code as the url for the bookmark</li>
          <li style="margin:8px 0;">Hit save</li>
          <li style="margin:8px 0;">Try it out!</li>
        </ol>
        <div style="display:flex;justify-content:center;gap:12px;align-items:center;">
          <button id="highlight-btn" style="font-family:'Fredoka',sans-serif;min-width:80px;">Copy</button>
          <button id="instructions-close" style="font-family:'Fredoka',sans-serif;min-width:80px;">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    fetch(customLink || 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/blooket/min.js')
        .then(res => res.text())
        .then(code => {
            const pre = document.createElement('pre');
            pre.textContent = code;
            pre.style.position = 'fixed';
            pre.style.opacity = '0';
            pre.style.pointerEvents = 'none';
            pre.style.userSelect = 'text';
            pre.style.zIndex = '-1';
            pre.id = 'invisible-code';
            document.body.appendChild(pre);

            overlay.querySelector('#highlight-btn').onclick = () => {
                const range = document.createRange();
                range.selectNodeContents(pre);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            };
        });

    overlay.querySelector('#instructions-close').onclick = () => {
        overlay.remove();
        const pre = document.getElementById('invisible-code');
        if (pre) pre.remove();
    };
}

function setButtonStatus(status) {
  const gradientOpen = `linear-gradient(to bottom, ${theme.color1}, ${theme.color2})`;
  const gradientWIP  = `linear-gradient(to bottom, #002D62, #001B44)`;

  switch (status.toLowerCase()) {
    case 'wip':
      button.textContent = 'WIP';
      button.disabled = true;
      button.style.background = gradientWIP;
      button.style.cursor = 'not-allowed';
      break;

    case 'locked':
      button.textContent = 'Go';
      button.disabled = false;
      button.style.background = gradientOpen;
      button.style.cursor = 'pointer';
      break;

    case 'open':
    default:
      button.textContent = 'Go';
      button.disabled = false;
      button.style.background = gradientOpen;
      button.style.cursor = 'pointer';
      break;
  }
}



  select.onchange = () => {
    const val = select.value.toLowerCase();
    if (lockedTabs[val]) {
      setButtonStatus('locked');
    } else if (val === 'gimkit hacks' || val === 'marketplace') {
      setButtonStatus('wip');
    } else {
      setButtonStatus('open');
    }
  };

  document.body.appendChild(inputArea);
})();

function createSnowfall() {
  const container = document.createElement("div");
  container.id = "theme-effect";
  document.body.appendChild(container);

  const interval = setInterval(() => {
    const flake = document.createElement("div");
    flake.textContent = "❄";
    flake.style.position = "fixed";
    flake.style.top = "-10px";
    flake.style.left = Math.random() * 100 + "vw";
    flake.style.color = "white";
    flake.style.fontSize = (8 + Math.random() * 20) + "px";
    flake.style.pointerEvents = "none";
    flake.style.zIndex = "0";
    flake.style.transition = "transform 8s linear";

    document.body.appendChild(flake);

    requestAnimationFrame(() => {
      flake.style.transform = `translateY(110vh)`;
    });

    setTimeout(() => flake.remove(), 8000);
  }, 150);

  return {
    cleanup() {
      clearInterval(interval);
      container.remove();
    }
  };
}

function createHeartfall(emoji) {
  const interval = setInterval(() => {
    const heart = document.createElement("div");
    heart.textContent = emoji;
    heart.style.position = "fixed";
    heart.style.top = "-10px";
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.fontSize = (10 + Math.random() * 20) + "px";
    heart.style.pointerEvents = "none";
    heart.style.zIndex = "0";
    heart.style.transition = "transform 7s linear";

    document.body.appendChild(heart);

    requestAnimationFrame(() => {
      heart.style.transform = `translateY(110vh)`;
    });

    setTimeout(() => heart.remove(), 7000);
  }, 120);

  return {
    cleanup() {
      clearInterval(interval);
    }
  };
}

function createJumpScare() {
   const img = document.createElement("img");
   img.src = "https://www.indiatimes.com/thumb/123963169.cms?imgsize=46526&width=616&resizemode=4";
   img.style.position = "fixed";
   img.style.top = "0";
   img.style.left = "0";
   img.style.width = "110vw";
   img.style.height = "100vh";
   img.style.opacity = "0.1";
   img.style.zIndex = "9999";
   img.style.display = "none";
   img.style.pointerEvents = "none";
   document.body.appendChild(img);

   let flickerInterval = null;
   let timeoutId = null;
   let stopped = false;

   function showFlicker() {
      if (stopped) return;

      let flickerCount = 0;
      img.style.display = "block";

      flickerInterval = setInterval(() => {
         img.style.visibility =
           img.style.visibility === "hidden" ? "visible" : "hidden";

         flickerCount++;

         if (flickerCount >= 20) {
            clearInterval(flickerInterval);
            img.style.display = "none";
            img.style.visibility = "visible";

            if (!stopped) {
              timeoutId = setTimeout(showFlicker, Math.random() * 10000 + 5000);
            }
         }
      }, 150);
   }

   timeoutId = setTimeout(showFlicker, Math.random() * 10000 + 5000);

   return {
     cleanup() {
       stopped = true;
       clearInterval(flickerInterval);
       clearTimeout(timeoutId);
       img.remove();
     }
   };
}

(function() {
  const style = document.createElement('style');
  style.textContent = `
    body, #overlay, #overlay *, .header, .description, .input-area, .input-area *, .content, .label-text, select, button {
      font-family: 'Fredoka', sans-serif !important;
    }
    #overlay {
      z-index: 99999 !important;
      font-family: 'Fredoka', sans-serif !important;
    }
    #overlay-box {
      font-family: 'Fredoka', sans-serif !important;
    }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; }
  `;
  document.head.appendChild(style);
})();
} else {alert('This bookmarklet only works on google.com, this is for data saving purposes and for keeping the data in 1 place.');}})();
