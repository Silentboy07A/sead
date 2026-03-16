/* ============================================
   CINTIC ADMIN — Dashboard Logic
   ============================================ */

const $ = id => document.getElementById(id);

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}

// ========== AUTH CHECK ==========
let currentUser = null;

async function checkAdmin() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Not authenticated');
    const data = await res.json();
    if (!data.user.isAdmin) throw new Error('Not admin');
    currentUser = data.user;
    $('adminUserName').textContent = currentUser.name;
  } catch {
    showToast('Access denied. Redirecting...');
    setTimeout(() => window.location.href = '/', 1500);
  }
}

// ========== TAB NAVIGATION ==========
function initTabs() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      link.classList.add('active');
      $(link.dataset.tab + 'Panel').classList.add('active');
    });
  });
}

// ========== MODAL ==========
let modalMode = 'add'; // 'add' or 'edit'
let modalType = 'movie'; // 'movie' or 'theatre'
let editingId = null;

function openModal(title, type, mode = 'add', data = {}) {
  modalMode = mode;
  modalType = type;
  editingId = data._id || null;
  $('modalTitle').textContent = title;

  let fieldsHtml = '';
  if (type === 'movie') {
    fieldsHtml = `
      <div class="form-field"><label>Title *</label><input id="f_title" value="${data.title || ''}" required></div>
      <div class="form-field"><label>Genre *</label><input id="f_genre" value="${data.genre || ''}" placeholder="e.g. Action, Comedy" required></div>
      <div class="form-field"><label>Language *</label><input id="f_language" value="${data.language || ''}" required></div>
      <div class="form-field"><label>Year</label><input id="f_year" type="number" value="${data.year || new Date().getFullYear()}"></div>
      <div class="form-field"><label>Rating</label><input id="f_rating" type="number" step="0.1" min="0" max="10" value="${data.rating || 0}"></div>
      <div class="form-field"><label>Duration</label><input id="f_duration" value="${data.duration || ''}" placeholder="e.g. 2h 30m"></div>
      <div class="form-field"><label>Description</label><textarea id="f_description">${data.description || ''}</textarea></div>
      <div class="form-field"><label>Poster URL</label><input id="f_poster" value="${data.poster || ''}" placeholder="https://..."></div>
      <div class="form-field"><label>Trailer ID (YouTube)</label><input id="f_trailerId" value="${data.trailerId || ''}" placeholder="e.g. zSWdZVtXT7E"></div>
    `;
  } else {
    const showsJson = data.shows ? JSON.stringify(data.shows, null, 2) : '[{"time": "10:00 AM", "format": "2D"}]';
    fieldsHtml = `
      <div class="form-field"><label>Name *</label><input id="f_name" value="${data.name || ''}" required></div>
      <div class="form-field"><label>Location *</label><input id="f_location" value="${data.location || ''}" required></div>
      <div class="form-field"><label>City *</label><input id="f_city" value="${data.city || ''}" required></div>
      <div class="form-field"><label>Shows (JSON array)</label><textarea id="f_shows" style="min-height:120px;font-family:monospace;font-size:0.82rem">${showsJson}</textarea></div>
    `;
  }

  $('modalBody').innerHTML = fieldsHtml;
  $('modalOverlay').classList.add('show');
}

function closeModal() {
  $('modalOverlay').classList.remove('show');
}

$('modalClose').addEventListener('click', closeModal);
$('modalCancel').addEventListener('click', closeModal);

$('modalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const saveBtn = $('modalSave');
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  try {
    let body = {};
    let url = '';

    if (modalType === 'movie') {
      url = '/api/admin/movies';
      body = {
        title: $('f_title').value,
        genre: $('f_genre').value,
        language: $('f_language').value,
        year: parseInt($('f_year').value) || new Date().getFullYear(),
        rating: parseFloat($('f_rating').value) || 0,
        duration: $('f_duration').value,
        description: $('f_description').value,
        poster: $('f_poster').value,
        trailerId: $('f_trailerId').value
      };
    } else {
      url = '/api/admin/theatres';
      let shows = [];
      try { shows = JSON.parse($('f_shows').value); } catch { showToast('Invalid shows JSON'); return; }
      body = {
        name: $('f_name').value,
        location: $('f_location').value,
        city: $('f_city').value,
        shows
      };
    }

    if (modalMode === 'edit') body._id = editingId;

    const res = await fetch(url, {
      method: modalMode === 'add' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Operation failed');

    showToast(modalMode === 'add' ? '✅ Added successfully!' : '✅ Updated successfully!');
    closeModal();
    loadData();
  } catch (err) {
    showToast('❌ ' + err.message);
  } finally {
    saveBtn.textContent = 'Save';
    saveBtn.disabled = false;
  }
});

// ========== DELETE ==========
async function deleteItem(type, id) {
  if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

  try {
    const url = type === 'movie' ? '/api/admin/movies' : '/api/admin/theatres';
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ _id: id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    showToast('🗑️ Deleted successfully');
    loadData();
  } catch (err) {
    showToast('❌ ' + err.message);
  }
}

// ========== DATA LOADING ==========
let moviesData = [];
let theatresData = [];

async function loadData() {
  try {
    const [moviesRes, theatresRes] = await Promise.all([
      fetch('/api/admin/movies', { credentials: 'same-origin' }),
      fetch('/api/admin/theatres', { credentials: 'same-origin' })
    ]);

    if (moviesRes.ok) {
      moviesData = await moviesRes.json();
      renderMoviesTable();
    }
    if (theatresRes.ok) {
      theatresData = await theatresRes.json();
      renderTheatresTable();
    }
  } catch (err) {
    showToast('Failed to load data');
    console.error(err);
  }
}

function renderMoviesTable() {
  const tbody = $('moviesTableBody');
  if (moviesData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-cell">No movies found. Add one!</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  moviesData.forEach(m => {
    const tr = document.createElement('tr');
    
    // Convert ID to number just in case
    const mid = m._id;
    
    tr.innerHTML = `
      <td>${mid}</td>
      <td class="movie-title-cell"></td>
      <td class="movie-genre-cell"></td>
      <td class="movie-lang-cell"></td>
      <td>★ ${escapeHTML(m.rating)}</td>
      <td>${escapeHTML(m.year) || '—'}</td>
      <td>
        <button class="action-btn edit-btn">✏️ Edit</button>
        <button class="action-btn delete delete-btn">🗑️</button>
      </td>
    `;
    
    // Safely set text content for user-provided strings
    tr.querySelector('.movie-title-cell').textContent = m.title;
    tr.querySelector('.movie-genre-cell').textContent = m.genre;
    tr.querySelector('.movie-lang-cell').textContent = m.language;
    
    tr.querySelector('.edit-btn').onclick = () => editMovie(mid);
    tr.querySelector('.delete-btn').onclick = () => deleteItem("movie", mid);
    
    tbody.appendChild(tr);
  });
}

function renderTheatresTable() {
  const tbody = $('theatresTableBody');
  if (theatresData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No theatres found. Add one!</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  theatresData.forEach(t => {
    const tr = document.createElement('tr');
    const tid = t._id;
    
    tr.innerHTML = `
      <td>${tid}</td>
      <td class="theatre-name-cell"></td>
      <td class="theatre-loc-cell"></td>
      <td class="theatre-city-cell"></td>
      <td>${(t.shows || []).length} shows</td>
      <td>
        <button class="action-btn edit-btn">✏️ Edit</button>
        <button class="action-btn delete delete-btn">🗑️</button>
      </td>
    `;
    
    tr.querySelector('.theatre-name-cell').textContent = t.name;
    tr.querySelector('.theatre-loc-cell').textContent = t.location;
    tr.querySelector('.theatre-city-cell').textContent = t.city;
    
    tr.querySelector('.edit-btn').onclick = () => editTheatre(tid);
    tr.querySelector('.delete-btn').onclick = () => deleteItem("theatre", tid);
    
    tbody.appendChild(tr);
  });
}

// ========== EDIT HELPERS ==========
function editMovie(id) {
  const numericId = Number(id);
  const movie = moviesData.find(m => String(m._id) === String(id));
  if (movie) openModal('Edit Movie', 'movie', 'edit', movie);
}

function editTheatre(id) {
  const numericId = Number(id);
  const theatre = theatresData.find(t => String(t._id) === String(id));
  if (theatre) openModal('Edit Theatre', 'theatre', 'edit', theatre);
}

// ========== BUTTON HANDLERS ==========
$('addMovieBtn').addEventListener('click', () => openModal('Add Movie', 'movie', 'add'));
$('addTheatreBtn').addEventListener('click', () => openModal('Add Theatre', 'theatre', 'add'));

$('adminLogout').addEventListener('click', async () => {
  try { await fetch('/api/auth/logout', { credentials: 'same-origin' }); } catch {}
  window.location.href = '/';
});

// ========== INIT ==========
(async function init() {
  await checkAdmin();
  initTabs();
  loadData();
})();
