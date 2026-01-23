javascript:(function(){

  if (!document.getElementById('fredoka-font-link')) {
    const link = document.createElement('link');
    link.id = 'fredoka-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fredoka&display=swap';
    document.head.appendChild(link);
}

(function() {
  const style = document.createElement('style');
  style.textContent = `
    body, #zw-overlay, #zw-overlay *, .header, .description, .input-area, .input-area *, .content, .label-text, select, button {
      font-family: 'Fredoka', sans-serif !important;
    }
    #zw-overlay {
      z-index: 99999 !important;
      font-family: 'Fredoka', sans-serif !important;
    }
    #zw-overlay-box {
      font-family: 'Fredoka', sans-serif !important;
    }
    .zw-hide-scrollbar::-webkit-scrollbar { display: none; }
    .zw-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(style);
})();

const style = document.createElement('style');
style.textContent = `
#zw-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 3;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #zw-overlay-box {
      background: rgba(17, 17, 17, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      max-width: 520px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      text-align: center;
    } 
    #zw-overlay-box h1 {
      font-size: 24px;
      color: #01AEFD;
      margin-bottom: 16px;
    }
    #zw-overlay-box p {
      color: white;
      margin-bottom: 24px;
    }
    #zw-overlay-box button {
      font-size: 16px;
      font-family: 'Fredoka', sans-serif;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      background-color: #01AEFD;
      color: white;
      cursor: pointer;
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
      user-select: none;
      white-space: nowrap;
    }

    .input-area select {
      font-family: 'Fredoka', sans-serif;
      font-size: 1.2em;
      font-weight: 500;
      color: #01AEFD;
      padding: 0.3em 0.6em;
      border: none;
      border-radius: 5px;
      outline: none;
      background-color:rgb(42, 42, 42);
      cursor: pointer;
      width: 180px;
    }

    .input-area button {
      font-family: 'Fredoka', sans-serif;
      font-size: 1.2em;
      padding: 0.4em 1em;
      border: none;
      border-radius: 5px;
      background: linear-gradient(to bottom, #01AEFD, #015AFD);
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: none;
    }
`;

function parseNumberSafe(str) {
    if (!str) return NaN;
    str = removeCommas(str.trim());
    const num = Number(str);
    return isNaN(num) ? NaN : num;
}

const SESSION_EXPIRE = new Date('2026-01-31T14:00:00-04:00');

function isSessionActive() {
    const now = new Date();
    const estOffset = -4 * 60;
    const nowEST = new Date(now.getTime() + (now.getTimezoneOffset() + estOffset) * 60000);
    return nowEST < SESSION_EXPIRE;
}

if (!isSessionActive()) {
    alert("Session Expired.");
    return;
}

function createUI() {
    if (document.getElementById('main-ui')) return;
    const panel = document.createElement('div');
    panel.id = 'main-ui';
    panel.style.position = 'fixed';
    panel.style.width = '260px';
    panel.style.background = 'rgba(30,30,30,0.95)';
    panel.style.color = '#fff';
    panel.style.border = '1px solid #888';
    panel.style.borderRadius = '8px';
    panel.style.zIndex = 9999;
    panel.style.fontSize = '13px';
    panel.style.padding = '10px';
    panel.style.boxShadow = '0 2px 8px #0006';
    panel.style.cursor = 'move';
    panel.style.userSelect = 'none';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '8px';

    let offsetX, offsetY, dragging = false;
    panel.addEventListener('mousedown', function(e) {
        if (e.target !== panel && e.target.tagName !== 'H1') return;
        dragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        panel.style.transition = 'none';
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function(e) {
        if (!dragging) return;
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
        panel.style.right = '';
    });
    document.addEventListener('mouseup', function(e) {
        if (!dragging) return;
        dragging = false;
        panel.style.transition = '';
        document.body.style.userSelect = '';
    });
    panel.addEventListener('touchstart', function(e) {
        if (e.target !== panel && e.target.tagName !== 'H1') return;
        dragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - panel.getBoundingClientRect().left;
        offsetY = touch.clientY - panel.getBoundingClientRect().top;
        panel.style.transition = 'none';
    }, {passive: false});
    document.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        const touch = e.touches[0];
        panel.style.left = (touch.clientX - offsetX) + 'px';
        panel.style.top = (touch.clientY - offsetY) + 'px';
        panel.style.right = '';
        e.preventDefault();
    }, {passive: false});
    document.addEventListener('touchend', function(e) {
        if (!dragging) return;
        dragging = false;
        panel.style.transition = '';
    });

    const header = document.createElement('h1');
    header.textContent = 'Hyperware';
    header.style.color = '#63fd01';
    header.style.fontSize = '1.2em';
    header.style.margin = '0 0 6px 0';
    header.style.textAlign = 'center';
    panel.appendChild(header);

    const divider = document.createElement('hr');
    divider.style.border = '0';
    divider.style.borderTop = '2px solid #25fd01';
    divider.style.borderRadius = '4px';
    divider.style.margin = '-7.5px 0 10px 0';
    divider.style.width = '90%';
    divider.style.alignSelf = 'center';
    panel.appendChild(divider);

    const timerDiv = document.createElement('div');
    timerDiv.id = 'session-timer';
    timerDiv.style.fontSize = '1em';
    timerDiv.style.color = '#63fd01';
    timerDiv.style.margin = '6px 0 0 0';
    timerDiv.style.textAlign = 'center';
    timerDiv.style.marginTop = '-10px';
    panel.appendChild(timerDiv);

    const supportText = document.createElement('a');
    supportText.style.fontSize = '1em';
    supportText.style.color = '#63fd01';
    supportText.style.margin = '6px 0 0 0';
    supportText.style.textAlign = 'center';
    supportText.style.marginTop = '-5px';
    supportText.style.display = 'block';
    supportText.style.textDecoration = 'underline';
    supportText.textContent = 'Broken Question? Report Here';
    supportText.href = 'https://docs.google.com/forms/d/e/1FAIpQLSebPRbGU9Xgt9oq38DZVBNt5UzIy1MhooTTMB7QZdLKz7wFrw/viewform';
    supportText.target = '_blank';
    panel.appendChild(supportText);

    const answerArea = document.createElement('div');
    answerArea.id = 'answer-area';
    answerArea.style.fontSize = '1.1em';
    answerArea.style.color = '#fff';
    answerArea.style.margin = '10px 0 0 0';
    answerArea.style.textAlign = 'center';
    answerArea.style.minHeight = '32px';
    panel.appendChild(answerArea);

    const msgTableWrap = document.createElement('div');
    msgTableWrap.style.marginTop = '8px';
    msgTableWrap.style.display = 'none';
    msgTableWrap.style.background = '#222';
    msgTableWrap.style.borderRadius = '6px';
    msgTableWrap.style.padding = '8px';
    msgTableWrap.style.fontSize = '0.95em';
    msgTableWrap.style.color = '#01AEFD';
    msgTableWrap.style.textAlign = 'left';
    msgTableWrap.innerHTML = '<b>Possible messages:</b><ul id="msg-table" style="margin:0;padding-left:18px;"></ul>';
    panel.appendChild(msgTableWrap);

    const btn = document.createElement('button');
    btn.id = 'auto-answer-btn';
    btn.textContent = 'Answer Question';
    btn.style.fontSize = '16px';
    btn.style.fontFamily = "'Fredoka',sans-serif";
    btn.style.padding = '10px 20px';
    btn.style.border = 'none';
    btn.style.borderRadius = '10px';
    btn.style.backgroundColor = '#25fd01';
    btn.style.color = 'white';
    btn.style.cursor = 'pointer';
    btn.style.marginTop = '10px';
    btn.style.width = '100%';
    btn.style.position = 'relative';
    panel.appendChild(btn);
    document.body.appendChild(panel);

    const progressBar = document.createElement('div');
    progressBar.style.position = 'absolute';
    progressBar.style.left = '0';
    progressBar.style.top = '0';
    progressBar.style.height = '100%';
    progressBar.style.width = '0%';
    progressBar.style.background = 'rgba(80,80,80,0.7)';
    progressBar.style.borderRadius = '10px';
    progressBar.style.transition = 'width 0.2s';
    progressBar.style.pointerEvents = 'none';
    btn.appendChild(progressBar);

    const messages = [
        'yo gng try {answer}',
        '{answer} is prolly it',
        '{answer} is so tuff',
        'ayo bro i gotchu the answer is {answer}!',
        'idk try {answer}',
        'here you go brochacho {answer}',
        'just use {answer}',
        'too easy, use {answer}',
        'found the answer, its {answer}',
        'woah, the answer is {answer}',
        'IXL says {answer}',
        'only {answer} more days till the update',
        'i’ve probably typed like {answer} amount of there’s rn',
        'i will be getting bullied for {answer} amount of messages',
        'i played roblox {answer} times',
        'vro the answer is {answer}',
        'WAY too easy, use {answer}',
        'i’m too hyper, use {answer}',
        'hyperware says {answer}',
        'session refreshing in {answer} minutes',
        'vro its not too hard to type {answer}',
        'gng the answer is {answer}, how do we not know this',
        'bro ITS LITERALLY {answer}',
        "lock in bro, a first grader could tell you it's {answer}",
        'the next update is in {answer} days',
        'twin do {answer}',
        'am i smart bro its {answer} im smart right',
        'im sentient atp ykyk like im telling you answers left and right like {answer}',
        'the answer is {answer}, trust me bro',
        'i just asked my dog and he said {answer}',
        'the guy behind you told me its {answer}',
        'i dreamt it was {answer}',
        'chat its {answer}',
        'i saw it in a vision bro its {answer}',
        '{answer} was the grade i got on my last test',
        'yoo {answer} is the same number as my fortune cookie',
        'try {answer} in the lottery you might win',
        "ts so peak bro here's the answer {answer}",
        'lowk had a lot of fun typing these messages, {answer} btw',
        "they don't want you to know but the answer is {answer}",
        'bully learns the truth about the number {answer}, what happens next will shock you!!'
    ];
    const msgTable = msgTableWrap.querySelector('#msg-table');
    messages.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = msg.replace('{answer}', '[answer]');
        msgTable.appendChild(li);
    });

    let cooldown = false;
    btn.onclick = function() {
        if (cooldown) return;
        cooldown = true;
        btn.style.cursor = 'not-allowed';
        btn.disabled = true;
        progressBar.style.width = '0%';
        let progress = 0;
        let interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = progress + '%';
            if (progress >= 100) {
                clearInterval(interval);
                btn.style.cursor = 'pointer';
                btn.disabled = false;
                progressBar.style.width = '0%';
                cooldown = false;
            }
        }, 100);
        setTimeout(() => {
            const answer = answerQuestions();
            const msg = messages[Math.floor(Math.random() * messages.length)].replace('{answer}', answer);
            answerArea.textContent = msg;
        }, 500);
    };
}

if (!document.getElementById('main-ui')) {
    createUI();
}

function SessionTimer() {
    function updateTimer() {
        let timerDiv = document.getElementById('session-timer');
        const now = new Date();
        const estOffset = -4 * 60;
        const nowEST = new Date(now.getTime() + (now.getTimezoneOffset() + estOffset) * 60000);
        const diff = SESSION_EXPIRE - nowEST;
        if (diff <= 0) {
            timerDiv.textContent = "Session Expired.";
            if (!isSessionActive()) {
            alert("Session Expired. Go to Hyperware for Current Session.");
            return;
            }
        } else {
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            timerDiv.textContent = `Session Expiring In: ${hours}h ${mins}m ${secs}s`;
        }
    }
    updateTimer();
    setInterval(updateTimer, 1000);
}
SessionTimer();

function addFractions(fractions) {
    let commonDen = fractions.reduce((a, b) => a * b[1], 1);
    let numerators = fractions.map(([num, den]) => num * (commonDen / den));
    let sumNum = numerators.reduce((a, b) => a + b, 0);
    return `${sumNum}/${commonDen}`;
}

function findProblems() {
    const equations = [];
    document.querySelectorAll('.secContentPiece.section').forEach(section => {
        const bundles = section.querySelectorAll('.bundle');
        if (bundles.length >= 2) {
            let fractions = [];
            let foundPlus = false;
            bundles.forEach(bundle => {
                const frac = bundle.querySelector('.expression.vFrac');
                if (frac) {
                    let num = parseInt(frac.querySelector('.numerator .expression.number')?.innerText || '0', 10);
                    let den = parseInt(frac.querySelector('.denominator .expression.number')?.innerText || '1', 10);
                    fractions.push([num, den]);
                }
                const plus = bundle.querySelector('.plusSymbolContainer');
                if (plus) foundPlus = true;
            });
            if (fractions.length >= 2 && foundPlus) {
                equations.push({ equation: fractions });
            }
        }
    });
    return equations;
}

function answerQuestions() {
    let answer = processBasicHorizontal();
    processHorizontalBinary();
    processSimpleHorizontalEquations();
    processLongDivision();
    processFractionEquations();
    processVertArith();
    processHorizontalBinary();
    processSolveArith();

    if (answer && answer !== 'idk') return answer;
    answer = processSimpleHorizontalEquations();
    if (answer && answer !== 'idk') return answer;
    answer = processLongDivision();
    if (answer && answer !== 'idk') return answer;
    answer = processFractionEquations();
    if (answer && answer !== 'idk') return answer;
    answer = processVertArith();
    if (answer && answer !== 'idk') return answer;
    answer = processHorizontalBinary();
    if (answer && answer !== 'idk') return answer;
    answer = processSolveArith();
    if (answer && answer !== 'idk') return answer;

    const problems = findProblems();
    problems.forEach(({el, equation}) => {
        if (Array.isArray(equation)) {
            el.value = addFractions(equation);
        }
    });

    document.querySelectorAll('.old-space-indent').forEach(div => {
        const tables = div.querySelectorAll('table');
        if (tables.length === 0) return;
        const table = tables[0];
        const tds = table.querySelectorAll('td[align="right"]');
        if (tds.length < 2) return;
        let num1str = '';
        let num2str = '';
        let operator = null;
        let foundFirst = false;
        let foundOperator = false;
        tds.forEach(td => {
            const txt = td.textContent.trim();
            if (!foundFirst && txt && !isNaN(txt)) {
                num1str = txt;
                foundFirst = true;
            } else if (foundFirst && !foundOperator && (txt.includes('+') || txt.includes('-') || txt.includes('×') || txt.includes('÷') || txt.includes('/'))) {
                if (txt.includes('+')) operator = '+';
                else if (txt.includes('-')) operator = '-';
                else if (txt.includes('×')) operator = '*';
                else if (txt.includes('÷') || txt.includes('/')) operator = '/';
                foundOperator = true;
            } else if (foundFirst && foundOperator && txt && !isNaN(txt)) {
                num2str = txt;
            }
        });
        if (num1str && num2str && operator) {
            let num1 = parseNumberSafe(num1str);
            let num2 = parseNumberSafe(num2str);
            let result;
            switch (operator) {
                case '*': result = num1 * num2; break;
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '/': result = num2 !== 0 ? num1 / num2 : ''; break;
                default: result = '';
            }
            const dec1 = countDecimals(num1str);
            const dec2 = countDecimals(num2str);
            const leastDecimals = Math.max(dec1, dec2, 2);
            if (typeof result === 'number' && !isNaN(result)) {
                result = cleanResult(result, leastDecimals);
            }
            answer = result;
        }
        return answer;
    });
    return 'idk';
}

function getOperandValue(bundle) {
    const expDiv = bundle.querySelector('.expression.wholeExp');
    if (expDiv) {
        const baseSpan = expDiv.querySelector('.expression.base .expression.number');
        const expSpan = expDiv.querySelector('.expression.exponent .expression.number');
        if (baseSpan && expSpan) {
            const base = parseNumberSafe(baseSpan.textContent.trim());
            const exp = parseNumberSafe(expSpan.textContent.trim());
            return Math.pow(base, exp);
        }
    }
    const numSpan = bundle.querySelector('.expression.number');
    if (numSpan) return parseNumberSafe(numSpan.textContent.trim());
    return NaN;
}

function removeCommas(numStr) {
    if (typeof numStr !== "string") numStr = String(numStr);
    return numStr.replace(/,/g, '');
}

function countDecimals(numStr) {
    if (typeof numStr !== "string") numStr = String(numStr);
    if (numStr.includes('.')) {
        return numStr.split('.')[1].length;
    }
    return 0;
}

function cleanResult(num, decimals) {
    if (typeof num === "number") num = num.toString();
    if (num.includes('e')) return Number(num).toPrecision(decimals + 1).replace(/\.?0+$/, '');
    let n = Number(num);
    if (isNaN(n)) return '';
    if (Number.isInteger(n)) return n.toString();
    let str = n.toFixed(decimals !== undefined ? decimals : 10);
    str = str.replace(/(\.\d*?[1-9])0+$/g, '$1').replace(/\.0+$/, '');
    if (/\.\d{3,}/.test(str)) str = n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return str;
}

function processHorizontalBinary() {
    answer = 'idk';
    document.querySelectorAll('.math.section').forEach(section => {
        const bundles = section.querySelectorAll('.bundle');
        if (bundles.length === 3) {
            let num1 = getOperandValue(bundles[0]);
            let num2 = getOperandValue(bundles[1]);
            let operator = null;
            if (bundles[0].querySelector('.minusSymbolContainer')) operator = '-';
            else if (bundles[0].querySelector('.plusSymbolContainer')) operator = '+';
            else if (bundles[0].querySelector('.xSymbolContainer')) operator = '*';
            else if (bundles[0].querySelector('.divideSymbolContainer')) operator = '/';
            if (!operator) {
                if (bundles[1].querySelector('.minusSymbolContainer')) operator = '-';
                else if (bundles[1].querySelector('.plusSymbolContainer')) operator = '+';
                else if (bundles[1].querySelector('.xSymbolContainer')) operator = '*';
                else if (bundles[1].querySelector('.divideSymbolContainer')) operator = '/';
            }
            if (!operator) {
                const opText = bundles[0].textContent + bundles[1].textContent;
                if (opText.includes('-') || opText.includes('–')) operator = '-';
                else if (opText.includes('+')) operator = '+';
                else if (opText.includes('×') || opText.includes('x')) operator = '*';
                else if (opText.includes('÷') || opText.includes('/')) operator = '/';
            }
            if (!isNaN(num1) && !isNaN(num2) && operator) {
                let result;
                switch (operator) {
                    case '+': result = num1 + num2; break;
                    case '-': result = num1 - num2; break;
                    case '*': result = num1 * num2; break;
                    case '/': result = num2 !== 0 ? num1 / num2 : ''; break;
                    default: result = '';
                }
                const dec1 = countDecimals(String(num1));
                const dec2 = countDecimals(String(num2));
                const leastDecimals = Math.max(dec1, dec2, 2);
                if (typeof result === 'number' && !isNaN(result)) {
                    result = cleanResult(result, leastDecimals);
                }
                answer = result;
            }
        }
    });
    return answer;
}
function processSolveArith() {
   answer = 'idk';
   const tds = Array.from(document.querySelectorAll("td[align='right']"));

   const nums = [];
   let operator = null;

   for (const td of tds) {
      const text = td.textContent.trim();

      if (!text) continue;

      if (/^[\d,]+$/.test(text)) {
         const val = parseNumberSafe(text);
         if (!isNaN(val)) nums.push(val);
      } else if (/[+\-×÷]/.test(text)) {
         operator = text.replace(/\s/g, "");
      }
   }

   if (nums.length >= 2 && operator) {
      let result;

      switch (operator) {
         case "+":
            result = nums[0] + nums[1];
            break;
         case "−":
         case "-":
            result = nums[0] - nums[1];
            break;
         case "×":
         case "x":
            result = nums[0] * nums[1];
            break;
         case "÷":
         case "/":
            result = nums[0] / nums[1];
            break;
      }

      if (result !== undefined) {
        answer = result;
      }
   }
   return answer;
}
function processBasicHorizontal() {
    let answer = '';
    document.querySelectorAll('.old-space-indent').forEach(div => {
        let text = div.textContent.replace(/,/g, '').trim();
        let match = text.match(/(\d+)\s*([+\-×x÷/])\s*(\d+)\s*=/);
        if (match) {
            let num1 = parseFloat(match[1]);
            let op = match[2];
            let num2 = parseFloat(match[3]);
            let result;
            switch (op) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '×':
                case 'x': result = num1 * num2; break;
                case '÷':
                case '/': result = num2 !== 0 ? num1 / num2 : ''; break;
                default: result = '';
            }
            if (typeof result === 'number' && !isNaN(result)) {
                result = cleanResult(result, 2);
            }
            answer = result;
        }
    });
    return answer;
}

function processSimpleHorizontalEquations() {
    answer = 'idk';
   document.querySelectorAll('div.old-space-indent').forEach(div => {
      let text = '';
      div.childNodes.forEach(node => {
         if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
         if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
            const sup = node.querySelector('sup.negative.old-negative-sign');
            if (sup) {
               text += '-';
               const num = node.textContent.replace(/[–-]/g, '').replace(/^\s*-?/, '').trim();
               text += num;
            } else {
               text += node.textContent;
            }
         }
         if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SUP' && node.classList.contains('negative') && node.classList.contains('old-negative-sign')) {
            text += '-';
         }
      });

      text = text.replace(/–/g, '-').replace(/−/g, '-').replace(/\u2212/g, '-').replace(/\s+/g, ' ').trim();

      const match = text.match(/^(.*?)=\s*$/);
      if (match) {
         let expr = match[1].trim();

         expr = expr.replace(/×|x/g, '*').replace(/÷/g, '/');

         let result;
         try {
            result = Function('"use strict";return (' + expr + ')')();
         } catch (e) {
            result = '';
         }

         if (typeof result === 'number' && !isNaN(result)) {
            let numbers = expr.match(/-?\d+(\.\d+)?/g) || [];
            let maxDecimals = Math.max(...numbers.map(n => countDecimals(n)), 2);
            result = cleanResult(result, maxDecimals);
         }
         answer = result;
      }
   });
   return answer;
}
function processLongDivision() {
    answer = 'idk';
    document.querySelectorAll('div.old-long-division').forEach(div => {
      const divisorEl = div.querySelector('.old-long-division-divisor');
      const dividendEl = div.querySelector('.old-long-division-bar td[align="left"]');
      if (divisorEl && dividendEl) {
         let divisor = parseNumberSafe(divisorEl.textContent.replace(/–/g, '-').trim());
         let dividend = parseNumberSafe(dividendEl.textContent.replace(/–/g, '-').trim());
         if (!isNaN(divisor) && !isNaN(dividend) && divisor !== 0) {
            let result = dividend / divisor;

            let dec1 = countDecimals(String(dividend));
            let dec2 = countDecimals(String(divisor));
            let leastDecimals = Math.max(dec1, dec2, 2);

            result = cleanResult(result, leastDecimals);

            answer = result;
         }
      }
   });
   return answer;
}
function processFractionEquations() {
    answer = 'idk';
   function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
   }
   function lcm(a, b) {
      return (a * b) / gcd(a, b);
   }
   function parseFraction(td) {
      const numEl = td.querySelector('.old-fraction:not(.old-fraction-bar) .old-expression');
      const denEl = td.querySelector('.old-fraction-bar .old-expression');
      if (numEl && denEl) {
         const numerator = parseNumberSafe(numEl.textContent.trim());
         const denominator = parseNumberSafe(denEl.textContent.trim());
         if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            return { numerator, denominator };
         }
      }
      return null;
   }
   document.querySelectorAll('.old-space-indent').forEach(div => {
      const tds = div.querySelectorAll('td');
      let whole = null;
      let fractions = [];
      let operator = null;
      tds.forEach(td => {
         if (!whole && /^\d+$/.test(td.textContent.trim())) {
            whole = parseInt(td.textContent.trim(), 10);
         }
         if (td.textContent.includes('×') || td.textContent.includes('x')) {
            operator = '*';
         } else if (td.textContent.includes('–') || td.textContent.includes('-')) {
            operator = '-';
         } else if (td.textContent.includes('+')) {
            operator = '+';
         } else if (td.textContent.includes('÷') || td.textContent.includes('/')) {
            operator = '/';
         }
         const frac = parseFraction(td);
         if (frac) {
            fractions.push(frac);
         }
      });
      let result = '';
      if (fractions.length === 2 && operator) {
         let a = fractions[0], b = fractions[1];
         if (operator === '+') {
            let commonDen = lcm(a.denominator, b.denominator);
            let n1 = a.numerator * (commonDen / a.denominator);
            let n2 = b.numerator * (commonDen / b.denominator);
            result = `${n1 + n2}/${commonDen}`;
         } else if (operator === '-') {
            let commonDen = lcm(a.denominator, b.denominator);
            let n1 = a.numerator * (commonDen / a.denominator);
            let n2 = b.numerator * (commonDen / b.denominator);
            result = `${n1 - n2}/${commonDen}`;
         } else if (operator === '*') {
            result = `${a.numerator * b.numerator}/${a.denominator * b.denominator}`;
         } else if (operator === '/') {
            result = `${a.numerator * b.denominator}/${a.denominator * b.numerator}`;
         }
      } else if (fractions.length === 1 && whole !== null && operator === '*') {
         let a = fractions[0];
         let num = whole * a.numerator;
         let den = a.denominator;
         let intPart = Math.floor(num / den);
         let rem = num % den;
         result = rem === 0 ? `${intPart}` : (intPart > 0 ? `${intPart} ${rem}/${den}` : `${num}/${den}`);
      } else if (fractions.length === 1 && whole !== null && operator === '/') {
         let a = fractions[0];
         result = `${a.numerator}/${a.denominator * whole}`;
      }
      answer = result;
   });
   return answer;
}

function processVertArith() {
    answer = 'idk';
     document.querySelectorAll('.math.section').forEach(section => {
        const vertArith = section.querySelector('.vertArith');
        if (vertArith) {
            const rows = vertArith.querySelectorAll('.vertArithRow');
            if (rows.length < 2) return;
            let num1str = '';
            rows[0].querySelectorAll('.expression.number, .txt').forEach(cell => {
                num1str += cell.textContent.trim();
            });
            let num2str = '';
            rows[1].querySelectorAll('.expression.number, .txt').forEach(cell => {
                num2str += cell.textContent.trim();
            });
            let num1 = parseNumberSafe(num1str);
            let num2 = parseNumberSafe(num2str);
            let operator = null;
            if (rows[1].querySelector('.xSymbol')) operator = '*';
            else if (rows[1].textContent.includes('+')) operator = '+';
            else if (rows[1].textContent.includes('-') || rows[1].textContent.includes('–')) operator = '-';
            else if (rows[1].textContent.includes('÷') || rows[1].textContent.includes('/')) operator = '/';
            let result;
            switch (operator) {
                case '*': result = num1 * num2; break;
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '/': result = num2 !== 0 ? num1 / num2 : ''; break;
                default: result = '';
            }
            const dec1 = countDecimals(num1str);
            const dec2 = countDecimals(num2str);
            const leastDecimals = Math.max(dec1, dec2, 2);
            if (typeof result === 'number' && !isNaN(result)) {
                result = cleanResult(result, leastDecimals);
            }
            answer = result;
        }
    });
    return answer;
}
})();
