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
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      navRight.appendChild(btn);
    } else {
      // ensure it's inside navRight
      if (btn.parentElement && btn.parentElement.id !== 'nav-right') {
        navRight.appendChild(btn);
      }
    }
  }

  function showLoggedIn(username){
    const auth = document.getElementById('auth-links');
    if (!auth) return;
    // create or update a visible user-field
    let span = document.getElementById('logged-user');
    if (!span) {
      span = document.createElement('span');
      span.id = 'logged-user';
      span.style.color = '#ddd';
      span.style.marginRight = '8px';
      span.style.fontWeight = '600';
      auth.insertBefore(span, auth.firstChild);
    }
    span.textContent = username;

    // convert link-login into logout
    const linkLogin = document.getElementById('link-login');
    if (linkLogin) {
      linkLogin.href = '/logout';
      linkLogin.textContent = 'Abmelden';
      linkLogin.style.color = '#ddd';
      linkLogin.style.textDecoration = 'none';
      // make it look like a button
      linkLogin.style.padding = '6px 8px';
      linkLogin.style.borderRadius = '6px';
      linkLogin.style.background = 'transparent';
      linkLogin.style.border = '1px solid transparent';
      linkLogin.style.cursor = 'pointer';
    }

    // hide any separate register/logout anchors if present
    const linkRegister = document.getElementById('link-register'); if (linkRegister) linkRegister.style.display = 'none';
    const linkLogout = document.getElementById('link-logout'); if (linkLogout) linkLogout.style.display = 'none';
  }

  function showLoggedOut(){
    const auth = document.getElementById('auth-links');
    if (!auth) return;
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

  // initialize
  (async function init(){
    // wait a tick in case navbar was injected dynamically
    await new Promise(r => setTimeout(r, 60));
    ensureMessagesButton();
    const u = await whoami();
    if (u) { showLoggedIn(u); } else { showLoggedOut(); }
  })();

})();

