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
// Shared state for image upload
let selectedImageFile = null;

export function attachEventListeners(setCurrentUser, refreshPosts) {
  const regSend = qs('#reg-send');
  const loginSend = qs('#login-send');
  const postSend = qs('#post-send');
  const postTextarea = qs('#post-content');
  
  // Image upload elements
  const imageFileInput = qs('#image-file-input');
  const imageSelectBtn = qs('#image-select-btn');
  const imageDropZone = qs('#image-drop-zone');
  const imagePreview = qs('#image-preview');
  const imagePreviewImg = qs('#image-preview-img');
  const imageRemoveBtn = qs('#image-remove-btn');

  // helper to update post-send enabled state
  function updatePostButtonState() {
    if (!postSend || !postTextarea) return;
    const ok = (postTextarea.value && postTextarea.value.trim().length > 0) || selectedImageFile !== null;
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

  // Helper: display image preview with 4:3 crop
  function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions for 4:3 aspect ratio
        const targetRatio = 4 / 3;
        const currentRatio = img.width / img.height;
        
        let cropX = 0;
        let cropY = 0;
        let cropWidth = img.width;
        let cropHeight = img.height;
        
        if (currentRatio > targetRatio) {
          // Image is wider than 4:3, crop width
          cropWidth = img.height * targetRatio;
          cropX = (img.width - cropWidth) / 2;
        } else if (currentRatio < targetRatio) {
          // Image is taller than 4:3, crop height
          cropHeight = img.width / targetRatio;
          cropY = (img.height - cropHeight) / 2;
        }
        
        // Set canvas to 4:3 ratio (max width 800px)
        const maxWidth = 800;
        const maxHeight = 600;
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        
        // Draw cropped and resized image
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, maxWidth, maxHeight);
        
        // Convert canvas to blob and create new file
        canvas.toBlob((blob) => {
          selectedImageFile = new File([blob], file.name, { type: 'image/jpeg' });
          
          // Display preview
          if (imagePreviewImg) imagePreviewImg.src = canvas.toDataURL('image/jpeg');
          if (imageDropZone) imageDropZone.style.display = 'none';
          if (imagePreview) imagePreview.style.display = 'block';
          updatePostButtonState();
        }, 'image/jpeg', 0.9);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  
  // Helper: clear image
  function clearImage() {
    selectedImageFile = null;
    if (imageFileInput) imageFileInput.value = '';
    if (imagePreviewImg) imagePreviewImg.src = '';
    if (imageDropZone) imageDropZone.style.display = 'block';
    if (imagePreview) imagePreview.style.display = 'none';
    updatePostButtonState();
  }
  
  // Image select button click
  if (imageSelectBtn && imageFileInput) {
    imageSelectBtn.addEventListener('click', () => imageFileInput.click());
  }
  
  // File input change
  if (imageFileInput) {
    imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        showImagePreview(file);
      }
    });
  }
  
  // Remove image button
  if (imageRemoveBtn) {
    imageRemoveBtn.addEventListener('click', clearImage);
  }
  
  // Drag and drop handlers
  if (imageDropZone) {
    imageDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageDropZone.classList.add('drag-over');
    });
    
    imageDropZone.addEventListener('dragleave', () => {
      imageDropZone.classList.remove('drag-over');
    });
    
    imageDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      imageDropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        showImagePreview(file);
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
        if ((!content || content.trim().length === 0) && !selectedImageFile) return; // guard
        await posts.sendPost(content, selectedImageFile);
        qs('#post-content').value = '';
        clearImage();
        // close post modal
        document.body.classList.remove('show-post');
        await refreshPosts();
      } catch (err) {
        // Silently fail
      }
    });
  }
  
  // Make clearImage available externally
  window._clearImageUpload = clearImage;
}
