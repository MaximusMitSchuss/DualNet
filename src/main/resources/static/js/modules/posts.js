import { api, escapeHtml } from './util.js';

/**
 * Load posts from the server API.
 * @returns {Promise<Array>} array of post objects
 */
export async function loadPosts() {
  const res = await api('/api/posts');
  if (!res.ok) return [];
  return res.json();
}

/**
 * Send a new post to the server. Server requires an authenticated session.
 * @param {string} content
 * @param {File|null} imageFile - optional image file to upload
 * @returns {Promise<object>} created post object
 */
export async function sendPost(content, imageFile = null) {
  if (imageFile) {
    // Use FormData for multipart upload
    const formData = new FormData();
    formData.append('content', content || '');
    formData.append('image', imageFile);
    
    const res = await fetch('/api/posts', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) throw await res.json();
    return res.json();
  } else {
    // Original JSON API call
    const res = await api('/api/posts', { method: 'POST', body: { content } });
    if (!res.ok) throw await res.json();
    return res.json();
  }
}

/**
 * Add a comment to a post.
 * @param {number|string} postId
 * @param {string} text
 * @returns {Promise<object>} created comment
 */
export async function addComment(postId, text, parentId = null) {
  const body = parentId ? { text, parentId } : { text };
  const res = await api(`/api/posts/${postId}/comments`, { method: 'POST', body });
  if (!res.ok) throw await res.json();
  return res.json();
}

/**
 * Toggle like for a post by id.
 * @param {number} postId
 * @returns {Promise<number>} current likes count
 */
export async function toggleLike(postId) {
  const res = await api(`/api/posts/${postId}/like`, { method: 'POST' });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  // backend expected to return likes count or likes array; normalize to number if possible
  if (typeof data === 'number') return data;
  if (data && Array.isArray(data.likes)) return data.likes.length;
  if (data && typeof data.likes === 'number') return data.likes;
  if (data && data.likes) return data.likes;
  return 0;
}

export async function deletePost(postId) {
  const res = await api(`/api/posts/${postId}`, { method: 'DELETE' });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteComment(postId, commentId) {
  const res = await api(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
  if (!res.ok) throw await res.json();
  return res.json();
}

// helper: build tree of comments from flat list (assumes each comment has id and parentId)
function buildCommentTree(comments) {
  const byId = new Map();
  const roots = [];
  comments.forEach(c => { byId.set(c.id, { ...c, children: [] }); });
  byId.forEach((c) => {
    if (c.parentId) {
      const p = byId.get(c.parentId);
      if (p) p.children.push(c);
      else roots.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

// recursive renderer for comments tree
function renderCommentsTree(comments, currentUser, postOwner) {
  return comments.map(c => {
    const canDelete = Boolean(currentUser && (currentUser === c.authorUsername || currentUser === postOwner));
    return `\n    <div class="comment" data-cid="${c.id}">\n      <div class="comment-head"><strong>${escapeHtml(c.authorUsername)}</strong> <time class="comment-time">${c.createdAt ? escapeHtml(new Date(c.createdAt).toLocaleString()) : ''}</time></div>\n      <div class="comment-body">${escapeHtml(c.text)}</div>\n      <div class="comment-actions"><button class="comment-reply" data-author="${escapeHtml(c.authorUsername)}" data-cid="${c.id}" title="Antworten"><span class="msg">💬</span></button>${canDelete ? ' <button class="btn-delete comment-delete" type="button">L\u00f6schen</button>' : ''}</div>\n      ${c.children && c.children.length ? `<div class="replies">${renderCommentsTree(c.children, currentUser, postOwner)}</div>` : ''}\n    </div>`;
  }).join('\n');
}

/**
 * Create HTML for a single post, including like and comment controls.
 * @param {object} p
 */
function renderPostHtml(p) {
  const author = (p.author && p.author.displayName) ? p.author.displayName : (p.author && p.author.username) ? p.author.username : 'Anonym';
  const created = p.createdAt ? new Date(p.createdAt).toLocaleString() : '';
  const likeCount = p.likes ? (Array.isArray(p.likes) ? p.likes.length : p.likes) : 0;
  const likedByMe = (Array.isArray(p.likes) && window.currentUser) ? p.likes.includes(window.currentUser) : false;
  const comments = p.comments || [];
  const postOwner = (p.author && p.author.username) ? p.author.username : null;
  const canDeletePost = Boolean(window.currentUser && postOwner && window.currentUser === postOwner);
  const imageHtml = p.imageUrl ? `<div class="post-image"><img src="${escapeHtml(p.imageUrl)}" alt="Post image" /></div>` : '';

  const tree = buildCommentTree(comments);
  const commentsHtml = renderCommentsTree(tree, window.currentUser, postOwner);

  return `\n  <article class="post" data-id="${p.id}" data-author="${postOwner ? escapeHtml(postOwner) : ''}">\n    <header><strong>${escapeHtml(author)}</strong> <time>${escapeHtml(created)}</time></header>\n    <p>${escapeHtml(p.content)}</p>\n    ${imageHtml}\n    <div class="post-actions">\n      <button class="btn-like ${likedByMe ? 'liked' : ''}" aria-pressed="${likedByMe ? 'true' : 'false'}">\n        <span class="heart">♥</span>\n        <span class="like-count">${likeCount}</span>\n      </button>\n      <button class="btn-comment" title="Kommentar"><span class="msg">💬</span></button>
      ${canDeletePost ? '<button class="btn-delete btn-delete-post" type="button">🗑️</button>' : ''}
    </div>\n    <div class="new-comment-placeholder"></div>\n    <div class="comments">${commentsHtml}</div>\n  </article>`;
}

/**
 * Render a list of posts into the container element.
 * @param {Array} postsArr
 * @param {Element} container
 */
export function renderPosts(postsArr, container) {
  if (!postsArr || postsArr.length === 0) {
    container.innerHTML = '<div>Keine Beitr\u00e4ge</div>';
    return;
  }
  container.innerHTML = postsArr.map(p => renderPostHtml(p)).join('\n');

  // Attach event listeners for like/comment buttons and comment replies
  container.querySelectorAll('.post').forEach(el => {
    const id = el.getAttribute('data-id');
    const postOwner = el.getAttribute('data-author') || '';
    const likeBtn = el.querySelector('.btn-like');
    const commentBtn = el.querySelector('.btn-comment');
    const commentsDiv = el.querySelector('.comments');
    const placeholder = el.querySelector('.new-comment-placeholder');
    const deletePostBtn = el.querySelector('.btn-delete-post');

    if (likeBtn) {
      likeBtn.addEventListener('click', async () => {
        try {
          const wasLiked = likeBtn.classList.contains('liked');
          if (wasLiked) {
            likeBtn.classList.remove('liked');
            likeBtn.setAttribute('aria-pressed', 'false');
          } else {
            likeBtn.classList.add('liked');
            likeBtn.setAttribute('aria-pressed', 'true');
          }

          const likes = await toggleLike(id);
          const countEl = likeBtn.querySelector('.like-count');
          if (countEl) countEl.textContent = likes;
        } catch (err) {
          if (likeBtn.classList.contains('liked')) {
            likeBtn.classList.remove('liked');
            likeBtn.setAttribute('aria-pressed', 'false');
          } else {
            likeBtn.classList.add('liked');
            likeBtn.setAttribute('aria-pressed', 'true');
          }
          alert('Like fehlgeschlagen');
        }
      });
    }

    if (deletePostBtn) {
      deletePostBtn.addEventListener('click', async () => {
        if (!confirm('Beitrag wirklich l\u00f6schen?')) return;
        deletePostBtn.disabled = true;
        try {
          await deletePost(id);
          el.remove();
        } catch (err) {
          deletePostBtn.disabled = false;
          alert('Beitrag konnte nicht gel\u00f6scht werden');
        }
      });
    }

    // Post-level comment button: toggle an inline new-comment form under the post
    if (commentBtn && placeholder) {
      commentBtn.addEventListener('click', () => {
        // if a form is already open in placeholder, focus textarea instead
        if (placeholder.querySelector('.new-comment')) {
          placeholder.querySelector('textarea').focus();
          return;
        }
        const node = document.createElement('div');
        node.className = 'new-comment';
        node.innerHTML = `\n          <textarea placeholder="Kommentar schreiben..." rows="3"></textarea>\n          <div class="modal-actions">\n            <button class="btn-post-send">Posten</button>\n            <button class="btn-post-cancel">Abbrechen</button>\n          </div>`;
        placeholder.appendChild(node);

        const ta = node.querySelector('textarea');
        const send = node.querySelector('.btn-post-send');
        const cancel = node.querySelector('.btn-post-cancel');
        ta.focus();

        send.addEventListener('click', async () => {
          const text = ta.value;
          if (!text || !text.trim()) return;
          try {
            const c = await addComment(id, text);
            // append to comments
            const newEl = createCommentElement(c, postOwner);
            commentsDiv.appendChild(newEl);
            // wire reply handler for the newly added comment
            attachReplyHandlerToElement(newEl, id, commentsDiv, postOwner);
            attachDeleteHandlerToComment(newEl, id);
            node.remove();
          } catch (e) {
            alert('Kommentar konnte nicht hinzugef\u00fcgt werden');
          }
        });
        cancel.addEventListener('click', () => node.remove());
      });
    }

    // per-comment reply handling is attached via attachReplyHandlerToElement
  });

  // After rendering, attach reply handlers to existing comments
  container.querySelectorAll('.post').forEach(el => {
    const postId = el.getAttribute('data-id');
    const postOwner = el.getAttribute('data-author') || '';
    const commentsDiv = el.querySelector('.comments');
    if (!commentsDiv) return;
    commentsDiv.querySelectorAll('.comment').forEach(cEl => {
      attachReplyHandlerToElement(cEl, postId, commentsDiv, postOwner);
      attachDeleteHandlerToComment(cEl, postId);
    });
  });
}

// helper: create a DOM element for a comment object (returned by server)
function createCommentElement(c, postOwner, currentUser = window.currentUser) {
  const div = document.createElement('div');
  div.className = 'comment';
  div.setAttribute('data-cid', c.id);
  const time = c.createdAt ? new Date(c.createdAt).toLocaleString() : '';
  const canDelete = Boolean(currentUser && (currentUser === c.authorUsername || currentUser === postOwner));
  div.innerHTML = `
    <div class="comment-head"><strong>${escapeHtml(c.authorUsername)}</strong> <time class="comment-time">${escapeHtml(time)}</time></div>
    <div class="comment-body">${escapeHtml(c.text)}</div>
    <div class="comment-actions"><button class="comment-reply" data-author="${escapeHtml(c.authorUsername)}" data-cid="${c.id}" title="Antworten"><span class="msg">💬</span></button>${canDelete ? ' <button class="btn-delete comment-delete" type="button">🗑️</button>' : ''}</div>
  `;
  return div;
}

// attach reply handler to a single comment element (for dynamically created comments)
function attachReplyHandlerToElement(commentEl, postId, commentsDiv, postOwner) {
  const replyBtn = commentEl.querySelector('.comment-reply');
  if (!replyBtn) return;
  replyBtn.addEventListener('click', () => {
    // prevent multiple reply forms under the same comment
    if (commentEl.querySelector('.reply-form')) {
      commentEl.querySelector('textarea').focus();
      return;
    }
    const author = replyBtn.getAttribute('data-author') || '';
    const form = document.createElement('div');
    form.className = 'reply-form';
    form.innerHTML = `\n          <textarea rows="2">@${escapeHtml(author)} </textarea>\n          <div class="modal-actions">\n            <button class="btn-reply-send">Antworten</button>\n            <button class="btn-reply-cancel">Abbrechen</button>\n          </div>`;
    commentEl.appendChild(form);
    const ta = form.querySelector('textarea');
    const send = form.querySelector('.btn-reply-send');
    const cancel = form.querySelector('.btn-reply-cancel');
    ta.focus();

    send.addEventListener('click', async () => {
      const text = ta.value;
      if (!text || !text.trim()) return;
      try {
        const parentId = Number(replyBtn.getAttribute('data-cid')) || null;
        const c = await addComment(postId, text, parentId);
        const newEl = createCommentElement(c, postOwner);
        // find parent element and its replies container
        const parentElem = commentsDiv.querySelector(`.comment[data-cid="${parentId}"]`);
        if (parentElem) {
          let replies = parentElem.querySelector('.replies');
          if (!replies) {
            replies = document.createElement('div');
            replies.className = 'replies';
            parentElem.appendChild(replies);
          }
          replies.appendChild(newEl);
        } else {
          // fallback: append to root
          commentsDiv.appendChild(newEl);
        }
        // ensure the newly added comment has its reply handler wired
        attachReplyHandlerToElement(newEl, postId, commentsDiv, postOwner);
        attachDeleteHandlerToComment(newEl, postId);
        form.remove();
      } catch (e) {
        alert('Antwort konnte nicht hinzugef\u00fcgt werden');
      }
    });

    cancel.addEventListener('click', () => form.remove());
  });
}

function attachDeleteHandlerToComment(commentEl, postId) {
  const deleteBtn = commentEl.querySelector('.comment-delete');
  if (!deleteBtn) return;
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('Kommentar wirklich l\u00f6schen?')) return;
    deleteBtn.disabled = true;
    try {
      const commentId = commentEl.getAttribute('data-cid');
      await deleteComment(postId, commentId);
      commentEl.remove();
    } catch (err) {
      deleteBtn.disabled = false;
      alert('Kommentar konnte nicht gel\u00f6scht werden');
    }
  });
}
