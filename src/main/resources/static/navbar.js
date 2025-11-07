(function(){
  // Runs after navbar.html is injected. Converts the login link to a logout button when a user is logged in
  async function whoami(){
    try{
      const r = await fetch('/api/whoami', { credentials: 'same-origin' });
      if (!r.ok) return '';
      const j = await r.json();
      return j && j.username ? j.username : '';
    }catch(e){ return ''; }
  }

  function ensureMessagesButton() {
    const navRight = document.getElementById('nav-right');
    if (!navRight) return;
    let btn = document.getElementById('messages-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'messages-btn';
      btn.setAttribute('aria-label','Nachrichten');
      btn.title = 'Nachrichten';
      btn.style.background = 'transparent'; btn.style.border = '0'; btn.style.color = '#fff'; btn.style.cursor = 'pointer'; btn.style.padding = '6px';
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      navRight.appendChild(btn);
    } else {
      if (btn.parentElement && btn.parentElement.id !== 'nav-right') {
        navRight.appendChild(btn);
      }
    }

    // ensure plus button exists
    let postBtn = document.getElementById('new-post-btn');
    if (!postBtn) {
      postBtn = document.createElement('button');
      postBtn.id = 'new-post-btn';
      postBtn.setAttribute('aria-label','Neuen Beitrag erstellen');
      postBtn.title = 'Beitrag erstellen';
      postBtn.style.background = 'transparent'; postBtn.style.border = '0'; postBtn.style.color = '#fff'; postBtn.style.cursor = 'pointer'; postBtn.style.padding = '6px'; postBtn.style.marginRight = '6px';
      postBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      navRight.insertBefore(postBtn, navRight.firstChild);
    }
  }

  function showLoggedIn(username){
    const auth = document.getElementById('auth-links');
    if (!auth) return;
    let span = document.getElementById('logged-user');
    if (!span) {
      span = document.createElement('span');
      span.id = 'logged-user';
      span.style.color = '#ddd';
      span.style.marginRight = '8px';
      span.style.fontWeight = '600';
      span.style.maxWidth = '180px';
      span.style.overflow = 'hidden';
      span.style.textOverflow = 'ellipsis';
      span.style.whiteSpace = 'nowrap';
      auth.insertBefore(span, auth.firstChild);
    }
    span.textContent = username;
    const linkLogin = document.getElementById('link-login');
    if (linkLogin) {
      linkLogin.href = '/logout';
      linkLogin.textContent = 'Abmelden';
      linkLogin.style.color = '#ddd';
      linkLogin.style.textDecoration = 'none';
      linkLogin.style.padding = '6px 8px';
      linkLogin.style.borderRadius = '6px';
      linkLogin.style.background = 'transparent';
      linkLogin.style.border = '1px solid transparent';
      linkLogin.style.cursor = 'pointer';
    }
    const linkRegister = document.getElementById('link-register'); if (linkRegister) linkRegister.style.display = 'none';
    const linkLogout = document.getElementById('link-logout'); if (linkLogout) linkLogout.style.display = 'none';
  }

  function showLoggedOut(){
    const auth = document.getElementById('auth-links'); if (!auth) return;
    const span = document.getElementById('logged-user'); if (span) span.remove();
    const linkLogin = document.getElementById('link-login');
    if (linkLogin) {
      linkLogin.href = '/login.html';
      linkLogin.textContent = 'Anmelden';
      linkLogin.style.color = '#ddd';
      linkLogin.style.textDecoration = 'none';
      linkLogin.style.padding = '';
      linkLogin.style.borderRadius = '';
      linkLogin.style.background = 'transparent';
    }
    const linkRegister = document.getElementById('link-register'); if (linkRegister) linkRegister.style.display = '';
    const linkLogout = document.getElementById('link-logout'); if (linkLogout) linkLogout.style.display = 'none';
  }

  // modal helpers
  function openNewPost(){
    let modal = document.getElementById('new-post-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'new-post-modal';
      modal.className = 'new-post-modal-overlay';
      modal.setAttribute('aria-hidden','true');
      modal.style.display = 'none';
      modal.innerHTML = '<div class="new-post-modal" role="dialog" aria-modal="true" aria-labelledby="new-post-title" style="max-width:880px;width:92%;background:#fff;border-radius:8px;padding:20px;box-shadow:0 8px 28px rgba(0,0,0,0.32);">\n        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">\n          <h2 id="new-post-title" style="margin:0;font-size:20px;">Neuen Beitrag erstellen</h2>\n          <button id="new-post-close" aria-label="Schließen" style="background:transparent;border:0;font-size:20px;cursor:pointer;">✕</button>\n        </div>\n        <form id="new-post-form">\n          <div style="display:flex;flex-direction:column;gap:8px;">\n            <input id="post-title" aria-label="Beitrag Titel" name="title" placeholder="Titel (optional)" style="padding:10px;border:1px solid #ddd;border-radius:6px;font-size:16px;" />\n            <textarea id="post-content" aria-label="Beitrag Inhalt" name="content" placeholder="Was möchtest du teilen?" rows="8" style="padding:10px;border:1px solid #ddd;border-radius:6px;font-size:15px;resize:vertical;"></textarea>\n            <div style="display:flex;justify-content:flex-end;gap:8px;">\n              <button type="button" id="new-post-cancel" style="padding:8px 12px;border-radius:6px;border:1px solid #ccc;background:transparent;cursor:pointer;">Abbrechen</button>\n              <button type="submit" id="new-post-submit" style="padding:8px 12px;border-radius:6px;background:#2b7cff;color:#fff;border:0;cursor:pointer;">Beitrag hinzufügen</button>\n            </div>\n          </div>\n        </form>\n      </div>';
      document.body.appendChild(modal);
      const closeBtn = modal.querySelector('#new-post-close'); if (closeBtn) closeBtn.addEventListener('click', closeNewPost);
      const cancelBtn = modal.querySelector('#new-post-cancel'); if (cancelBtn) cancelBtn.addEventListener('click', closeNewPost);
      const form = modal.querySelector('#new-post-form'); if (form) {
        form.addEventListener('submit', function(ev){
          ev.preventDefault();
          const title = modal.querySelector('#post-title') ? modal.querySelector('#post-title').value : '';
          const content = modal.querySelector('#post-content') ? modal.querySelector('#post-content').value : '';
          if (!content || !content.trim()){ alert('Bitte Inhalt eingeben.'); return; }
          const fbOld = document.getElementById('new-post-feedback'); if (fbOld) fbOld.remove();
          const fb = document.createElement('div'); fb.id = 'new-post-feedback'; fb.textContent = 'Beitrag bereit (lokal): ' + (title || '[kein Titel]'); fb.style.position='fixed'; fb.style.bottom='18px'; fb.style.right='18px'; fb.style.background='#222'; fb.style.color='#fff'; fb.style.padding='12px 14px'; fb.style.borderRadius='8px'; fb.style.zIndex='1200'; document.body.appendChild(fb); setTimeout(()=>{ if (fb && fb.parentElement) fb.parentElement.removeChild(fb); }, 2800);
          form.reset(); closeNewPost();
        });
      }
    }
    modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; modal.setAttribute('aria-hidden','false'); modal.style.position='fixed'; modal.style.left='0'; modal.style.top='0'; modal.style.width='100%'; modal.style.height='100%'; modal.style.background='rgba(0,0,0,0.45)'; modal.style.zIndex='1100';
    try{ const inpt = modal.querySelector('#post-content') || modal.querySelector('#post-title'); if (inpt) setTimeout(()=>inpt.focus(), 40); }catch(_){ }
  }
  function closeNewPost(){ const modal = document.getElementById('new-post-modal'); if (!modal) return; modal.style.display='none'; modal.setAttribute('aria-hidden','true'); }

  // Listen for a lightweight custom event dispatched by the inline button click
  try{
    document.addEventListener('dn-open-new-post', function(){ try{ openNewPost(); }catch(_){ } });
  }catch(_){ }

  // initialize
  (async function init(){
    await new Promise(r => setTimeout(r, 60));
    ensureMessagesButton();
    // If user clicked + before this script loaded, honor that request
    try{
      if (window.__dn_queue_open === true || (document.body && document.body.dataset && document.body.dataset.dnOpenRequested === '1')){
        try{ openNewPost(); }catch(_){ }
        try{ window.__dn_queue_open = false; if (document.body && document.body.dataset) delete document.body.dataset.dnOpenRequested; }catch(_){ }
      }
    }catch(_){ }
    const postBtn = document.getElementById('new-post-btn'); if (postBtn) postBtn.addEventListener('click', ()=>{ openNewPost(); });
    document.addEventListener('click', function(e){ const modal = document.getElementById('new-post-modal'); if (!modal) return; if (modal.getAttribute('aria-hidden') === 'true') return; const dialog = modal.querySelector('.new-post-modal'); if (!dialog) return; if (e.target === modal) closeNewPost(); });
    const close = document.getElementById('new-post-close'); if (close) close.addEventListener('click', closeNewPost);
    const cancel = document.getElementById('new-post-cancel'); if (cancel) cancel.addEventListener('click', closeNewPost);
    const form = document.getElementById('new-post-form'); if (form) {
      form.addEventListener('submit', function(ev){ ev.preventDefault(); const title = document.getElementById('post-title') ? document.getElementById('post-title').value : ''; const content = document.getElementById('post-content') ? document.getElementById('post-content').value : ''; if (!content || !content.trim()){ alert('Bitte Inhalt eingeben.'); return; } const fbOld = document.getElementById('new-post-feedback'); if (fbOld) fbOld.remove(); const fb = document.createElement('div'); fb.id = 'new-post-feedback'; fb.textContent = 'Beitrag bereit (lokal): ' + (title || '[kein Titel]'); fb.style.position='fixed'; fb.style.bottom='18px'; fb.style.right='18px'; fb.style.background='#222'; fb.style.color='#fff'; fb.style.padding='12px 14px'; fb.style.borderRadius='8px'; fb.style.zIndex='1200'; document.body.appendChild(fb); setTimeout(()=>{ if (fb && fb.parentElement) fb.parentElement.removeChild(fb); }, 2800); form.reset(); closeNewPost(); }); }
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') { const m = document.getElementById('new-post-modal'); if (m && m.getAttribute('aria-hidden') === 'false') closeNewPost(); } });
    const u = await whoami(); if (u) { showLoggedIn(u); } else { showLoggedOut(); }
  })();

  // expose API
  window.DualNetChat = window.DualNetChat || {};
  window.DualNetChat.openChat = window.DualNetChat.openChat || function(){ };
  window.DualNetOpenNewPost = window.DualNetOpenNewPost || openNewPost;

})();
