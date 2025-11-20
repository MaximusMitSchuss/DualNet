import { qs, api, escapeHtml } from './util.js';

/**
 * Client-side messages module: open/close panel, load inbox/conversation, send messages
 */
export function mountMessagesPanel() {
  // inject panel HTML into body if not present
  if (qs('#messages-panel')) return;
  const node = document.createElement('div');
  node.id = 'messages-panel';
  node.className = 'messages-panel';
  node.innerHTML = `
    <div class="mp-overlay" data-close></div>
    <div class="mp-content">
      <header class="mp-header">
        <h3>Nachrichten</h3>
        <button id="mp-close" aria-label="Schließen">✕</button>
      </header>
      <div class="mp-body">
        <aside class="mp-list">
          <div class="mp-search-wrap">
            <input id="mp-search" placeholder="Benutzer suchen..." />
            <div id="mp-suggestions" class="mp-suggestions"></div>
          </div>
          <div id="mp-inbox">Lade...</div>
        </aside>
        <section class="mp-conv">
          <div id="mp-empty">Wähle eine Konversation oder suche einen Benutzer</div>
          <div id="mp-chat" style="display:none">
            <div id="mp-messages" class="mp-messages"></div>
            <div class="mp-send">
              <!-- non_editable recipient label: shows who the message will be sent to -->
              <div id="mp-to" class="mp-to" role="status" aria-live="polite" data-username="" tabindex="-1"></div>
              <textarea id="mp-input" rows="2" placeholder="Nachricht schreiben..."></textarea>
              <div class="modal-actions"><button id="mp-send-btn">Senden</button></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
  document.body.appendChild(node);

  // close handlers
  node.querySelector('[data-close]').addEventListener('click', () => closePanel());
  qs('#mp-close').addEventListener('click', () => closePanel());

  // send
  qs('#mp-send-btn').addEventListener('click', async () => {
    const to = qs('#mp-to') ? (qs('#mp-to').getAttribute('data-username') || '').trim() : '';
    const txt = qs('#mp-input').value && qs('#mp-input').value.trim();
    if (!to) return alert('Empfänger erforderlich');
    if (!txt) return alert('Nachricht darf nicht leer sein');
    try {
      const res = await api('/api/messages', { method: 'POST', body: { recipient: to, content: txt } });
      if (!res.ok) throw await res.json();
      const msg = await res.json();
      // append to messages
      appendMessage(msg, true);
      qs('#mp-input').value = '';
      // refresh inbox
      await loadInbox();
    } catch (e) {
      alert('Nachricht konnte nicht gesendet werden: ' + (e.error || JSON.stringify(e)));
    }
  });

  // click on inbox items
  node.addEventListener('click', async (ev) => {
    const el = ev.target.closest('.mp-item');
    if (!el) return;
    const other = el.getAttribute('data-user');
    if (!other) return;
    await openConversation(other);
  });

  // Search / suggestions wiring
  const searchInput = qs('#mp-search');
  const suggestionsBox = qs('#mp-suggestions');
  let searchTimer = null;
  let activeIndex = -1; // for keyboard navigation

  function debounceSearch(fn, wait = 300) {
    return (...args) => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => fn(...args), wait);
    };
  }

  async function doSearch(q) {
    if (!suggestionsBox) return;
    const qtrim = q ? q.trim() : '';
    try {
      const path = `/api/users?q=${encodeURIComponent(qtrim)}`;
      const res = await api(path);
      if (!res.ok) {
        if (res.status === 401) {
          suggestionsBox.innerHTML = '<div class="mp-suggestion-empty">Bitte einloggen</div>';
          return;
        }
        const err = await res.json().catch(() => ({}));
        const msg = err && err.error ? escapeHtml(err.error) : 'Fehler beim Laden';
        suggestionsBox.innerHTML = `<div class="mp-suggestion-empty">${msg}</div>`;
        return;
      }
      const users = await res.json();
      renderSuggestions(users || []);
    } catch (e) {
      console.error('user search error', e);
      suggestionsBox.innerHTML = '<div class="mp-suggestion-empty">Fehler beim Suchen</div>';
    }
  }

  const debouncedSearch = debounceSearch(doSearch, 250);

  if (searchInput) {
    searchInput.addEventListener('input', (ev) => {
      const v = ev.target.value || '';
      if (!v.trim()) {
        // show top users (empty query) or clear suggestions
        debouncedSearch('');
        return;
      }
      debouncedSearch(v);
    });

    // on focus, trigger search with current value to show suggestions
    searchInput.addEventListener('focus', () => debouncedSearch(searchInput.value || ''));

    // keyboard navigation
    searchInput.addEventListener('keydown', (ev) => {
      if (!suggestionsBox) return;
      const items = Array.from(suggestionsBox.querySelectorAll('.mp-suggestion'));
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        activeIndex = Math.min(items.length - 1, activeIndex + 1);
        updateActive(items);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        activeIndex = Math.max(0, activeIndex - 1);
        updateActive(items);
      } else if (ev.key === 'Enter') {
        if (activeIndex >= 0 && items[activeIndex]) {
          ev.preventDefault();
          selectSuggestion(items[activeIndex].getAttribute('data-user'));
        }
      } else if (ev.key === 'Escape') {
        suggestionsBox.innerHTML = '';
      }
    });
  }

  function updateActive(items) {
    items.forEach((it, i) => it.classList.toggle('mp-suggestion-active', i === activeIndex));
    if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function renderSuggestions(list) {
    if (!suggestionsBox) return;
    // exclude current user from suggestions
    const filtered = (list || []).filter(u => !(window.currentUser && u.username === window.currentUser));
    const shown = filtered.slice(0, 8);
    if (!shown || shown.length === 0) {
      suggestionsBox.innerHTML = '<div class="mp-suggestion-empty">Keine Ergebnisse</div>';
      activeIndex = -1;
      return;
    }
    suggestionsBox.innerHTML = shown.map((u, idx) => {
      const disp = u.displayName ? `${escapeHtml(u.displayName)} \u2014 ${escapeHtml(u.username)}` : escapeHtml(u.username);
      return `<div class="mp-suggestion" data-user="${escapeHtml(u.username)}" data-idx="${idx}">${disp}</div>`;
    }).join('\n');
    activeIndex = -1;
  }

  // click on suggestion (guarded)
  if (suggestionsBox) {
    suggestionsBox.addEventListener('click', (ev) => {
      const el = ev.target.closest('.mp-suggestion');
      if (!el) return;
      const username = el.getAttribute('data-user');
      if (!username) return;
      selectSuggestion(username);
    });
  }

  // hide suggestions when clicking outside
  document.addEventListener('click', (ev) => {
    const target = ev.target;
    if (!suggestionsBox || !searchInput) return;
    if (target === searchInput || suggestionsBox.contains(target)) return;
    suggestionsBox.innerHTML = '';
    activeIndex = -1;
  });

  function selectSuggestion(username) {
    const toEl = qs('#mp-to');
    if (toEl) {
      toEl.setAttribute('data-username', username);
      // show readable text for the recipient (non-editable)
      toEl.textContent = username;
    }
    // also fill search input for clarity
    if (searchInput) searchInput.value = '';
    // clear suggestions
    if (suggestionsBox) suggestionsBox.innerHTML = '';
    activeIndex = -1;
    // open conversation
    openConversation(username).then(() => {
      // focus message input
      const input = qs('#mp-input'); if (input) input.focus();
    }).catch((e) => { console.error('openConversation failed', e); });
  }
}

export function openPanel() {
  const n = qs('#messages-panel');
  if (!n) return;
  n.classList.add('open');
  // focus search input when opening
  setTimeout(() => { const s = qs('#mp-search'); if (s) s.focus(); }, 120);
  loadInbox();
}

export function closePanel() {
  const n = qs('#messages-panel');
  if (!n) return;
  n.classList.remove('open');
  // clear selected recipient when closing
  const toEl = qs('#mp-to');
  if (toEl) { toEl.removeAttribute('data-username'); toEl.textContent = ''; }
}

async function loadInbox() {
  const inboxEl = qs('#mp-inbox');
  if (!inboxEl) return;
  inboxEl.innerHTML = 'Lade...';
  try {
    const res = await api('/api/messages');
    if (!res.ok) throw await res.json();
    const items = await res.json();
    if (!items || items.length === 0) {
      inboxEl.innerHTML = '<div class="mp-empty-list">Keine Nachrichten</div>';
      return;
    }
    // render items: show counterpart and last message snippet
    inboxEl.innerHTML = items.map(m => {
      const other = m.sender && m.sender.username ? m.sender.username : (m.recipient && m.recipient.username ? m.recipient.username : 'unbekannt');
      const counterpart = (m.sender && window.currentUser === m.sender.username) ? m.recipient.username : m.sender.username;
      const unread = m.unread && m.recipient && m.recipient.username === window.currentUser ? 'mp-unread' : '';
      return `<div class="mp-item ${unread}" data-user="${escapeHtml(counterpart)}"><strong>${escapeHtml(counterpart)}</strong><div class="mp-snippet">${escapeHtml(m.content ? m.content.slice(0, 60) : '')}</div></div>`;
    }).join('\n');
  } catch (e) {
    inboxEl.innerHTML = '<div class="mp-empty-list">Fehler beim Laden</div>';
  }
}

async function openConversation(withUser) {
  qs('#mp-empty').style.display = 'none';
  qs('#mp-chat').style.display = 'block';
  const toEl = qs('#mp-to');
  if (toEl) { toEl.setAttribute('data-username', withUser); toEl.textContent = withUser; }
  const messagesEl = qs('#mp-messages');
  messagesEl.innerHTML = 'Lade...';
  try {
    const res = await api(`/api/messages/${encodeURIComponent(withUser)}`);
    if (!res.ok) throw await res.json();
    const conv = await res.json();
    messagesEl.innerHTML = '';
    conv.forEach(m => appendMessage(m, m.sender && m.sender.username === window.currentUser));
  } catch (e) {
    messagesEl.innerHTML = '<div>Konversation konnte nicht geladen werden</div>';
    console.error('openConversation error', e);
  }
}

function appendMessage(m, mine) {
  const messagesEl = qs('#mp-messages');
  if (!messagesEl) return;
  const wrap = document.createElement('div');
  wrap.className = 'mp-msg ' + (mine ? 'mp-mine' : 'mp-their');
  const who = mine ? 'Du' : (m.sender && m.sender.username ? escapeHtml(m.sender.username) : 'unbekannt');
  const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : '';
  wrap.innerHTML = `<div class="mp-msg-head"><strong>${who}</strong> <time>${escapeHtml(time)}</time></div><div class="mp-msg-body">${escapeHtml(m.content)}</div>`;
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

export async function ensureMounted() {
  if (!qs('#messages-panel')) mountMessagesPanel();
}
