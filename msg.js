javascript:(function(){if (
  window.location.hostname.includes('google.com')
){document.open();document.write("");document.close();
(() => {

	const ZW_TEXT_COLOR = "#ffffff";

	const el = (tag, attrs = {}, children = []) => {
		const e = document.createElement(tag);
		for (const k in attrs) {
			if (k === 'style') Object.assign(e.style, attrs[k]);
			else if (k === 'html') e.innerHTML = attrs[k];
			else e.setAttribute(k, attrs[k]);
		}
		for (const c of children) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
		return e;
	};

	document.documentElement.style.setProperty('--zw-text-color', ZW_TEXT_COLOR);
	function setTextColor(col) { document.documentElement.style.setProperty('--zw-text-color', ZW_TEXT_COLOR); }

	const style = el('style', {
		html: `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;700&display=swap');
*{box-sizing:border-box;font-family:'Fredoka',sans-serif;color:var(--zw-text-color)}
.zw-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:2147483646}
.zw-card{width:75%;max-width:1100px;height:78vh;border-radius:12px;background:#0f1115;display:grid;grid-template-columns:260px 1fr 250px;gap:12px;padding:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.03)}
.zw-left,.zw-center,.zw-right{min-height:0}
.zw-left{background:#0e0f13;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px;overflow:auto}
.zw-center{background:linear-gradient(180deg,#0b0c10,#07080a);border-radius:8px;padding:10px;display:flex;flex-direction:column;overflow:hidden}
.zw-right{background:#0e0f13;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px;overflow:auto}
.zw-header{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:6px}
.zw-header img{width:48px;height:48px}
.zw-header h1{margin:0;font-weight:700;font-size:18px;background:linear-gradient(to bottom,#63fd01,#25fd01);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.zw-section-title{font-size:12px;opacity:0.85;margin-top:6px;margin-bottom:4px}
.zw-list{display:flex;flex-direction:column;gap:6px}
.zw-channel{padding:8px;border-radius:8px;background:transparent;color:var(--zw-text-color);display:flex;align-items:center;gap:8px;cursor:pointer}
.zw-channel:hover{background:rgba(255,255,255,0.02)}
.zw-channel.selected{background:linear-gradient(90deg, rgba(1,174,253,0.18), rgba(1,90,253,0.12));box-shadow:0 4px 12px rgba(1,90,253,0.06)}
.zw-msgs{flex:1;overflow-y:auto;overflow-x:hidden;padding:10px;border-radius:8px;background:rgba(255,255,255,0.01);display:flex;flex-direction:column;gap:8px}
.zw-inputbar{display:flex;gap:8px;margin-top:8px}
.zw-input{flex:1;padding:10px;border-radius:8px;border:none;outline:none;background:rgba(255,255,255,0.02);color:var(--zw-text-color)}
.zw-send{padding:10px 14px;border-radius:8px;border:none;background:linear-gradient(to bottom,#63fd01,#25fd01);color:var(--zw-text-color);font-weight:700;cursor:pointer}
.zw-pfp{width:48px;height:48px;border-radius:10px;background:#222;display:flex;align-items:center;justify-content:center;color:var(--zw-text-color);font-weight:700;overflow:hidden}
.zw-smallbtn{padding:6px 8px;border-radius:8px;border:none;background:rgba(255,255,255,0.03);color:var(--zw-text-color);cursor:pointer}
.zw-msg{display:flex;gap:8px;align-items:flex-start}
.zw-msg .meta{font-size:12px;opacity:0.85}
.zw-msg .text{font-size:14px}
.zw-msg-right{align-self:flex-end;background:rgba(255,255,255,0.02);padding:8px;border-radius:8px}
.zw-msg-left{align-self:flex-start;background:rgba(255,255,255,0.02);padding:8px;border-radius:8px}
.zw-pfp.small{width:36px;height:36px;border-radius:8px}
.zw-invite-row{display:flex;gap:8px;margin-top:8px}
`
	});
	document.head.appendChild(style);

	const backdrop = el('div', { class: 'zw-backdrop' });
	const card = el('div', { class: 'zw-card' });
	backdrop.appendChild(card);
	const root = el('div', { id: 'zw-ui-root' });
	root.appendChild(backdrop);
	document.body.appendChild(root);

	const left = el('div', { class: 'zw-left' });
	const headerLeft = el('div', { class: 'zw-header' }, [
		el('img', { src: 'https://raw.githubusercontent.com/EternallyHyper/Hyperware/refs/heads/main/assets/icon.png' }),
		el('h1', {}, ['Hyperware'])
	]);
	left.appendChild(headerLeft);

	left.appendChild(el('div', { class: 'zw-section-title' }, ['Channels']));
	const channelsList = el('div', { class: 'zw-list', id: 'zw-channels-list' });
	const chGlobal = el('div', { class: 'zw-channel', 'data-path': 'chat', title: 'Global chat' }, ['# global']);
	channelsList.appendChild(chGlobal);
	left.appendChild(channelsList);

	left.appendChild(el('div', { class: 'zw-section-title' }, ['Direct Messages']));
	const dmsList = el('div', { class: 'zw-list', id: 'zw-dms-list' });
	dmsList.appendChild(el('div', { class: 'zw-channel' }, ['No DMs']));
	left.appendChild(dmsList);

	left.appendChild(el('div', { class: 'zw-section-title' }, ['Group Chats']));
	const groupsList = el('div', { class: 'zw-list', id: 'zw-groups-list' });
	groupsList.appendChild(el('div', { class: 'zw-channel' }, ['No Groups']));
	left.appendChild(groupsList);

	left.appendChild(el('div', {}, [
		el('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } }, [
			el('input', { placeholder: 'DM username', id: 'zw-dm-username', style: { flex: '1', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--zw-text-color)' } }),
			el('button', { class: 'zw-smallbtn', id: 'zw-open-dm' }, ['Open DM'])
		])
	]));

	left.appendChild(el('div', {}, [
		el('div', { style: { display: 'flex', gap: '8px', marginTop: '8px' } }, [
			el('input', { placeholder: 'New group name', id: 'zw-group-name', style: { flex: '1', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--zw-text-color)' } }),
			el('button', { class: 'zw-smallbtn', id: 'zw-create-group' }, ['Create'])
		])
	]));

	const center = el('div', { class: 'zw-center' });
	const centerHeader = el('div', { class: 'zw-center-header', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' } });
	const centerTitle = el('div', { class: 'zw-center-title', id: 'zw-center-title' }, ['Global']);
	centerHeader.appendChild(centerTitle);
	center.appendChild(centerHeader);

	const msgs = el('div', { class: 'zw-msgs', id: 'zw-msgs' }, [
		el('div', { style: { opacity: 0.7, fontSize: '13px' } }, ['Messages will show here.'])
	]);
	center.appendChild(msgs);

	const inputBar = el('div', { class: 'zw-inputbar' });
	const inputEl = el('input', { class: 'zw-input', placeholder: 'Message... (Enter to send)', id: 'zw-input' });
	const sendBtn = el('button', { class: 'zw-send', id: 'zw-send' }, ['Send']);
	inputBar.appendChild(inputEl); inputBar.appendChild(sendBtn);
	center.appendChild(inputBar);

	const right = el('div', { class: 'zw-right' });
	right.appendChild(el('div', { class: 'zw-section-title' }, ['Profile']));
	const pfpPreview = el('div', { class: 'zw-pfp', style: { width: '72px', height: '72px', borderRadius: '12px', fontSize: '20px', alignSelf: 'center' }, id: 'zw-pfp' }, ['?']);
	right.appendChild(pfpPreview);
	const usernameDisp = el('div', { style: { textAlign: 'center', fontWeight: '700', marginTop: '6px' }, id: 'zw-username' }, ['Not logged in']);
	right.appendChild(usernameDisp);

	right.appendChild(el('div', { class: 'zw-section-title' }, ['Settings']));
	const settingsContainer = el('div', {});
	const authBox = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
		el('input', { placeholder: 'username', id: 'zw-auth-username', style: { padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--zw-text-color)' } }),
		el('input', { placeholder: 'password', id: 'zw-auth-password', type: 'password', style: { padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--zw-text-color)' } }),
		el('div', { style: { display: 'flex', gap: '8px' } }, [
			el('button', { class: 'zw-smallbtn', id: 'zw-register' }, ['Register']),
			el('button', { class: 'zw-smallbtn', id: 'zw-login' }, ['Login']),
			el('button', { class: 'zw-smallbtn', id: 'zw-logout' }, ['Log Out'])
		])
	]);
	settingsContainer.appendChild(authBox);

	settingsContainer.appendChild(el('div', { class: 'zw-section-title' }, ['Profile Picture']));
	const hiddenFile = el('input', { type: 'file', id: 'setPfpFile', accept: 'image/*', style: { display: 'none' } });
	settingsContainer.appendChild(el('div', { style: { display: 'flex', gap: '8px' } }, [
		hiddenFile,
		el('button', { class: 'zw-smallbtn', id: 'zw-upload-btn' }, ['Upload PFP']),
		el('button', { class: 'zw-smallbtn', id: 'zw-remove-pfp' }, ['Remove PFP'])
	]));

	settingsContainer.appendChild(el('div', { style: { display: 'flex', gap: '8px' } }, [
		el('input', { class: 'zw-input-sm', id: 'setColor', placeholder: '#63fd01', value: '#63fd01', style: { flex: '1', padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--zw-text-color)' } }),
		el('button', { class: 'zw-smallbtn', id: 'zw-save-settings' }, ['Save Settings']),
	]));

	right.appendChild(settingsContainer);

	card.appendChild(left);
	card.appendChild(center);
	card.appendChild(right);

	window.setZWTColor = setTextColor;

const firebaseConfig = {
  apiKey: "AIzaSyBnyB69EnmdzoV6jNm-2TLCzQ_9Ee_R5QU",
  authDomain: "hyperware-messages.firebaseapp.com",
  databaseURL: "https://hyperware-messages-default-rtdb.firebaseio.com",
  projectId: "hyperware-messages",
  storageBucket: "hyperware-messages.firebasestorage.app",
  messagingSenderId: "334411172051",
  appId: "1:334411172051:web:9d017e2c28725fae1e6c26",
  measurementId: "G-N5DWKHKDZ8"
};

	const loadScript = src => new Promise((res, rej) => {
		const s = document.createElement('script');
		s.src = src;
		s.onload = res;
		s.onerror = rej;
		document.head.appendChild(s);
	});

	async function hashStringHex(str) {
		const enc = new TextEncoder();
		const data = enc.encode(str);
		const hash = await crypto.subtle.digest('SHA-256', data);
		const bytes = Array.from(new Uint8Array(hash));
		return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
	}

	(async function bootFirebase() {
		try {
			await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
			await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
		} catch (e) {
			console.error('Failed to load Firebase SDKs', e);
			showSystemNotice('Failed to load backend (network).');
			return;
		}

		if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
		const db = firebase.database();

		async function registerUser(username, password, color = '#ff0000ff') {
			if (!username || !password) throw new Error('username and password required');
			const ref = db.ref('users/' + username);
			const snap = await ref.get();
			if (snap.exists()) throw new Error('username_taken');
			const hashed = await hashStringHex(password);
			await ref.set({ passwordHash: hashed, color, createdAt: Date.now() });
			const localBans = JSON.parse(localStorage.getItem('zw_banned_usernames') || '[]');
			if (!localBans.includes(username)) localStorage.setItem('zw_banned_usernames', JSON.stringify(localBans));
			return { username, color };
		}

		async function loginUser(username, password) {
			if (!username || !password) throw new Error('username and password required');
			const localBans = JSON.parse(localStorage.getItem('zw_banned_usernames') || '[]');
			if (localBans.includes(username)) throw new Error('user_banned_local');
			const ref = db.ref('users/' + username);
			const snap = await ref.get();
			if (!snap.exists()) throw new Error('user_not_found');
			const data = snap.val();
			const hashed = await hashStringHex(password);
			if ((data.passwordHash || '') !== hashed) throw new Error('wrong_password');
			const banned = (await db.ref('bans/' + username).get()).exists();
			if (banned) {
				const b = JSON.parse(localStorage.getItem('zw_banned_usernames') || '[]');
				if (!b.includes(username)) {
					b.push(username);
					localStorage.setItem('zw_banned_usernames', JSON.stringify(b));
				}
				throw new Error('user_banned_server');
			}
			return { username, color: data.color || '#63fd01', pfp: data.pfp || '', admin: data.admin || false };
		}

		async function setUserColor(username, color) {
			if (!username || !color) throw new Error('username and color required');
			await db.ref('users/' + username + '/color').set(color);
			return true;
		}

		async function setUserPfp(username, dataURL) {
			if (!username) throw new Error('username required');
			await db.ref('users/' + username + '/pfp').set(dataURL || '');
			return true;
		}

		async function sendMessage(path, payload) {
			if (!path || !payload) throw new Error('path and payload required');
			return db.ref(path).push(payload);
		}

		async function sendToGlobal(payload) {
			return sendMessage('chat', payload);
		}

		async function createGroup(id, name, creatorUsername) {
			if (!id || !name || !creatorUsername) throw new Error('id,name,creator required');
			const metaRef = db.ref('chats/groups/' + id + '/meta');
			const snap = await metaRef.get();
			if (snap.exists()) throw new Error('group_exists');
			await metaRef.set({ name, creator: creatorUsername, members: { [creatorUsername]: true }, createdAt: Date.now() });
			return { id, name };
		}

		async function createOrEnsureDM(a, b) {
			if (!a || !b) throw new Error('two usernames required');
			const id = [a, b].sort().join('__');
			const ref = db.ref('chats/dms/' + id);
			const snap = await ref.get();
			if (!snap.exists()) {
				await ref.set({ members: { [a]: true, [b]: true }, createdAt: Date.now() });
			}
			return id;
		}

		function loadMessages(path, onChildAdded, limit = 200) {
			if (!path || typeof onChildAdded !== 'function') throw new Error('path and callback required');
			const ref = db.ref(path).limitToLast(limit);
			const cb = snap => {
				const val = snap.val();
				onChildAdded(val, snap.key);
			};
			ref.on('child_added', cb);
			return { ref, cb };
		}

		function detachListener(handle) {
			if (!handle) return;
			try { handle.ref.off('child_added', handle.cb); } catch (e) { }
		}

		async function inviteUserToGroup(groupId, targetUser, invitedBy) {
			if (!groupId || !targetUser || !invitedBy) throw new Error('groupId,targetUser,invitedBy required');
			const metaSnap = await db.ref('chats/groups/' + groupId + '/meta').get();
			if (!metaSnap.exists()) throw new Error('group_not_found');
			const meta = metaSnap.val() || {};
			const creator = meta.creator;
			const invitedObj = { groupId, invitedBy, time: Date.now(), groupName: meta.name || groupId };
			await db.ref('users/' + targetUser + '/groupInvites/' + groupId).set(invitedObj);
			return true;
		}

		async function checkAdminPassword(plain) {
			const snap = await db.ref('meta/adminPasswordHash').get();
			if (!snap.exists()) return false;
			const stored = snap.val();
			const hashed = await hashStringHex(plain);
			return hashed === stored;
		}

		async function setAdminPassword(plain) {
			const hashed = await hashStringHex(plain);
			await db.ref('meta/adminPasswordHash').set(hashed);
			return true;
		}

		async function giveAdministratorToUser(username) {
			await db.ref('users/' + username + '/admin').set(true);
			return true;
		}

		async function deleteMessagesByUser(username) {
			const chatSnap = await db.ref('chat').get();
			if (chatSnap.exists()) {
				const val = chatSnap.val();
				for (const k in val) {
					if (val[k].username === username) await db.ref('chat/' + k).remove();
				}
			}
			const groupsSnap = await db.ref('chats/groups').get();
			if (groupsSnap.exists()) {
				const groups = groupsSnap.val();
				for (const gid in groups) {
					const msgsSnap = await db.ref(`chats/groups/${gid}/messages`).get();
					if (msgsSnap.exists()) {
						const msgs = msgsSnap.val();
						for (const mk in msgs) {
							if (msgs[mk].username === username) await db.ref(`chats/groups/${gid}/messages/${mk}`).remove();
						}
					}
				}
			}
			const dmsSnap = await db.ref('chats/dms').get();
			if (dmsSnap.exists()) {
				const dms = dmsSnap.val();
				for (const did in dms) {
					const msgsSnap = await db.ref(`chats/dms/${did}/messages`).get();
					if (msgsSnap.exists()) {
						const msgs = msgsSnap.val();
						for (const mk in msgs) {
							if (msgs[mk].username === username) await db.ref(`chats/dms/${did}/messages/${mk}`).remove();
						}
					}
				}
			}
		}

		async function banUser(usernameToBan, byAdmin) {
			await db.ref('bans/' + usernameToBan).set({ bannedBy: byAdmin || 'admin', time: Date.now() });
			await db.ref('users/' + usernameToBan).remove();
			await deleteMessagesByUser(usernameToBan);
			await db.ref('adminActions').push({ action: 'ban', target: usernameToBan, by: byAdmin || 'admin', time: Date.now() });
			const b = JSON.parse(localStorage.getItem('zw_banned_usernames') || '[]');
			if (!b.includes(usernameToBan)) {
				b.push(usernameToBan);
				localStorage.setItem('zw_banned_usernames', JSON.stringify(b));
			}
			return true;
		}

		async function purgeMessages(path, count) {
			if (!path) throw new Error('path required');
			const ref = db.ref(path).limitToLast(count);
			const snap = await ref.get();
			if (!snap.exists()) return 0;
			const val = snap.val();
			let removed = 0;
			for (const k in val) {
				await db.ref(path + '/' + k).remove();
				removed++;
			}
			return removed;
		}

		function readFileAsDataURL(file) {
			return new Promise((res, rej) => {
				const fr = new FileReader();
				fr.onload = () => res(fr.result);
				fr.onerror = () => rej(new Error('file read error'));
				fr.readAsDataURL(file);
			});
		}

		window.Zephware = window.Zephware || {};
		Object.assign(window.Zephware, {
			db,
			registerUser,
			loginUser,
			sendMessage,
			sendToGlobal,
			createGroup,
			createOrEnsureDM,
			loadMessages,
			detachListener,
			inviteUserToGroup,
			setUserColor,
			setUserPfp,
			readFileAsDataURL,
			checkAdminPassword,
			setAdminPassword,
			giveAdministratorToUser,
			banUser,
			purgeMessages
		});

		let currentUser = null;
		let currentChat = { path: 'chat', type: 'global', title: 'Global' };
		let currentListener = null;

		function showSystemNotice(text) {
			const n = el('div', { style: { opacity: 0.9, fontSize: '13px' } }, [text]);
			msgs.appendChild(n);
			msgs.scrollTop = msgs.scrollHeight;
		}

		function renderMessage(msg) {
			const wrap = el('div', { class: 'zw-msg' });
			const leftSide = el('div', {});
			const pfp = el('div', { class: 'zw-pfp small' });
			if (msg.pfp) {
				const i = el('img', { src: msg.pfp, style: { width: '100%', height: '100%', objectFit: 'cover' } });
				pfp.appendChild(i);
			} else {
				pfp.textContent = (msg.username || '?').slice(0, 2).toUpperCase();
			}
			leftSide.appendChild(pfp);
			const body = el('div', {});
			const meta = el('div', { class: 'meta' }, [
				el('span', { style: { fontWeight: '700', color: msg.color || ZW_TEXT_COLOR } }, [msg.username || 'Unknown']),
				el('span', { style: { marginLeft: '8px', opacity: 0.8 } }, [new Date(msg.time || Date.now()).toLocaleTimeString()])
			]);
			const text = el('div', { class: 'text' }, [msg.text || '']);
			body.appendChild(meta);
			body.appendChild(text);
			wrap.appendChild(leftSide);
			wrap.appendChild(body);
			return wrap;
		}

		function clearMessages() {
			msgs.innerHTML = '';
		}

		async function attachToPath(pathObj) {
			if (currentListener) {
				try { currentListener.ref.off('child_added', currentListener.cb); } catch (e) { }
				currentListener = null;
			}
			clearMessages();
			centerTitle.textContent = pathObj.title || pathObj.path;
			let path = pathObj.path;
			if (pathObj.type === 'group') path = `chats/groups/${pathObj.id}/messages`;
			if (pathObj.type === 'dm') path = `chats/dms/${pathObj.id}/messages`;
			if (pathObj.type === 'global') path = 'chat';
			try {
				currentListener = loadMessages(path, (val, key) => {
					if (!val) return;
					msgs.appendChild(renderMessage(val));
					msgs.scrollTop = msgs.scrollHeight;
				}, 200);
			} catch (e) {
				showSystemNotice('Failed to attach to chat: ' + e.message);
			}
		}

		async function refreshGroupsAndDMs() {
			const channelsEl = document.getElementById('zw-channels-list');
			channelsEl.innerHTML = '';
			channelsEl.appendChild(chGlobal);

			groupsList.innerHTML = '';
			dmsList.innerHTML = '';

			try {
				const groupsSnap = await db.ref('chats/groups').get();
				let anyGroup = false;
				if (groupsSnap.exists()) {
					const all = groupsSnap.val();
					for (const id in all) {
						const meta = all[id].meta || {};
						const members = meta.members || {};
						const name = meta.name || id;
						if (currentUser && members[currentUser.username]) {
							anyGroup = true;
							const item = el('div', { class: 'zw-channel', title: name }, [`# ${name}`]);
							item.addEventListener('click', async () => {
								setSelectedChannel(item);
								currentChat = { type: 'group', id, path: null, title: `# ${name}` };
								await attachToPath(currentChat);
								await renderGroupDetail(id);
							});
							groupsList.appendChild(item);
						}
					}
				}
				if (!anyGroup) groupsList.appendChild(el('div', { class: 'zw-channel' }, ['No Groups']));
			} catch (e) {
				groupsList.appendChild(el('div', { class: 'zw-channel' }, ['Error loading groups']));
			}

			try {
				const dmsSnap = await db.ref('chats/dms').get();
				let anyDM = false;
				if (dmsSnap.exists()) {
					const all = dmsSnap.val();
					for (const id in all) {
						const members = all[id].members || {};
						if (currentUser && members[currentUser.username]) {
							anyDM = true;
							const other = Object.keys(members).find(u => u !== currentUser.username) || id;
							const item = el('div', { class: 'zw-channel', title: `DM: ${other}` }, [`@ ${other}`]);
							item.addEventListener('click', async () => {
								setSelectedChannel(item);
								currentChat = { type: 'dm', id, path: null, title: `@ ${other}`, other };
								await attachToPath(currentChat);
								await renderDMDetail(id, other);
							});
							dmsList.appendChild(item);
						}
					}
				}
				if (!anyDM) dmsList.appendChild(el('div', { class: 'zw-channel' }, ['No DMs']));
			} catch (e) {
				dmsList.appendChild(el('div', { class: 'zw-channel' }, ['Error loading DMs']));
			}

			const existingInvites = left.querySelectorAll('.zw-invite-item');
			existingInvites.forEach(n => n.remove());

			if (currentUser) {
				const invSnap = await db.ref('users/' + currentUser.username + '/groupInvites').get();
				if (invSnap.exists()) {
					const inv = invSnap.val();
					for (const gid in inv) {
						const meta = inv[gid];
						const item = el('div', { class: 'zw-channel zw-invite-item' }, [
							`Invite: ${meta.groupName}`,
							el('button', { class: 'zw-smallbtn', style: { marginLeft: 'auto' } }, ['Accept'])
						]);
						const btn = item.querySelector('button');
						btn.addEventListener('click', async () => {
							try {
								await db.ref('chats/groups/' + gid + '/meta/members/' + currentUser.username).set(true);
								await db.ref('users/' + currentUser.username + '/groupInvites/' + gid).remove();
								showSystemNotice('Joined group: ' + meta.groupName);
								await refreshGroupsAndDMs();
							} catch (e) {
								showSystemNotice('Accept invite failed: ' + e.message);
							}
						});
						left.appendChild(item);
					}
				}
			}
		}

		function setSelectedChannel(elItem) {
			const all = document.querySelectorAll('.zw-channel');
			all.forEach(n => n.classList.remove('selected'));
			if (elItem) elItem.classList.add('selected');
		}

		async function renderGroupDetail(groupId) {
			const metaSnap = await db.ref('chats/groups/' + groupId + '/meta').get();
			if (!metaSnap.exists()) return;
			const meta = metaSnap.val();
			const old = document.getElementById('zw-group-detail');
			if (old) old.remove();
			const box = el('div', { id: 'zw-group-detail' }, [
				el('div', { class: 'zw-section-title' }, [`Group: ${meta.name || groupId}`])
			]);
			const isCreator = currentUser && meta.creator === currentUser.username;
			const isAdmin = currentUser && currentUser.admin;
			if (isCreator || isAdmin) {
				const inviteRow = el('div', { class: 'zw-invite-row' }, [
					el('input', { placeholder: 'Invite username', id: 'zw-invite-username', style: { flex: '1', padding: '6px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.02)', color: 'var(--zw-text-color)' } }),
					el('button', { class: 'zw-smallbtn', id: 'zw-invite-btn' }, ['Invite'])
				]);
				box.appendChild(inviteRow);
				setTimeout(() => {
					document.getElementById('zw-invite-btn').addEventListener('click', async () => {
						const t = document.getElementById('zw-invite-username').value.trim();
						if (!t) return showSystemNotice('Enter username to invite.');
						try {
							await inviteUserToGroup(groupId, t, currentUser.username);
							showSystemNotice('Invitation sent to ' + t);
						} catch (e) {
							showSystemNotice('Invite failed: ' + e.message);
						}
					});
				}, 0);
			} else {
				box.appendChild(el('div', {}, ['This group is invite-only.']));
			}
			right.appendChild(box);
		}

		async function renderDMDetail(dmId, other) {
			const old = document.getElementById('zw-dm-detail');
			if (old) old.remove();
			const box = el('div', { id: 'zw-dm-detail' }, [
				el('div', { class: 'zw-section-title' }, [`DM with ${other}`])
			]);
			right.appendChild(box);
		}

		attachToPath(currentChat);

		sendBtn.addEventListener('click', async () => {
			const text = inputEl.value.trim();
			if (!text) return;
			if (!currentUser) {
				showSystemNotice('You must be logged in to send messages.');
				return;
			}
			if (text.startsWith('/')) {
				await handleCommand(text);
				inputEl.value = '';
				return;
			}
			inputEl.value = '';
			let path = 'chat';
			if (currentChat.type === 'group') path = `chats/groups/${currentChat.id}/messages`;
			if (currentChat.type === 'dm') path = `chats/dms/${currentChat.id}/messages`;
			const payload = {
				username: currentUser.username,
				text,
				time: Date.now(),
				color: currentUser.color || '#63fd01',
				pfp: currentUser.pfp || ''
			};
			try {
				await sendMessage(path, payload);
			} catch (e) {
				showSystemNotice('Send failed: ' + e.message);
			}
		});

		inputEl.addEventListener('keydown', (ev) => {
			if (ev.key === 'Enter') {
				ev.preventDefault();
				sendBtn.click();
			}
		});

		chGlobal.addEventListener('click', async () => {
			setSelectedChannel(chGlobal);
			currentChat = { type: 'global', path: 'chat', title: 'Global' };
			await attachToPath(currentChat);
		});

		document.getElementById('zw-open-dm').addEventListener('click', async () => {
			const other = document.getElementById('zw-dm-username').value.trim();
			if (!other) return showSystemNotice('Enter username to DM.');
			if (!currentUser) return showSystemNotice('You must be logged in to open a DM.');
			try {
				const id = await createOrEnsureDM(currentUser.username, other);
				await db.ref(`chats/dms/${id}/members/${currentUser.username}`).set(true);
				currentChat = { type: 'dm', id, path: null, title: `@ ${other}`, other };
				await attachToPath(currentChat);
				await refreshGroupsAndDMs();
			} catch (e) {
				showSystemNotice('DM failed: ' + e.message);
			}
		});

		document.getElementById('zw-create-group').addEventListener('click', async () => {
			const name = document.getElementById('zw-group-name').value.trim();
			if (!name) return;
			if (!currentUser) return;
			const safeName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '').toLowerCase();
			try {
				await createGroup(safeName, name, currentUser.username);
				await refreshGroupsAndDMs();
			} catch (e) {
			}
		});

		document.getElementById('zw-register').addEventListener('click', async () => {
			const u = document.getElementById('zw-auth-username').value.trim();
			const p = document.getElementById('zw-auth-password').value;
			if (!u || !p) return showSystemNotice('username & password required.');
			const localBans = JSON.parse(localStorage.getItem('zw_banned_usernames') || '[]');
			if (localBans.includes(u)) return showSystemNotice('This username is banned on this device.');
			try {
				await registerUser(u, p, document.getElementById('setColor').value || '#63fd01');
				showSystemNotice('Registered. You may now login.');
			} catch (e) {
				showSystemNotice('Register error: ' + e.message);
			}
		});

		document.getElementById('zw-login').addEventListener('click', async () => {
			const u = document.getElementById('zw-auth-username').value.trim();
			const p = document.getElementById('zw-auth-password').value;
			if (!u || !p) return showSystemNotice('username & password required.');
			try {
				const me = await loginUser(u, p);
				currentUser = { username: u, color: me.color || '#63fd01', pfp: me.pfp || '', admin: me.admin || false };
				usernameDisp.textContent = currentUser.username;
				if (currentUser.pfp) {
					pfpPreview.innerHTML = '';
					const i = el('img', { src: currentUser.pfp, style: { width: '100%', height: '100%', objectFit: 'cover' } });
					pfpPreview.appendChild(i);
				} else {
					pfpPreview.textContent = currentUser.username.slice(0, 2).toUpperCase();
				}
				document.getElementById('setColor').value = currentUser.color;
				setTextColor(currentUser.color);
				showSystemNotice('Logged in as ' + currentUser.username);
				await refreshGroupsAndDMs();
			} catch (e) {
				if (e.message === 'user_banned_server' || e.message === 'user_banned_local') {
					showSystemNotice('Your account is banned.');
					localStorage.setItem('zw_banned_user', 'true');
					try { backdrop.remove(); } catch (err) {}
					return;
				}
				showSystemNotice('Login error: ' + e.message);
			}
		});

		document.getElementById('zw-logout').addEventListener('click', () => {
			currentUser = null;
			usernameDisp.textContent = 'Not logged in';
			pfpPreview.textContent = '?';
			refreshGroupsAndDMs();
			showSystemNotice('Logged out.');
		});

		document.getElementById('zw-upload-btn').addEventListener('click', () => {
			if (!currentUser) return showSystemNotice('Login to upload PFP.');
			hiddenFile.click();
		});
		hiddenFile.addEventListener('change', async (ev) => {
			const file = ev.target.files && ev.target.files[0];
			if (!file) return;
			try {
				const data = await readFileAsDataURL(file);
				await setUserPfp(currentUser.username, data);
				currentUser.pfp = data;
				pfpPreview.innerHTML = '';
				const i = el('img', { src: data, style: { width: '100%', height: '100%', objectFit: 'cover' } });
				pfpPreview.appendChild(i);
				showSystemNotice('PFP updated.');
				hiddenFile.value = '';
			} catch (e) {
				showSystemNotice('PFP upload failed: ' + e.message);
			}
		});

		document.getElementById('zw-remove-pfp').addEventListener('click', async () => {
			if (!currentUser) return showSystemNotice('Login to remove PFP.');
			try {
				await setUserPfp(currentUser.username, '');
				currentUser.pfp = '';
				pfpPreview.textContent = currentUser.username.slice(0, 2).toUpperCase();
				showSystemNotice('PFP removed.');
			} catch (e) {
				showSystemNotice('Failed to remove PFP: ' + e.message);
			}
		});

		document.getElementById('zw-save-settings').addEventListener('click', async () => {
			if (!currentUser) return showSystemNotice('Login to save settings.');
			const col = document.getElementById('setColor').value || '#63fd01';
			try {
				await setUserColor(currentUser.username, col);
				currentUser.color = col;
				setTextColor(col);
				showSystemNotice('Color saved.');
			} catch (e) {
				showSystemNotice('Save failed: ' + e.message);
			}
		});

		setInterval(() => {
			if (currentUser) refreshGroupsAndDMs();
		}, 8000);

		await refreshGroupsAndDMs();

		backdrop.addEventListener('click', (ev) => {
			if (ev.target === backdrop) {
				try { if (currentListener) currentListener.ref.off('child_added', currentListener.cb); } catch (e) { }
				backdrop.remove();
			}
		});

		async function handleCommand(text) {
			const parts = text.trim().split(' ');
			const cmd = parts[0].toLowerCase();
			if (cmd === '/giveadministrator') {
				const pass = parts.slice(1).join(' ');
				if (!pass) return showSystemNotice('Usage: /giveAdministrator {password}');
				try {
					const ok = await checkAdminPassword(pass);
					if (!ok) return showSystemNotice('Administrator password incorrect.');
					await giveAdministratorToUser(currentUser.username);
					currentUser.admin = true;
					showSystemNotice('You are now an administrator.');
				} catch (e) {
					showSystemNotice('Admin command failed: ' + e.message);
				}
				return;
			}
			if (cmd === '/ban') {
				const target = parts[1];
				if (!target) return showSystemNotice('Usage: /ban {username}');
				if (!currentUser || !currentUser.admin) return showSystemNotice('Admin only command.');
				try {
					await banUser(target, currentUser.username);
					showSystemNotice('User banned: ' + target);
				} catch (e) {
					showSystemNotice('Ban failed: ' + e.message);
				}
				return;
			}
			if (cmd === '/purge') {
				const num = parseInt(parts[1], 10);
				if (isNaN(num) || num <= 0) return showSystemNotice('Usage: /purge {count}');
				if (!currentUser || !currentUser.admin) return showSystemNotice('Admin only command.');
				let path = null;
				if (currentChat.type === 'global') path = 'chat';
				else if (currentChat.type === 'group') path = `chats/groups/${currentChat.id}/messages`;
				else if (currentChat.type === 'dm') path = `chats/dms/${currentChat.id}/messages`;
				if (!path) return showSystemNotice('No chat selected to purge.');
				try {
					const removed = await purgeMessages(path, num);
					showSystemNotice(`Purged ${removed} messages.`);
				} catch (e) {
					showSystemNotice('Purge failed: ' + e.message);
				}
				return;
			}
			showSystemNotice('Unknown command.');
		}

		try {
			if (localStorage.getItem('zw_banned_user') === 'true') {
				try { backdrop.remove(); } catch (e) {}
				return;
			}
		} catch (e) {}
	})();
})();
} else {alert('Messages will only work on google.com, this is for features to work.');}})();