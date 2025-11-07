import { qs } from './util.js';
import * as auth from './auth.js';
import * as posts from './posts.js';

/**
 * Render the authentication area in the header according to currentUser.
 * Also toggle visibility of registration and new-post UI elements.
 * @param {string|null} currentUser
 */
export function renderAuthArea(currentUser) {
  const area = qs('#auth-area');
  if (!area) return;
  const newPostSection = qs('#new-post');
  const registerAside = qs('#register');

  if (currentUser) {
    // Wenn ein Benutzer angemeldet ist, zeige den Logout-Button und das Post-Formular
    area.innerHTML = `<div>Angemeldet als <strong>${currentUser}</strong> <button id="btn-logout">Logout</button></div>`;
    if (newPostSection) newPostSection.style.display = 'block';
    if (registerAside) registerAside.style.display = 'none';

    const logoutBtn = qs('#btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
      // Logout auf dem Server ausführen und Seite neu laden
      await auth.logout();
      window.location.reload();
    });
  } else {
    // Kein angemeldeter Benutzer: zeige Registrierungs- und Login-Bereich
    area.innerHTML = `<div>Nicht angemeldet</div>`;
    if (newPostSection) newPostSection.style.display = 'none';
    if (registerAside) registerAside.style.display = 'block';
  }
}

/**
 * Attach event listeners for the register/login forms and for posting.
 * This wires the DOM elements to the API via the auth/posts modules.
 */
export function attachEventListeners(setCurrentUser, refreshPosts) {
  const regSend = qs('#reg-send');
  const loginSend = qs('#login-send');
  const postSend = qs('#post-send');
  const postTextarea = qs('#post-content');

  // helper to update post-send enabled state
  function updatePostButtonState() {
    if (!postSend || !postTextarea) return;
    const ok = postTextarea.value && postTextarea.value.trim().length > 0;
    postSend.disabled = !ok;
  }

  if (regSend) {
    regSend.addEventListener('click', async () => {
      try {
        const payload = {
          username: qs('#reg-username').value,
          displayName: qs('#reg-displayname').value,
          email: qs('#reg-email').value,
          password: qs('#reg-password').value
        };
        const data = await auth.register(payload);
        setCurrentUser(data.username);
        // close the register modal
        document.body.classList.remove('show-register');
        await refreshPosts();
      } catch (err) {
        alert('Registrierung fehlgeschlagen: ' + (err.error || JSON.stringify(err)));
      }
    });
  }

  if (loginSend) {
    loginSend.addEventListener('click', async () => {
      try {
        const creds = { username: qs('#login-username').value, password: qs('#login-password').value };
        const data = await auth.login(creds);
        setCurrentUser(data.username);
        // close login modal
        document.body.classList.remove('show-login');
        await refreshPosts();
      } catch (err) {
        alert('Login fehlgeschlagen');
      }
    });
  }

  if (postTextarea) {
    postTextarea.addEventListener('input', updatePostButtonState);
    // set initial state
    updatePostButtonState();
  }

  if (postSend) {
    postSend.addEventListener('click', async () => {
      try {
        const content = qs('#post-content').value;
        if (!content || content.trim().length === 0) return; // guard
        await posts.sendPost(content);
        qs('#post-content').value = '';
        // close post modal
        document.body.classList.remove('show-post');
        await refreshPosts();
      } catch (err) {
        alert('Fehler beim Posten: ' + (err.error || JSON.stringify(err)));
      }
    });
  }
}
