javascript:(function(){

const firebaseConfig = {
  apiKey: "AIzaSyBM8PsYtRud5ZKI7MdQxJeOYTQ2YLBMA0M",
  authDomain: "zephware-messages.firebaseapp.com",
  databaseURL: "https://zephware-messages-default-rtdb.firebaseio.com",
  projectId: "zephware-messages",
  storageBucket: "zephware-messages.firebasestorage.app",
  messagingSenderId: "649260131467",
  appId: "1:649260131467:web:7447ca7512a6ab3a81a08e",
  measurementId: "G-HRF3TYZT57"
};

let firebaseLoaded = false;
function loadFirebase(cb){
   if(firebaseLoaded) return cb();
   let s1=document.createElement('script');
   let s2=document.createElement('script');
   s1.src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
   s2.src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
   document.head.appendChild(s1);
   document.head.appendChild(s2);
   s2.onload=function(){
      firebase.initializeApp(firebaseConfig);
      firebaseLoaded=true;
      cb();
   };
}

let sheet = document.createElement('style');
sheet.textContent = `
   #zwb-msg-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      margin-top: 10px;
      margin-left: 15px;
   }
   #zwb-send {
      font-size: 1.2em;
      padding: 0.3em 4em;
      border: none;
      border-radius: 5px;
      background: #005da1;
      color: white;
      font-weight: bold;
   }
   #zwb-choose-btn {
      font-size: 1.2em;
      padding: 0.3em 2.5em;
      border-radius: 5px;
      background: #91cceb;
      color: white;
      font-weight: bold;
   }
   #zwb-clear {
      font-size: 1.2em;
      padding: 0.3em 4em;
      border: none;
      border: 1px solid #d4d4d4ff;
      border-radius: 5px;
      background: #fff;
      color: #005da1;
      font-weight: bold;
   }
   #zwb-textarea {
      border-radius: 5px;
   }
`;
document.head.appendChild(sheet);

function startMessagingSystem(){
   const STORAGE_PREFIX = 'zeph_msg_history_';
   const ROOM_KEY = 'zeph_msg_room';
   const DEFAULT_ROOM = 'Main';

   const MAX_MESSAGES_TO_KEEP = 200;
   const MAX_DAYS_TO_KEEP = 10;
   const MAX_PER_DAY_THRESHOLD = 2000;

   const db = firebase.database();

   const nav = document.querySelector(".sgy-tabbed-navigation");
   if(!nav) return alert('Make sure you are on Schoology (Recent Activity page).');
   if(!document.getElementById('msgs-tab')){
      const li = document.createElement("li");
      li.id = "msgs-tab";
      const a = document.createElement("a");
      a.href = "javascript:void(0)";
      a.textContent = "Messages";
      li.appendChild(a);
      nav.appendChild(li);

      const tabs = document.querySelectorAll('.sgy-tabbed-navigation > li');
      li.onclick = () => {
         li.classList.add('active');
         li.setAttribute('aria-current','true');
         tabs.forEach(tab=>{
            if(tab.id !== "msgs-tab"){
               tab.classList.remove('active');
               tab.setAttribute('aria-current','false');
            }
         });
         activateMessagesTab();
      };
   }

   function activateMessagesTab(){
      const container = document.getElementById('home-feed-container');
      if(!container) return alert('Run on Schoology Recent Activity page.');
      container.innerHTML = '';
      initMessagingUI(container);
   }

   function initMessagingUI(container){
      const user = detectUser();
      let room = localStorage.getItem(ROOM_KEY) || DEFAULT_ROOM;
      let pendingFiles = [];
      let feedEl = null;
      let scrollContainer = null;
      let unsubscribe = null;

      const style = document.createElement('style');
      style.textContent = `
#zwb-file-preview img{max-width:60px;max-height:60px;border-radius:4px;margin-right:6px;cursor:pointer}
      `;
      document.head.appendChild(style);

      renderUI();
      startListener();
      refreshMessages();
      autoScrollToBottom();
      autoTrimServer();
      dailySafetyCron();

      function renderUI(){
         container.innerHTML = `
            <div id="edge-filters" class="sEdgeFilterProcessed">
            <label style="font-size:12px;color:#555;margin-right:8px">Name Format:</label>
            <select id="zwb-name-format">
            <option>First Last</option>
            <option>First L.</option>
            <option>F. Last</option>
            <option>Last</option>
            <option>First</option>
            </select>
            </div>
            <h2>Messages</h2>
            <div id="smart-box" class="sHome-processed">
               <div class="smart-box">
                 <div class="smart-box-mid">
                   <div class="create-type">Room:</div>
                   <span id="room-name" style="margin-left:auto;font-size:12px;color:#555;cursor:pointer;">
                     ${escapeHtml(room)}
                   </span>
                   <div id="smart-box-messages"></div>
                   <div id="smart-box-content">
                     <div id="smart-box-tab-content-0" class="smart-box-tab-content"></div>
                   </div>
                 </div>
               </div>
            </div>
            <div class="feed" id="zwb-feed-wrap" style="max-height:520px;overflow:auto;">
               <div class="item-list">
                 <ul class="s-edge-feed" id="zwb-msg-feed"></ul>
               </div>
            </div>
            <div style="margin-top:10px; display:flex; flex-direction:column;">
               <div style="display:flex; gap:8px; align-items:flex-start;">
                 <div style="flex:1;">
                   <textarea id="zwb-textarea" placeholder="Write a message..." style="width:100%;margin-top:10px;min-height:77.5px;"></textarea>
                   <div id="zwb-file-preview" style="margin-top:6px; font-size:12px;color:#333;"></div>
                 </div>
                 <div style="display:flex; flex-direction:column; gap:6px;">
                   <div id="zwb-msg-actions">
                     <button id="zwb-send" class="sgy-button">Send</button>
                     <label for="zwb-img-upload-hidden" id="zwb-choose-btn" class="sgy-button" style="cursor:pointer;">Choose File</label>
                     <button id="zwb-clear" class="sgy-button" title="Clear chat (local)">Clear</button>
                   </div>
                   <input type="file" id="zwb-img-upload-hidden" accept="image/*" multiple style="display:none;">
                 </div>
               </div>
            </div>
         `;
         document.getElementById('room-name').onclick = () => {
            if(feedEl) feedEl.innerHTML = '';
            localStorage.removeItem(STORAGE_PREFIX + room);

            const r = prompt("Enter room name:", room);
            if(!r) return;

            room = r;
            localStorage.setItem(ROOM_KEY, r);
            document.getElementById('room-name').textContent = 'Room: ' + r;

            if(unsubscribe) unsubscribe();
            startListener();
            refreshMessages();
            setTimeout(() => autoScrollToBottom(true), 200);
         };

         document.getElementById('zwb-send').onclick = sendMessage;
         document.getElementById('zwb-img-upload-hidden').onchange = handleFileSelect;
         document.getElementById('zwb-clear').onclick = clearChat;

         const ta = document.getElementById('zwb-textarea');
         ta.addEventListener('keydown', function(e){
            if(e.key === 'Enter' && !e.shiftKey){
               e.preventDefault();
               sendMessage();
            }
         });

         feedEl = document.getElementById('zwb-msg-feed');
         scrollContainer = document.getElementById('zwb-feed-wrap') || feedEl.parentElement;
      }

      async function handleFileSelect(e){
         const files = Array.from(e.target.files || []);
         if(!files.length) return;
         pendingFiles = pendingFiles.concat(files);
         updateFilePreview();
         e.target.value = '';
      }
      function updateFilePreview(){
         const preview = document.getElementById('zwb-file-preview');
         preview.innerHTML = '';
         if(!pendingFiles.length) return;
         const info = document.createElement('div');
         info.textContent = `${pendingFiles.length} file(s) attached`;
         preview.appendChild(info);
         const thumbs = document.createElement('div');
         thumbs.style.marginTop = '6px';
         thumbs.style.display = 'flex';
         thumbs.style.alignItems = 'center';
         pendingFiles.slice(0,8).forEach((f, idx)=>{
            const img = document.createElement('img');
            const url = URL.createObjectURL(f);
            img.src = url;
            img.dataset.url = url;
            img.dataset.idx = idx;
            img.title = 'Click to remove';
            img.onclick = function(){
               const i = parseInt(this.dataset.idx,10);
               const removed = pendingFiles.splice(i,1);
               try{ URL.revokeObjectURL(this.dataset.url); }catch(e){}
               updateFilePreview();
            };
            thumbs.appendChild(img);
         });
         preview.appendChild(thumbs);
      }
      function processFilesToDataURLs(files){
         return Promise.all(files.map(f=>{
            return new Promise((res, rej)=>{
               const r = new FileReader();
               r.onload = ()=>res(r.result);
               r.onerror = ()=>rej();
               r.readAsDataURL(f);
            });
         }));
      }

      function autoScrollToBottom(force){
         if(!scrollContainer) return;

         const threshold = 80;
         const distanceFromBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;

         if(force || distanceFromBottom < threshold){
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
         }
      }

      function uid(){ return 'm_' + Math.random().toString(36).slice(2,9); }
      function nowISO(){ return (new Date()).toISOString(); }
      function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

      function autoTrimServer(){
         const oneDayAgo = Date.now() - 86400000;
         
         db.ref("rooms/"+room+"/messages").once("value",snapshot=>{
            const msgs = snapshot.val() || {};
            let deletions = {};
            
            for(const id in msgs){
               const ts = Date.parse(msgs[id].ts);
               if(isNaN(ts) || ts < oneDayAgo){
                  deletions[id] = null;
               }
            }
            
            if(Object.keys(deletions).length){
               console.log(`Deleting ${Object.keys(deletions).length} old messages from server`);
               db.ref("rooms/"+room+"/messages").update(deletions);
            }
         });
      }

      function cleanLocalStorage(){
         try{
            const key = STORAGE_PREFIX + room;
            const raw = localStorage.getItem(key);
            if(!raw) return;
            
            const arr = JSON.parse(raw);
            const oneDayAgo = Date.now() - 86400000;
            const filtered = arr.filter(msg=>{
               const ts = Date.parse(msg.ts);
               return !isNaN(ts) && ts >= oneDayAgo;
            });
            
            if(filtered.length !== arr.length){
               console.log(`Removed ${arr.length - filtered.length} old messages from local storage`);
               localStorage.setItem(key, JSON.stringify(filtered));
               
               if(feedEl && document.getElementById('msgs-tab')?.classList.contains('active')){
                  refreshMessages();
               }
            }
         }catch(e){
            console.error('Error cleaning local storage:', e);
         }
      }

      function dailySafetyCron(){
         setInterval(()=>{
            autoTrimServer();
            cleanLocalStorage();
         }, 60 * 60 * 1000);
         
         autoTrimServer();
         cleanLocalStorage();
      }

      function buildMessage(text, nameFormat){
         const from = formatUser(nameFormat);
         return {
            id: uid(),
            from: { id: from.id, rawName: from.rawName, displayName: from.displayName, avatar: from.avatar },
            text: text,
            ts: nowISO()
         };
      }
      function formatUser(fmt){
         const u = user;
         const parts = (u.rawName||'').split(' ').filter(Boolean);
         const first = parts[0]||'';
         const last = parts[parts.length-1]||'';
         if(fmt==='First Last') return { ...u, displayName: u.rawName };
         if(fmt==='Last') return { ...u, displayName: last };
         if(fmt==='First') return { ...u, displayName: first };
         if(fmt==='First L.') return { ...u, displayName: `${first} ${last? (last[0]+'.') : ''}`.trim() };
         if(fmt==='F. Last') return { ...u, displayName: `${first? (first[0]+'. ') : ''}${last}`.trim() };
         return { ...u, displayName: u.rawName };
      }

      function sendMessage(){
         const ta = document.getElementById('zwb-textarea');
         const txtRaw = ta.value;
         const txt = txtRaw.trim();
         const nameFmt = document.getElementById('zwb-name-format').value;

         if(pendingFiles.length){
            const files = pendingFiles.slice();
            processFilesToDataURLs(files).then(urls=>{
               const safeText = escapeHtml(txt).replace(/\n/g,'<br>');
               const imgsHtml = urls.map(u=>`<img src="${u}" style="max-width:360px;border-radius:4px;">`).join('<br>');
               const combined = (safeText? safeText + '<br>' : '') + imgsHtml;
               const msg = buildMessage(combined, nameFmt);
               appendMessage(msg,true);
               saveMessage(msg);
               pushToFirebase(msg);
               autoScrollToBottom(true);
               pendingFiles = [];
               updateFilePreview();
               ta.value = '';
               autoScrollToBottom();
            }).catch(()=>{});
            return;
         }
         if(!txt) return;
         const msg = buildMessage(escapeHtml(txt).replace(/\n/g,'<br>'), nameFmt);
         appendMessage(msg,true);
         saveMessage(msg);
         pushToFirebase(msg);
         ta.value = '';
         autoScrollToBottom();
      }

      function pushToFirebase(msg){
         db.ref("rooms/"+room+"/messages/"+msg.id).set(msg);
      }

      function saveMessage(msg){
         try{
            const key = STORAGE_PREFIX + room;
            const raw = localStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            if(!arr.find(x=>x.id===msg.id)) arr.push(msg);
            if(arr.length > MAX_MESSAGES_TO_KEEP) arr.splice(0, arr.length - MAX_MESSAGES_TO_KEEP);
            localStorage.setItem(key, JSON.stringify(arr));
         }catch(e){}
      }
      function loadHistory(){
         try{
            const raw = localStorage.getItem(STORAGE_PREFIX + room);
            return raw ? JSON.parse(raw) : [];
         }catch(e){ return []; }
      }
      function historyHas(id){
         return loadHistory().some(x=>x.id === id);
      }

      function refreshMessages(){
         if(!feedEl) return;
         feedEl.innerHTML = '';
         const hist = loadHistory();
         if(hist && hist.length){
            const sorted = hist.slice().sort((a,b)=>{
               const tsA = Date.parse(a.ts);
               const tsB = Date.parse(b.ts);
               return tsA - tsB;
            });
            sorted.forEach(m => appendMessage(m,false));
         }
         setTimeout(() => autoScrollToBottom(true), 50);
      }

      function appendMessage(msg, local){
         if(!feedEl) return;
         if(document.getElementById(msg.id)) return;
         if((msg.from && (msg.from.rawName||'').toLowerCase().includes('teacher'))) return;
         
         const avatar = msg.from.avatar || '';
         const profileId = (msg.from.id || '').replace(/^user_/,'') || '';
         const displayName = escapeHtml(msg.from.displayName || msg.from.rawName || 'Anonymous');
         const li = document.createElement('li');
         li.id = msg.id;
         
         const date = msg.ts ? new Date(msg.ts) : new Date();
         const weekday = date.toLocaleString("en-US", { weekday: "short" });
         const month   = date.toLocaleString("en-US", { month: "short" });
         const day     = date.getDate();
         const year    = date.getFullYear();
         const time    = date.toLocaleString("en-US", { 
            hour: "numeric", 
            minute: "2-digit", 
            hour12: true 
         });
         const formatted = `${weekday} ${month} ${day}, ${year} at ${time.toLowerCase()}`;
         
         li.dataset.timestamp = msg.ts || new Date().toISOString();
         
         li.className = 'first';
         li.innerHTML = `
<div class="s-edge-type-update-post sUpdate-processed">
<div class="edge-item">
<div class="edge-left">
<div class="picture">
<div class="profile-picture-wrapper">
<div class="profile-picture">
${profileId? `<a href="/user/${profileId}" class="sExtlink-processed">` : ''}
<img src="${escapeHtml(avatar)}" alt="${displayName}" class="imagecache imagecache-profile_sm">
${profileId? `</a>` : ''}
</div>
</div>
</div>
</div>
<div class="edge-main-wrapper">
<span class="edge-sentence">
<div class="edge-sentence-actions"></div>
<div class="update-sentence-inner">
<span class="long-username">
${profileId? `<a href="/user/${profileId}" class="sExtlink-processed">${displayName}</a>` : `${displayName}`}
</span>
<span class="update-body s-rte">${msg.text}</span>
</div>
</span>
<span class="edge-main"><div class="post-body"></div></span>
<div class="edge-footer">
<div class="created"><span class="small gray">${formatted}</span></div>
</div>
</div>
</div>
</div>`;
         
         const existingMessages = Array.from(feedEl.children);
         const msgTimestamp = Date.parse(li.dataset.timestamp);
         
         let inserted = false;
         for(let i = existingMessages.length - 1; i >= 0; i--){
            const existingTs = Date.parse(existingMessages[i].dataset.timestamp);
            if(msgTimestamp >= existingTs){
               existingMessages[i].after(li);
               inserted = true;
               break;
            }
         }
         
         if(!inserted){
            if(existingMessages.length > 0){
               existingMessages[0].before(li);
            } else {
               feedEl.appendChild(li);
            }
         }
         
         if(!historyHas(msg.id)) saveMessage(msg);
         if(local) autoScrollToBottom();
         setTimeout(() => {
            autoScrollToBottom(true);
         }, 30);
      }

      function startListener(){
         unsubscribe = db.ref("rooms/"+room+"/messages").limitToLast(MAX_MESSAGES_TO_KEEP).on("child_added",(snap)=>{
            const msg = snap.val();
            if(!msg) return;
            if(msg.from && msg.from.id === user.id) return;
            if(historyHas(msg.id)) return;
            appendMessage(msg,false);
            saveMessage(msg);
         });
      }

      function clearChat(){
         if(!confirm('Clear local chat history for this room?')) return;
         localStorage.removeItem(STORAGE_PREFIX + room);
         if(feedEl) feedEl.innerHTML = '';
      }
   }

   function detectUser(){
      try{
         const menu = document.querySelector('[data-sgy-sitenav="header-my-account-menu"]') ||
                     document.querySelector('.Header_header-my-account-menu') ||
                     document.querySelector('[class*="my-account"]');
         
         if(!menu){
            console.warn('Could not find user menu element');
            return { id:'user_anon_' + Math.random().toString(36).slice(2,8), rawName:'Anonymous', displayName:'Anonymous', avatar:'' };
         }
         
         const imgEl = menu.querySelector('img');
         
         const nameEl = menu.querySelector('.util-max-width-twenty-characters-2pOJU') ||
                       menu.querySelector('.LGaPf') ||
                       menu.querySelector('[class*="util-max-width"]') ||
                       menu.querySelector('[class*="name"]');
         
         const id = extractUserIdFromProfileLink(menu) || ('user_anon_' + Math.random().toString(36).slice(2,8));
         const rawName = nameEl ? nameEl.textContent.trim() : 'Anonymous';
         const avatar = imgEl ? imgEl.src : '';
         
         console.log('Detected user:', { id, rawName, avatar });
         
         return { id, rawName, displayName: rawName, avatar };
      }catch(e){
         console.error('Error detecting user:', e);
         return { id:'user_anon_' + Math.random().toString(36).slice(2,8), rawName:'Anonymous', displayName:'Anonymous', avatar:'' };
      }
   }
   
   function extractUserIdFromProfileLink(menu){
      if(!menu) return null;
      const a = menu.querySelector('a[href*="/user/"]');
      const m = a ? a.getAttribute('href').match(/\/user\/(\d+)/) : null;
      return m ? ('user_' + m[1]) : null;
   }
}

loadFirebase(startMessagingSystem);

})();