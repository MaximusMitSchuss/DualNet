(function(){
  // Server-backed chat manager using the REST API under /api
  const btn = document.getElementById('messages-btn');
  const panel = document.getElementById('messages-panel');
  const closeBtn = document.getElementById('messages-close');
  const chatListEl = document.getElementById('chat-list');
  const chatMessagesEl = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');

  if (!btn || !panel) return; // nothing to do

  let state = { chats: [], selected: null };
  let currentUser = '';

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

  // expose an API to open a chat from other pages
  window.DualNetChat = window.DualNetChat || {};
  window.DualNetChat.openChat = async function(chatId, title){
    if (!currentUser) {
      await initUser();
    }
    if (chatId) {
      state.selected = chatId;
    }
    // if chatId not provided but title provided, try to start via server
    if (!chatId && title) {
      const me = currentUser || prompt('Dein Benutzername (wird nicht geteilt):');
      if (!me) return;
      try{
        const res = await fetch('/api/chats/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ me, other: title }) });
        const j = await res.json(); state.selected = j.chatId;
      }catch(e){ console.warn('Failed to start chat', e); return; }
    }
    openPanel();
  };

  // initial load (but do not open panel)
  initUser().then(()=>{ loadChatList().then(()=>renderChatList()).catch(()=>{}); }).catch(()=>{});
})();
