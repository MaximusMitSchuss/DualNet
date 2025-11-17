// Top-level app bootstrap; now uses ES modules in /modules
import { qs } from './modules/util.js';
import * as ui from './modules/ui.js';
import * as posts from './modules/posts.js';
import * as auth from './modules/auth.js';
import { mountNavbar, renderUserArea } from './modules/navbar.js';
import * as messages from './modules/messages.js';

/**
 * Initialize the client application: determine session, render UI and load posts.
 */
async function init() {
  // mount navbar with some example links
  mountNavbar([{ href: '/', label: 'Home' }]);

  // check session on server
  let me = await auth.getMe();
  const username = me && me.authenticated ? me.username : null;

  // expose current user globally for modules that need it (posts like state)
  window.currentUser = username;

  renderUserArea(username);
  ui.renderAuthArea(username);

  // ensure messages panel is available (but hidden) so navbar can open it quickly
  await messages.ensureMounted();

  async function refreshPosts() {
    const list = qs('#posts-list');
    const data = await posts.loadPosts();
    posts.renderPosts(data, list);
  }

  ui.attachEventListeners((u) => {
    // setCurrentUser callback
    window.currentUser = u;
    renderUserArea(u);
    ui.renderAuthArea(u);
  }, refreshPosts);

  // modal close buttons
  document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => {
    document.body.classList.remove('show-login');
    document.body.classList.remove('show-register');
    document.body.classList.remove('show-post');
    // Clear image upload when closing post modal
    if (window._clearImageUpload) window._clearImageUpload();
  }));

  // wire navbar buttons (open modals)
  document.body.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.id === 'nav-login') document.body.classList.add('show-login');
    if (t && t.id === 'nav-register') document.body.classList.add('show-register');
    if (t && t.id === 'nav-newpost') document.body.classList.add('show-post');
  });

  // also close messages panel when user logs out or when pressing escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') messages.closePanel();
  });

  await refreshPosts();
}

// Run init after DOM content is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
