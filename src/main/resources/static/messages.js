(function(){
  // Server-backed chat manager using the REST API under /api
  // Top-level references (will be assigned when navbar injects elements)
  let btn, panel, closeBtn, chatListEl, chatMessagesEl, chatInput, chatSend;
  let state = { chats: [], selected: null };
  let currentUser = '';

  // We'll wait for navbar injection to complete — attempt to initialize until elements exist.
  function attemptInitializeMessages(){
    // assign globals so other functions can access them
    btn = document.getElementById('messages-btn');
    panel = document.getElementById('messages-panel');
    closeBtn = document.getElementById('messages-close');
    chatListEl = document.getElementById('chat-list');
    chatMessagesEl = document.getElementById('chat-messages');
    chatInput = document.getElementById('chat-input');
    chatSend = document.getElementById('chat-send');
    if (!btn || !panel) return false;

    // proceed to the full init with these resolved elements
    initializeMessages({ btn, panel, closeBtn, chatListEl, chatMessagesEl, chatInput, chatSend });
    return true;
  }

  // retry loop
  (function waitForNavbar(){
    let tries = 0;
    const maxTries = 60; // ~6 seconds
    function tick(){
      tries++;
      if (attemptInitializeMessages()) return;
      if (tries >= maxTries){ console.warn('[messages.js] navbar elements not found after waiting - messages UI disabled'); return; }
      setTimeout(tick, 100);
    }
    tick();
  })();

  async function fetchWhoami(){
    try{
      const r = await fetch('/api/whoami');
      if (!r.ok) return '';
      const j = await r.json();
      return j && j.username ? j.username : '';
    }catch(e){ return ''; }
  }

  async function initUser(){
    currentUser = await fetchWhoami();
    // expose for debugging
    window.DualNetCurrentUser = currentUser;
  }

  async function fetchJson(url, opts) {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  // --- new: user search UI + logic ---
  // we'll inject a small search box above the chat input area that queries /api/profiles?q=...
  function debounce(fn, wait){ let t; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); }; }

  async function searchUsers(query){
    if (!query || !query.trim()) return [];
    try{
      const url = '/api/profiles?q=' + encodeURIComponent(query.trim());
      const r = await fetch(url, { credentials: 'same-origin' });
      if (!r.ok) return [];
      const j = await r.json();
      return Array.isArray(j) ? j : [];
    }catch(e){ return []; }
  }

  function createSearchUI(){
    if (!chatInput) return; // can't insert
    const controls = chatInput.parentElement; if (!controls) return;
    // avoid creating twice
    if (document.getElementById('user-search-container')) return;

    const container = document.createElement('div');
    container.id = 'user-search-container';
    container.style.padding = '8px';
    container.style.borderTop = '1px solid #eaeaea';
    container.style.borderBottom = '1px solid #eee';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '6px';

    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems = 'center';

    const input = document.createElement('input');
    input.id = 'user-search-input';
    input.type = 'text';
    input.placeholder = 'Benutzer suchen (Name oder E-Mail)';
    input.style.flex = '1';
    input.style.padding = '8px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '6px';

    const hint = document.createElement('div'); hint.textContent = '→'; hint.style.color = '#888'; hint.style.fontSize = '18px'; hint.title = 'Wähle einen Benutzer aus, um einen Chat zu starten';

    row.appendChild(input); row.appendChild(hint);

    const results = document.createElement('div');
    results.id = 'user-search-results';
    results.style.maxHeight = '180px';
    results.style.overflow = 'auto';

    container.appendChild(row); container.appendChild(results);

    // insert before existing chat controls
    controls.parentElement.insertBefore(container, controls);

    // state for results and selection
    let selectedIndex = -1;

    function setSelection(idx){
      selectedIndex = idx;
      Array.from(results.children).forEach(c => { c.style.background = ''; });
      const el = results.querySelector('[data-idx="'+idx+'"]');
      if (el) el.style.background = '#e8f0ff';
    }

    // event handling
    const doSearch = debounce(async function(){
      const q = input.value || '';
      results.innerHTML = '';
      selectedIndex = -1;
      if (!q.trim()) return;
      const list = await searchUsers(q);
      if (!list || list.length === 0){
        const p = document.createElement('div'); p.textContent = 'Keine Nutzer gefunden'; p.style.padding='6px'; p.style.color='#666'; results.appendChild(p); return;
      }
      list.forEach((u, i) => {
        const item = document.createElement('div');
        item.dataset.idx = String(i);
        item.className = 'user-search-item';
        item.style.padding = '8px'; item.style.borderBottom = '1px solid #f0f0f0'; item.style.cursor = 'pointer';
        item.tabIndex = 0;
        const title = document.createElement('div'); title.textContent = u.displayName && u.displayName.length ? (u.displayName + ' (' + u.username + ')') : (u.username || u.email || '');
        title.style.fontWeight = '600';
        const sub = document.createElement('div'); sub.textContent = u.email || ''; sub.style.fontSize='12px'; sub.style.color='#666';
        item.appendChild(title); item.appendChild(sub);
        item.onclick = async function(){
          const other = u.username && u.username.length ? u.username : (u.email || '');
          if (!other) return;
          await startChatWith(other);
          input.value = '';
          results.innerHTML = '';
          selectedIndex = -1;
        };
        item.onmouseenter = function(){ setSelection(i); };
        results.appendChild(item);
      });
    }, 300);

    input.addEventListener('input', doSearch);

    // keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
    input.addEventListener('keydown', function(e){
      const len = results.querySelectorAll('.user-search-item').length;
      if (e.key === 'ArrowDown'){
        e.preventDefault();
        if (len === 0) return;
        let ni = selectedIndex + 1;
        if (ni >= len) ni = 0;
        setSelection(ni);
        const el = results.querySelector('[data-idx="'+ni+'"]'); if (el) el.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp'){
        e.preventDefault();
        if (len === 0) return;
        let ni = selectedIndex - 1;
        if (ni < 0) ni = len - 1;
        setSelection(ni);
        const el = results.querySelector('[data-idx="'+ni+'"]'); if (el) el.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter'){
        e.preventDefault();
        if (selectedIndex >= 0){
          const el = results.querySelector('[data-idx="'+selectedIndex+'"]'); if (el) el.click();
        } else {
          const first = results.querySelector('.user-search-item'); if (first) first.click();
        }
      } else if (e.key === 'Escape'){
        input.value = '';
        results.innerHTML = '';
        selectedIndex = -1;
        input.blur();
      }
    });

    // also allow clicking outside to clear results
    document.addEventListener('click', function(ev){
      if (!container.contains(ev.target)){
        // keep input value but clear dropdown
        results.innerHTML = '';
        selectedIndex = -1;
      }
    });
  }

  async function startChatWith(other) {
    if (!other) return;
    if (!currentUser) await initUser();
    const me = currentUser || '';
    try{
      const res = await fetch('/api/chats/start', { method: 'POST', headers: {'Content-Type':'application/json'}, credentials:'same-origin', body: JSON.stringify({ me, other }) });
      if (!res.ok) { console.warn('start chat failed, status=' + res.status); return; }
      const j = await res.json();
      if (j && j.chatId) {
        state.selected = j.chatId;
        await refreshAll();
        // show the chat window if panel is closed
        if (!panel.classList.contains('open')) openPanel();
        // focus message input
        if (chatInput) chatInput.focus();
      }
    }catch(e){ console.warn('Could not start chat with', other, e); }
  }
  // --- end new search UI ---

  async function loadChatList(){
    try{
      const list = await fetchJson('/api/chats');
      state.chats = Array.isArray(list) ? list : [];
    }catch(e){
      console.warn('Failed to load chat list, falling back to local state', e);
    }
  }

  async function loadChatMessages(chatId){
    try{
      const msgs = await fetchJson('/api/chats/' + encodeURIComponent(chatId));
      return Array.isArray(msgs) ? msgs : [];
    }catch(e){
      console.warn('Failed to load messages from server', e); return [];
    }
  }

  async function postMessageToServer(chatId, msg){
    try{
      await fetch('/api/chats/' + encodeURIComponent(chatId) + '/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
    }catch(e){ console.warn('Failed to post message', e); }
  }

  async function renderChatList(){
    chatListEl.innerHTML = '';
    const header = document.createElement('div');
    header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center'; header.style.marginBottom = '8px';
    const title = document.createElement('strong'); title.textContent = 'Unterhaltungen';
    header.appendChild(title);
    chatListEl.appendChild(header);

    if (!state.chats || state.chats.length === 0){
      const p = document.createElement('div'); p.textContent = 'Keine Chats vorhanden.'; p.style.color='#666'; p.style.padding='8px'; chatListEl.appendChild(p); return;
    }
    state.chats.forEach(chat => {
      const chatId = chat.chatId || (chat.id);
      const item = document.createElement('div'); item.className = 'chat-item';
      if (state.selected === chatId) item.classList.add('active');
      const t = document.createElement('div'); t.textContent = chat.title || chat.participantsDisplay && chat.participantsDisplay.join(', ') || chatId; t.style.fontWeight='600';
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = (chat.messageCount != null) ? `${chat.messageCount} Nachrichten` : '';
      item.appendChild(t); item.appendChild(meta);
      item.onclick = async ()=>{ state.selected = chatId; await renderMessages(); renderChatList(); };
      chatListEl.appendChild(item);
    });
  }

  async function renderMessages(){
    chatMessagesEl.innerHTML = '';
    if (!state.selected){
      const p = document.createElement('div'); p.textContent = 'Wähle eine Unterhaltung aus.'; p.style.padding='10px'; p.style.color='#666'; chatMessagesEl.appendChild(p); return;
    }
    const msgs = await loadChatMessages(state.selected);
    if (!msgs || msgs.length === 0){
      const p = document.createElement('div'); p.textContent = 'Keine Nachrichten in dieser Unterhaltung.'; p.style.padding='10px'; p.style.color='#666'; chatMessagesEl.appendChild(p); return;
    }
    msgs.forEach(msg => {
      const sender = msg.sender || '';
      const isOutgoing = sender && currentUser && sender === currentUser;
      const m = document.createElement('div'); m.className='message ' + (isOutgoing ? 'outgoing' : 'incoming');
      m.textContent = msg.text; chatMessagesEl.appendChild(m);
    });
    setTimeout(()=>{ chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; }, 40);
  }

  async function refreshAll(){
    await loadChatList();
    await renderChatList();
    if (state.selected) await renderMessages();
  }

  function openPanel(){ panel.classList.add('open'); panel.style.display='block'; panel.setAttribute('aria-hidden','false'); refreshAll(); }
  function closePanel(){ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); setTimeout(()=>{ if (!panel.classList.contains('open')) panel.style.display='none'; }, 260); }

  btn.addEventListener('click', ()=>{ if (panel.classList.contains('open')) closePanel(); else openPanel(); });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && panel.classList.contains('open')) closePanel(); });

  async function sendCurrentMessage(){
    const txt = chatInput.value && chatInput.value.trim(); if (!txt) return;
    if (!state.selected){ alert('Bitte zuerst eine Unterhaltung auswählen.'); return; }
    const sender = currentUser || 'anonymous';
    const msg = { sender: sender, text: txt, ts: Date.now() };
    // optimistic UI
    const div = document.createElement('div'); div.className='message outgoing'; div.textContent = msg.text; chatMessagesEl.appendChild(div); chatInput.value=''; chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    // send to server
    await postMessageToServer(state.selected, msg);
    // refresh messages and list
    await refreshAll();
  }

  chatSend.addEventListener('click', ()=>{ sendCurrentMessage(); });
  chatInput.addEventListener('keydown', (e)=>{ if (e.key==='Enter') { e.preventDefault(); sendCurrentMessage(); } });

  // expose an API to open a chat from other pages (will call openPanel when initialized)
  window.DualNetChat = window.DualNetChat || {};
  window.DualNetChat.openChat = async function(chatId, title){
    // If the messages system hasn't initialized yet, wait a short time and retry
    const start = Date.now();
    while(typeof window.__dn_messages_ready === 'undefined' && (Date.now() - start) < 5000){ await new Promise(r=>setTimeout(r, 120)); }
    try{
      if (window.__dn_messages_api && typeof window.__dn_messages_api.openChat === 'function'){
        return window.__dn_messages_api.openChat(chatId, title);
      }
    }catch(_){ }
    // fallback: try to open panel by toggling class on #messages-panel
    const panel = document.getElementById('messages-panel'); if (panel) { panel.classList.add('open'); panel.style.display='block'; panel.setAttribute('aria-hidden','false'); }
  };

  // initializeMessages will be called once the navbar elements exist
  function initializeMessages(els){
    const { btn, panel, closeBtn, chatListEl, chatMessagesEl, chatInput, chatSend } = els;
    if (!btn || !panel) return;

    // replicate previous top-level state inside closure
    (function(){
      let state = { chats: [], selected: null };
      let currentUser = '';

      async function initUser(){ currentUser = await fetchWhoami(); window.DualNetCurrentUser = currentUser; }

      async function refreshAll(){
        await loadChatList();
        await renderChatList();
        if (state.selected) await renderMessages();
      }

      // bring in helper functions from above scope by copying needed ones
      async function fetchJson(url, opts) { const r = await fetch(url, opts); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }

      // reuse existing functions declared earlier in this file by calling them via function hoisting
      // Note: functions like loadChatList, loadChatMessages etc. are defined below in the original file body,
      // but for simplicity, re-declare local wrappers that call the outer ones if present.
      // We'll implement minimal versions here reusing the original names via closures.

      // --- copy implementations (lightweight) ---
      async function loadChatList(){
        try{ const list = await fetchJson('/api/chats'); state.chats = Array.isArray(list) ? list : []; }catch(e){ console.warn('Failed to load chat list, falling back to local state', e); }
      }
      async function loadChatMessages(chatId){
        try{ const msgs = await fetchJson('/api/chats/' + encodeURIComponent(chatId)); return Array.isArray(msgs) ? msgs : []; }catch(e){ console.warn('Failed to load messages from server', e); return []; }
      }
      async function postMessageToServer(chatId, msg){ try{ await fetch('/api/chats/' + encodeURIComponent(chatId) + '/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) }); }catch(e){ console.warn('Failed to post message', e); } }

      async function renderChatList(){
        if (!chatListEl) return;
        chatListEl.innerHTML = '';
        const header = document.createElement('div'); header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center'; header.style.marginBottom = '8px';
        const title = document.createElement('strong'); title.textContent = 'Unterhaltungen'; header.appendChild(title); chatListEl.appendChild(header);
        if (!state.chats || state.chats.length === 0){ const p = document.createElement('div'); p.textContent = 'Keine Chats vorhanden.'; p.style.color='#666'; p.style.padding='8px'; chatListEl.appendChild(p); return; }
        state.chats.forEach(chat => { const chatId = chat.chatId || chat.id; const item = document.createElement('div'); item.className = 'chat-item'; if (state.selected === chatId) item.classList.add('active'); const t = document.createElement('div'); t.textContent = chat.title || (chat.participantsDisplay && chat.participantsDisplay.join(', ')) || chatId; t.style.fontWeight='600'; const meta = document.createElement('div'); meta.className='meta'; meta.textContent = (chat.messageCount != null) ? `${chat.messageCount} Nachrichten` : ''; item.appendChild(t); item.appendChild(meta); item.onclick = async ()=>{ state.selected = chatId; await renderMessages(); renderChatList(); }; chatListEl.appendChild(item); });
      }
      async function renderMessages(){ if (!chatMessagesEl) return; chatMessagesEl.innerHTML = ''; if (!state.selected){ const p = document.createElement('div'); p.textContent = 'Wähle eine Unterhaltung aus.'; p.style.padding='10px'; p.style.color='#666'; chatMessagesEl.appendChild(p); return; } const msgs = await loadChatMessages(state.selected); if (!msgs || msgs.length === 0){ const p = document.createElement('div'); p.textContent = 'Keine Nachrichten in dieser Unterhaltung.'; p.style.padding='10px'; p.style.color='#666'; chatMessagesEl.appendChild(p); return; } msgs.forEach(msg => { const sender = msg.sender || ''; const isOutgoing = sender && currentUser && sender === currentUser; const m = document.createElement('div'); m.className='message ' + (isOutgoing ? 'outgoing' : 'incoming'); m.textContent = msg.text; chatMessagesEl.appendChild(m); }); setTimeout(()=>{ chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; }, 40); }

      function openPanel(){ panel.classList.add('open'); panel.style.display='block'; panel.setAttribute('aria-hidden','false'); refreshAll(); }
      function closePanel(){ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); setTimeout(()=>{ if (!panel.classList.contains('open')) panel.style.display='none'; }, 260); }

      async function sendCurrentMessage(){ const txt = chatInput && chatInput.value && chatInput.value.trim(); if (!txt) return; if (!state.selected){ alert('Bitte zuerst eine Unterhaltung auswählen.'); return; } const sender = currentUser || 'anonymous'; const msg = { sender: sender, text: txt, ts: Date.now() }; const div = document.createElement('div'); div.className='message outgoing'; div.textContent = msg.text; chatMessagesEl.appendChild(div); if (chatInput) chatInput.value=''; chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight; await postMessageToServer(state.selected, msg); await refreshAll(); }

      if (btn) btn.addEventListener('click', ()=>{ if (panel.classList.contains('open')) closePanel(); else openPanel(); });
      if (closeBtn) closeBtn.addEventListener('click', closePanel);
      document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && panel.classList.contains('open')) closePanel(); });
      if (chatSend) chatSend.addEventListener('click', ()=>{ sendCurrentMessage(); });
      if (chatInput) chatInput.addEventListener('keydown', (e)=>{ if (e.key==='Enter'){ e.preventDefault(); sendCurrentMessage(); } });

      // create search UI after initial user fetch so we can pre-populate if needed
      initUser().then(()=>{ loadChatList().then(()=>renderChatList()).catch(()=>{}); createSearchUI(); }).catch(()=>{});

      // expose API for other scripts
      window.__dn_messages_ready = true;
      window.__dn_messages_api = window.__dn_messages_api || {};
      window.__dn_messages_api.openChat = async function(chatId, title){ if (!currentUser) await initUser(); if (chatId) state.selected = chatId; if (!chatId && title){ const me = currentUser || prompt('Dein Benutzername (wird nicht geteilt):'); if (!me) return; try{ const res = await fetch('/api/chats/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ me, other: title }) }); const j = await res.json(); state.selected = j.chatId; }catch(e){ console.warn('Failed to start chat', e); return; } } openPanel(); };
    })();
    // end initializeMessages closure
  }

})();
