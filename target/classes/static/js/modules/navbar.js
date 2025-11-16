import { qs } from './util.js';
import * as auth from './auth.js';
import * as messages from './messages.js';

/**
 * Create a reusable navbar component and mount it into #navbar-container.
 * The navbar exposes a slot for additional nav items via optional links array.
 * @param {Array<{href:string, label:string}>} links
 */
export function mountNavbar(links = []) {
  const container = qs('#navbar-container');
  if (!container) return;
  container.innerHTML = `
    <nav class="navbar">
      <div class="nav-left">
        <a class="brand" href="/">SimpleSocial</a>
        ${links.map(l => `<a class="nav-link" href="${l.href}">${l.label}</a>`).join('')}
      </div>
      <div class="nav-right" id="nav-user-area">...</div>
    </nav>`;
}

/**
 * Render user area within navbar (login/register or user name + logout)
 * @param {string|null} username
 */
export function renderUserArea(username) {
  const area = qs('#nav-user-area');
  if (!area) return;
  if (username) {
    area.innerHTML = `<span>Hallo, <strong>${username}</strong></span> <button id="nav-logout">Logout</button> <button id="nav-newpost" title="Neuer Beitrag">+</button> <button id="nav-messages" title="Nachrichten">✉</button>`;
    const btn = qs('#nav-logout');
    if (btn) btn.addEventListener('click', async () => {
      await auth.logout();
      window.location.reload();
    });
    // newpost button will be handled by app.js click listener (it listens on body)
    const msgBtn = qs('#nav-messages');
    if (msgBtn) {
      msgBtn.addEventListener('click', async () => {
        await messages.ensureMounted();
        messages.openPanel();
      });
    }
  } else {
    area.innerHTML = `<button id="nav-login">Login</button> <button id="nav-register">Register</button>`;
    const l = qs('#nav-login');
    const r = qs('#nav-register');
    if (l) l.addEventListener('click', () => qs('body').classList.add('show-login'));
    if (r) r.addEventListener('click', () => qs('body').classList.add('show-register'));
  }
}
