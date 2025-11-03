(function(){
  async function fetchJSON(url, opts) {
    try {
      const r = await fetch(url, Object.assign({credentials:'same-origin', headers: {'Content-Type':'application/json'}}, opts));
      if (!r.ok) return null;
      return await r.json();
    } catch(e){ return null; }
  }

  function usernameFromQuery() {
    const p = new URLSearchParams(location.search);
    return p.get('user') || '';
  }

  function initials(name, fallback){
    if (!name) return fallback || '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0,1).toUpperCase();
    return (parts[0].substring(0,1) + parts[parts.length-1].substring(0,1)).toUpperCase();
  }

  async function loadProfile() {
    const requested = usernameFromQuery();
    let profile = null;
    if (requested) {
      profile = await fetchJSON('/api/profile/' + encodeURIComponent(requested));
      if (profile === null) {
        document.getElementById('displayName').textContent = 'Nicht gefunden';
        document.getElementById('username').textContent = '';
        document.getElementById('bio').textContent = '';
        return;
      }
      // viewing someone else's profile -> hide edit
      document.getElementById('editBtn').style.display = 'none';
    } else {
      // fetch current user's profile
      profile = await fetchJSON('/api/profile');
      if (!profile || !profile.username) {
        // not logged in or empty
        document.getElementById('displayName').textContent = 'Gast';
        document.getElementById('username').textContent = '@guest';
        document.getElementById('bio').textContent = 'Bitte anmelden, um dein Profil zu bearbeiten.';
        document.getElementById('editBtn').style.display = 'none';
        return;
      }
      // show edit button
      document.getElementById('editBtn').style.display = '';
    }

    const dn = profile.displayName || profile.username || '';
    document.getElementById('displayName').textContent = dn;
    document.getElementById('username').textContent = profile.username ? ('@'+profile.username) : '';
    document.getElementById('bio').textContent = profile.bio || '';
    document.getElementById('avatar').textContent = initials(dn, '?');

    // prepare edit form values
    document.getElementById('inpDisplay').value = profile.displayName || '';
    document.getElementById('inpBio').value = profile.bio || '';
    document.getElementById('inpEmail').value = profile.email || '';
  }

  async function saveProfile() {
    const body = {
      displayName: document.getElementById('inpDisplay').value || '',
      bio: document.getElementById('inpBio').value || ''
    };
    const email = document.getElementById('inpEmail').value || null;
    const pw = document.getElementById('inpPassword').value || null;
    if (email) body.email = email;
    if (pw) body.password = pw;
    const r = await fetch('/api/profile', {method:'POST', credentials:'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const msg = document.getElementById('msg');
    if (r.ok) {
      msg.style.display = '';
      msg.style.color = 'green';
      msg.textContent = 'Profil gespeichert.';
      document.getElementById('editForm').style.display = 'none';
      // reload visible fields
      await loadProfile();
      setTimeout(()=>{ msg.style.display = 'none'; }, 2500);
    } else if (r.status === 403) {
      msg.style.display = '';
      msg.style.color = 'red';
      msg.textContent = 'Fehler: nicht angemeldet.';
    } else {
      msg.style.display = '';
      msg.style.color = 'red';
      msg.textContent = 'Fehler beim Speichern.';
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadProfile();
    document.getElementById('editBtn').addEventListener('click', function(){
      document.getElementById('editForm').style.display = '';
      document.getElementById('sensitiveFields').style.display = '';
    });
    document.getElementById('cancelBtn').addEventListener('click', function(){
      document.getElementById('editForm').style.display = 'none';
      document.getElementById('msg').style.display = 'none';
    });
    document.getElementById('saveBtn').addEventListener('click', function(e){
      e.preventDefault();
      saveProfile();
    });
  });
})();

