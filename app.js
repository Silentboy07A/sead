/* ============================================
   CINTIC — Movie Ticket Booking App
   Main Application Logic
   ============================================ */

// ========== REAL DATA (Fetched from API) ==========
let MOVIES = [];
let THEATRES = [];

const SEAT_PRICES = { gold: 150, silver: 200, platinum: 300 };
const GENRES = ["All", "Action", "Comedy", "Drama", "Thriller", "Sci-Fi", "Romance"];

// ========== APP STATE ==========
const state = {
  user: null,
  movies: [],
  selectedMovie: null,
  selectedTheatre: null,
  selectedShow: null,
  selectedSeats: [],
  takenSeats: [], // mock taken
  lockedSeats: [], // active real-time locks
  lockExpires: null,
  lockInterval: null
};

// Restore from localStorage
function loadState() {
  try {
    const saved = sessionStorage.getItem('cintic_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.user) state.user = parsed.user;
    }
  } catch (e) { }
}
function saveState() {
  sessionStorage.setItem('cintic_state', JSON.stringify({ user: state.user }));
}

// ========== UTILITY ==========
function $(id) { return document.getElementById(id); }
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ========== AUTH LOGIC ==========
function initAuth() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      const formId = tab.dataset.tab === 'login' ? 'loginForm' : 'signupForm';
      $(formId).classList.add('active');
    });
  });
  $('switchToSignup').addEventListener('click', () => {
    document.querySelectorAll('.auth-tab')[1].click();
  });
  $('switchToLogin').addEventListener('click', () => {
    document.querySelectorAll('.auth-tab')[0].click();
  });

  // Password toggles
  $('loginPassToggle').addEventListener('click', () => togglePassword('loginPassword', 'loginPassToggle'));
  $('signupPassToggle').addEventListener('click', () => togglePassword('signupPassword', 'signupPassToggle'));

  // Real-time validation — Login
  $('loginEmail').addEventListener('input', () => validateLoginEmail());
  $('loginEmail').addEventListener('blur', () => validateLoginEmail());
  $('loginPassword').addEventListener('input', () => { validatePasswordField('loginPassword', 'loginPasswordError', 'loginStrengthBar', 'loginStrengthLabel', 'loginChecklist'); updateLoginBtn(); });
  $('loginPassword').addEventListener('blur', () => validatePasswordField('loginPassword', 'loginPasswordError', 'loginStrengthBar', 'loginStrengthLabel', 'loginChecklist'));

  // Real-time validation — Signup
  $('signupName').addEventListener('input', () => { validateName(); updateSignupBtn(); });
  $('signupName').addEventListener('blur', () => validateName());
  $('signupEmail').addEventListener('input', () => { validateSignupEmail(); updateSignupBtn(); });
  $('signupEmail').addEventListener('blur', () => validateSignupEmail());
  $('signupPassword').addEventListener('input', () => { validatePasswordField('signupPassword', 'signupPasswordError', 'signupStrengthBar', 'signupStrengthLabel', 'signupChecklist'); validateConfirm(); updateSignupBtn(); });
  $('signupConfirm').addEventListener('input', () => { validateConfirm(); updateSignupBtn(); });

  // Form submit
  $('loginForm').addEventListener('submit', handleLogin);
  $('signupForm').addEventListener('submit', handleSignup);

  // Initialize Google OAuth
  setTimeout(initGoogleAuth, 100);
}

async function initGoogleAuth() {
  if (typeof google === 'undefined' || !google.accounts) {
    // Retry if script not loaded yet
    setTimeout(initGoogleAuth, 500);
    return;
  }

  try {
    const configRes = await fetch('/api/config');
    const config = await configRes.json();

    const GOOGLE_CLIENT_ID = config.googleClientId;
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
      console.warn('Google Client ID not configured.');
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
      context: 'signin',
      ux_mode: 'popup',
    });

    const btnContainer = $('googleLoginBtn');
    if (btnContainer) {
      google.accounts.id.renderButton(btnContainer, {
        theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'outline' : 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320
      });
    }
  } catch (err) {
    console.error('Failed to init Google Auth:', err);
  }
}

async function handleGoogleLogin(response) {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');

    state.user = data.user;
    if (!state.user.bookings) state.user.bookings = [];
    saveState();

    showToast(`Welcome, ${state.user.name}! 🎬`);
    enterApp();
  } catch (error) {
    console.error('Google Auth Error:', error);
    showToast('Google sign-in failed: ' + (error.message || 'Please try again'));
  }
}

function togglePassword(inputId, toggleId) {
  const inp = $(inputId);
  const tog = $(toggleId);
  if (inp.type === 'password') { inp.type = 'text'; tog.textContent = '🙈'; }
  else { inp.type = 'password'; tog.textContent = '👁'; }
}

// Email validation logic
function checkEmail(value) {
  if (!value) return { valid: false, msg: '' };
  if (!value.includes('@')) return { valid: false, msg: "✗ Email must include '@' — e.g. name@gmail.com" };
  const [local, domain] = value.split('@');
  if (!local) return { valid: false, msg: "✗ Please enter your username before '@'" };
  if (!domain) return { valid: false, msg: "✗ Please enter a domain after '@' — e.g. gmail.com" };
  if (!domain.includes('.')) return { valid: false, msg: "✗ Domain must include a dot — e.g. @gmail.com" };
  return { valid: true, msg: '' };
}

function validateLoginEmail() {
  const r = checkEmail($('loginEmail').value);
  setFieldState('loginEmail', 'loginEmailError', 'loginEmailIcon', r.valid, r.msg);
  updateLoginBtn();
  return r.valid;
}
function validateSignupEmail() {
  const r = checkEmail($('signupEmail').value);
  setFieldState('signupEmail', 'signupEmailError', 'signupEmailIcon', r.valid, r.msg);
  return r.valid;
}

function setFieldState(inputId, errorId, iconId, valid, msg) {
  const inp = $(inputId);
  const err = $(errorId);
  const icon = $(iconId);
  inp.classList.remove('valid', 'invalid');
  if (!inp.value) { err.textContent = ''; err.classList.add('hidden'); icon.style.display = 'none'; return; }
  if (valid) {
    inp.classList.add('valid');
    err.classList.add('hidden');
    icon.style.display = 'inline';
  } else {
    inp.classList.add('invalid');
    err.textContent = msg;
    err.classList.remove('hidden');
    icon.style.display = 'none';
  }
}

// Password validation
function checkPassword(value) {
  const rules = {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
  };
  const met = Object.values(rules).filter(Boolean).length;
  return { rules, met, allPassed: met === 5 };
}

function validatePasswordField(inputId, errorId, barId, labelId, checklistId) {
  const val = $(inputId).value;
  const { rules, met, allPassed } = checkPassword(val);
  const inp = $(inputId);
  const bar = $(barId);
  const label = $(labelId);

  // Strength bar
  const levels = [
    { width: '0%', color: '#333', text: '' },
    { width: '20%', color: '#e63946', text: 'Weak' },
    { width: '40%', color: '#e67e22', text: 'Poor' },
    { width: '60%', color: '#f1c40f', text: 'Fair' },
    { width: '80%', color: '#3498db', text: 'Good' },
    { width: '100%', color: '#2ecc71', text: 'Strong' },
  ];
  const level = val ? levels[met] : levels[0];
  bar.style.width = level.width;
  bar.style.background = level.color;
  label.textContent = level.text;
  label.style.color = level.color;

  // Checklist
  const checklist = $(checklistId);
  const items = checklist.querySelectorAll('.checklist-item');
  const ruleKeys = ['length', 'upper', 'lower', 'number', 'special'];
  const ruleLabels = ['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'];
  items.forEach((item, i) => {
    const passed = rules[ruleKeys[i]];
    item.classList.toggle('met', passed);
    item.textContent = (passed ? '✓ ' : '✗ ') + ruleLabels[i];
  });

  // Input state
  inp.classList.remove('valid', 'invalid');
  if (val) inp.classList.add(allPassed ? 'valid' : 'invalid');

  // Find nearest parent's valid-icon for password (we use the toggle as indicator)
  return allPassed;
}

// Name validation
function validateName() {
  const val = $('signupName').value;
  const inp = $('signupName');
  const err = $('signupNameError');
  const icon = $('signupNameIcon');
  inp.classList.remove('valid', 'invalid');
  if (!val) { err.classList.add('hidden'); icon.style.display = 'none'; return false; }
  if (val.trim().length === 0) { setErr("✗ Please enter a valid name"); return false; }
  if (val.length < 3) { setErr("✗ Name must be at least 3 characters"); return false; }
  if (val.length > 30) { setErr("✗ Name cannot exceed 30 characters"); return false; }
  if (/[0-9]/.test(val)) { setErr("✗ Name should only contain letters and spaces"); return false; }
  if (/[^a-zA-Z\s\-']/.test(val)) { setErr("✗ Only letters, spaces, hyphens allowed"); return false; }
  inp.classList.add('valid');
  err.classList.add('hidden');
  icon.style.display = 'inline';
  return true;

  function setErr(msg) { inp.classList.add('invalid'); err.textContent = msg; err.classList.remove('hidden'); icon.style.display = 'none'; }
}

// Confirm password
function validateConfirm() {
  const pass = $('signupPassword').value;
  const conf = $('signupConfirm').value;
  const inp = $('signupConfirm');
  const err = $('signupConfirmError');
  const icon = $('signupConfirmIcon');
  inp.classList.remove('valid', 'invalid');
  if (!conf) { err.classList.add('hidden'); icon.style.display = 'none'; return false; }
  if (conf !== pass) {
    inp.classList.add('invalid');
    err.textContent = "✗ Passwords do not match";
    err.classList.remove('hidden');
    icon.style.display = 'none';
    return false;
  }
  inp.classList.add('valid');
  err.textContent = "✓ Passwords match";
  err.style.color = 'var(--green)';
  err.classList.remove('hidden');
  icon.style.display = 'inline';
  return true;
}

function updateLoginBtn() {
  const emailOk = checkEmail($('loginEmail').value).valid;
  const passOk = checkPassword($('loginPassword').value).allPassed;
  $('loginBtn').disabled = !(emailOk && passOk);
}
function updateSignupBtn() {
  const nameOk = validateName();
  const emailOk = checkEmail($('signupEmail').value).valid;
  const passOk = checkPassword($('signupPassword').value).allPassed;
  const confOk = $('signupConfirm').value === $('signupPassword').value && $('signupConfirm').value.length > 0;
  $('signupBtn').disabled = !(nameOk && emailOk && passOk && confOk);
}

function handleLogin(e) {
  e.preventDefault();
  const emailOk = validateLoginEmail();
  const passOk = validatePasswordField('loginPassword', 'loginPasswordError', 'loginStrengthBar', 'loginStrengthLabel', 'loginChecklist');
  if (!emailOk || !passOk) {
    $('authFormCard').classList.add('shake');
    setTimeout(() => $('authFormCard').classList.remove('shake'), 500);
    return;
  }
  const btn = $('loginBtn');
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled = true;
  setTimeout(() => {
    const email = $('loginEmail').value;
    const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    state.user = { name, email, bookings: [] };
    saveState();
    btn.innerHTML = '✓';
    showToast('Welcome back, ' + name + '! 🎬');
    setTimeout(() => enterApp(), 1500);
  }, 1500);
}

function handleSignup(e) {
  e.preventDefault();
  if ($('signupBtn').disabled) {
    $('authFormCard').classList.add('shake');
    setTimeout(() => $('authFormCard').classList.remove('shake'), 500);
    return;
  }
  const btn = $('signupBtn');
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled = true;
  setTimeout(() => {
    const name = $('signupName').value;
    const email = $('signupEmail').value;
    state.user = { name, email, bookings: [] };
    saveState();
    btn.innerHTML = '✓';
    showToast('Welcome, ' + name + '! 🎬');
    setTimeout(() => enterApp(), 1500);
  }, 1500);
}

function enterApp() {
  $('authPage').classList.remove('active');
  $('mainApp').style.display = 'block';
  updateNavUser();
  initApp();
}

function updateNavUser() {
  if (state.user) {
    const initial = state.user.name.charAt(0).toUpperCase();
    $('navAvatar').textContent = initial;
    $('navUserName').textContent = state.user.name;
    // Note: The event listeners for toggling the dropdown and logging out
    // are now handled once in initNavigation() to prevent duplication.
  }
}

// ========== MAIN APP INIT ==========
async function initApp() {
  $('movieGrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem"><div class="spinner" style="margin:0 auto;width:40px;height:40px;border-width:4px"></div><p style="margin-top:1rem;color:var(--text-muted)">Loading movies from database...</p></div>';

  try {
    const [moviesRes, theatresRes] = await Promise.all([
      fetch('/api/movies'),
      fetch('/api/theatres')
    ]);

    if (!moviesRes.ok || !theatresRes.ok) throw new Error('Failed to fetch API');

    MOVIES = await moviesRes.json();
    THEATRES = await theatresRes.json();

    // Rewrite TMDB poster URLs through local proxy to avoid CORS issues
    MOVIES = MOVIES.map(m => ({
      ...m,
      poster: m.poster && m.poster.includes('image.tmdb.org')
        ? `/poster?url=${encodeURIComponent(m.poster)}`
        : m.poster
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    showToast('Failed to load data from database.');
    $('movieGrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--red)">Failed to load data. Please try again.</div>';
    return;
  }

  generateTakenSeats();

  if (MOVIES.length > 0) {
    renderHero();
  }

  renderGenreTabs();
  renderMovies('All');
  initNavigation();
  initSearch();
}

function generateTakenSeats() {
  state.takenSeats = [];
  const rows = 'ABCDEFGHIJ';
  for (let i = 0; i < 15; i++) {
    const r = rows[Math.floor(Math.random() * 10)];
    const s = Math.floor(Math.random() * 10) + 1;
    const seat = r + s;
    if (!state.takenSeats.includes(seat)) state.takenSeats.push(seat);
  }
}

// ========== HERO ==========
function renderHero() {
  const m = MOVIES[0];
  $('heroBg').style.backgroundImage = `url(${m.poster})`;
  $('heroTitle').textContent = m.title;
  $('heroRating').textContent = '★ ' + m.rating;
  $('heroDuration').textContent = m.duration + ' • ' + m.language;
  $('heroDesc').textContent = m.description;
  $('heroGenreTags').innerHTML = `<span class="genre-tag">${m.genre}</span><span class="genre-tag">${m.language}</span>`;
  $('heroBookBtn').onclick = () => selectMovie(m);
}

// ========== GENRE TABS ==========
function renderGenreTabs() {
  $('genreTabs').innerHTML = GENRES.map(g =>
    `<button class="${g === 'All' ? 'active' : ''}" data-genre="${g}">${g}</button>`
  ).join('');
  $('genreTabs').addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    $('genreTabs').querySelectorAll('button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderMovies(e.target.dataset.genre);
  });
}

// ========== MOVIE GRID ==========
function renderMovies(genre, searchTerm = '', lang = '', city = '') {
  let filtered = MOVIES;
  if (genre && genre !== 'All') filtered = filtered.filter(m => m.genre.includes(genre));
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(s) || m.genre.toLowerCase().includes(s) || m.language.toLowerCase().includes(s)
    );
  }
  if (lang) filtered = filtered.filter(m => m.language === lang);

  const GENRE_COLORS = {
    'Action': ['#e50914', '#7b0009'], 'Thriller': ['#1a1a2e', '#e50914'],
    'Sci-Fi': ['#003366', '#0066cc'], 'Drama': ['#2c3e50', '#4ca1af'],
    'Comedy': ['#f7971e', '#ffd200'], 'Horror': ['#0d0d0d', '#4a0008'],
    'Romance': ['#f857a6', '#ff5858'], 'Anime': ['#7f00ff', '#e100ff'],
    'Survival': ['#355c7d', '#6c5b7b'], 'Documentary': ['#232526', '#414345'],
    'Biography': ['#4b3832', '#854442'], 'default': ['#1a1a2e', '#16213e']
  };

  $('movieGrid').innerHTML = filtered.length ? filtered.map(m => {
    const gc = GENRE_COLORS[m.genre] || GENRE_COLORS.default;
    const fallbackId = 'fb_' + m.id;
    const onErr = `this.style.display='none';document.getElementById('${fallbackId}').style.display='flex'`;
    return `
    <div class="movie-card" data-id="${m.id}">
      <div style="position:relative;width:100%;aspect-ratio:2/3;overflow:hidden;border-radius:0.5rem 0.5rem 0 0;flex-shrink:0">
        <img class="movie-poster" src="${m.poster}" alt="${m.title}" onerror="${onErr}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;position:absolute;top:0;left:0">
        <div id="${fallbackId}" style="display:none;background:linear-gradient(160deg,${gc[0]},${gc[1]});width:100%;height:100%;align-items:center;justify-content:center;flex-direction:column;padding:1.2rem;text-align:center;position:absolute;top:0;left:0">
          <div style="font-size:2.8rem;margin-bottom:0.6rem">🎬</div>
          <div style="color:#fff;font-weight:700;font-size:0.95rem;line-height:1.3;font-family:Poppins,sans-serif">${m.title}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:0.75rem;margin-top:0.4rem">${m.language} • ${m.genre}</div>
        </div>
      </div>
      <div class="movie-info">
        <h3>${m.title}</h3>
        <div class="movie-meta">
          <span class="rating">★ ${m.rating}</span>
          <span>${m.genre}</span>
          <span>${m.language}</span>
        </div>
        <button class="btn-book" onclick="selectMovie(MOVIES.find(x=>x.id===${m.id}))">Book Now</button>
      </div>
    </div>
  `}).join('') : '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem">No movies found</p>';
}

// ========== SEARCH ==========
function initSearch() {
  $('searchInput').addEventListener('input', applyFilters);
  $('langFilter').addEventListener('change', applyFilters);
  $('cityFilter').addEventListener('change', async (e) => {
    if (e.target.value === '_detect_') {
      e.target.disabled = true;
      const originalOptions = Array.from(e.target.options).map(o => o.value);

      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
        const data = await res.json();

        let city = data.address.city || data.address.town || data.address.state_district;
        if (city) {
          // Clean up "City" from the end if it exists natively in India (e.g. "Chennai")
          city = city.replace(/ City$/i, '').trim();

          // Check if this city is in our expected list, or add it dynamically
          if (!originalOptions.includes(city)) {
            const opt = document.createElement('option');
            opt.value = opt.textContent = city;
            e.target.appendChild(opt);
          }
          e.target.value = city;
          showToast(`📍 Location detected: ${city}`);
        } else {
          throw new Error('City not found');
        }
      } catch (err) {
        console.warn('Geolocation failed:', err);
        showToast('❌ Could not detect location. Please set manually.');
        e.target.value = '';
      } finally {
        e.target.disabled = false;
        applyFilters();
      }
    } else {
      applyFilters();
    }
  });
}
function applyFilters() {
  const search = $('searchInput').value;
  const lang = $('langFilter').value;
  // If still set to _detect_, treat as empty filter until it resolves
  const city = $('cityFilter').value === '_detect_' ? '' : $('cityFilter').value;
  const activeGenre = document.querySelector('.genre-tabs .active')?.dataset.genre || 'All';
  renderMovies(activeGenre, search, lang, city);
}

// ========== NAVIGATION ==========
function initNavigation() {
  // Nav links
  document.querySelectorAll('.nav-links a[data-section]').forEach(a => {
    a.addEventListener('click', () => showPage(a.dataset.section));
  });
  $('navLogo').addEventListener('click', () => showPage('heroSection'));
  $('navToggle').addEventListener('click', () => $('navLinks').classList.toggle('open'));

  // User dropdown toggle
  $('navUser').addEventListener('click', (e) => {
    e.stopPropagation();
    $('userDropdown').classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    $('userDropdown').classList.remove('show');
  });

  // Logout
  $('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    state.user = null;
    sessionStorage.removeItem('cintic_state');
    window.location.reload();
  });

  // Trailer Modal
  const closeTrailerBtn = $('closeTrailerBtn');
  if (closeTrailerBtn) {
    closeTrailerBtn.addEventListener('click', closeTrailer);
  }

  // Global Search Logic
  const globalInput = $('globalSearchInput');
  const globalResults = $('globalSearchResults');

  if (globalInput && globalResults) {
    globalInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        globalResults.style.display = 'none';
        return;
      }

      const matchedMovies = MOVIES.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.genre.toLowerCase().includes(query)
      ).slice(0, 5); // top 5 results

      const matchedTheatres = THEATRES.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.location.toLowerCase().includes(query) ||
        t.city.toLowerCase().includes(query)
      ).slice(0, 3);

      let html = '';
      if (matchedMovies.length > 0) {
        html += '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;text-transform:uppercase;">Movies</div>';
        matchedMovies.forEach(m => {
          html += `
            <div class="global-search-item fade-in" onclick="selectMovieFromGlobal(${m.id})" style="padding:0.5rem;border-radius:0.5rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;">
              <img src="${m.poster}" style="width:30px;height:40px;border-radius:4px;object-fit:cover;">
              <div>
                <div style="font-size:0.9rem;font-weight:500;">${m.title}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${m.genre}</div>
              </div>
            </div>
          `;
        });
      }

      if (matchedTheatres.length > 0) {
        if (html !== '') html += '<div style="margin:0.5rem 0;border-top:1px solid rgba(255,255,255,0.1);"></div>';
        html += '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;text-transform:uppercase;">Theatres</div>';
        matchedTheatres.forEach(t => {
          html += `
            <div class="global-search-item fade-in" onclick="selectTheatreFromGlobal(${t.id})" style="padding:0.5rem;border-radius:0.5rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;">
              <div style="font-size:1.2rem;opacity:0.6;">🍿</div>
              <div>
                <div style="font-size:0.9rem;font-weight:500;">${t.name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${t.location}, ${t.city}</div>
              </div>
            </div>
          `;
        });
      }

      if (html === '') {
        html = '<div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">No results found.</div>';
      }

      globalResults.innerHTML = html;
      globalResults.style.display = 'block';
    });

    // Add styles dynamically for hover effect
    if (!document.getElementById('globalSearchStyles')) {
      const style = document.createElement('style');
      style.id = 'globalSearchStyles';
      style.innerHTML = `
        .global-search-item:hover { background: rgba(255,255,255,0.05); }
      `;
      document.head.appendChild(style);
    }
  }

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (globalInput && globalResults && !globalInput.contains(e.target) && !globalResults.contains(e.target)) {
      globalResults.style.display = 'none';
      globalInput.value = '';
    }
  });

  // Profile Modal
  $('profileBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (state.user) {
      $('profileName').textContent = state.user.name;
      $('profileEmail').textContent = state.user.email;
      $('profileAvatar').textContent = state.user.name.charAt(0).toUpperCase();
      $('profileJoined').textContent = 'Today';
    }
    $('profileModal').style.display = 'flex';
  });

  // Back buttons
  $('backToMovies').addEventListener('click', () => showPage('heroSection'));
  $('backToTheatres').addEventListener('click', () => showPage('theatreSection'));
  $('backToSeats').addEventListener('click', () => showPage('seatSection'));
  $('backToHome').addEventListener('click', () => {
    state.selectedMovie = null;
    state.selectedSeats = [];
    showPage('heroSection');
  });
}

// ========== GLOBAL SEARCH HELPERS ==========
function selectMovieFromGlobal(movieId) {
  const movie = MOVIES.find(m => m.id === movieId);
  if (movie) {
    if ($('globalSearchResults')) $('globalSearchResults').style.display = 'none';
    if ($('globalSearchInput')) $('globalSearchInput').value = '';
    selectMovie(movie);
  }
}

function selectTheatreFromGlobal(theatreId) {
  if ($('globalSearchResults')) $('globalSearchResults').style.display = 'none';
  if ($('globalSearchInput')) $('globalSearchInput').value = '';

  if (!state.selectedMovie) {
    alert('Please select a movie first to see showtimes at this theatre.');
    showPage('heroSection');
    return;
  }

  showPage('theatreSection');
  const searchInput = $('theatreSearchInput');
  const theatre = THEATRES.find(t => t.id === theatreId);
  if (searchInput && theatre) {
    searchInput.value = theatre.name;
    renderTheatres();
  }
}

// ========== TRAILER LOGIC ==========
function openTrailer(trailerId) {
  const iframe = $('trailerIframe');
  const modal = $('trailerModal');
  if (iframe && modal) {
    iframe.src = `https://www.youtube.com/embed/${trailerId}?autoplay=1`;
    modal.style.display = 'flex';
  }
}

function closeTrailer() {
  const iframe = $('trailerIframe');
  const modal = $('trailerModal');
  if (iframe && modal) {
    iframe.src = '';
    modal.style.display = 'none';
  }
}

function showPage(id) {
  if (id === 'myBookingsSection') {
    renderMyBookings();
  }
  document.querySelectorAll('#mainApp .page').forEach(p => p.classList.remove('active'));
  $(id).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navA = document.querySelector(`.nav-links a[data-section="${id}"]`);
  if (navA) navA.classList.add('active');
  window.scrollTo(0, 0);
}

// ========== MOVIE SELECTION ==========
function selectMovie(movie) {
  state.selectedMovie = movie;
  state.selectedShow = null;
  state.selectedSeats = [];
  renderTheatres();

  const searchInput = $('theatreSearchInput');
  if (searchInput) {
    searchInput.value = '';
    // Use oninput to replace any existing listener instead of adding duplicates
    searchInput.oninput = () => renderTheatres();
  }

  showPage('theatreSection');
}

// ========== THEATRE RENDERING ==========
function renderTheatres() {
  const m = state.selectedMovie;
  $('selectedMovieInfo').innerHTML = `
    <img src="${m.poster}" alt="${m.title}" onerror="this.style.background='#1a1a2e'">
    <div>
      <h3 style="font-family:'Poppins';font-weight:600">${m.title}</h3>
      <p style="font-size:0.85rem;color:var(--text-muted)">${m.genre} • ${m.language} • ${m.duration} • ★ ${m.rating}</p>
      ${m.trailerId ? `<button onclick="openTrailer('${m.trailerId}')" class="btn-primary" style="margin-top:12px; padding:0.5rem 1rem; font-size:0.85rem;">▶ Watch Trailer</button>` : ''}
    </div>
  `;
  const city = $('cityFilter').value;
  let theatres = THEATRES;
  if (city) theatres = theatres.filter(t => t.city === city);

  const searchInput = $('theatreSearchInput');
  if (searchInput && searchInput.value) {
    const s = searchInput.value.toLowerCase();
    theatres = theatres.filter(t =>
      t.name.toLowerCase().includes(s) ||
      t.location.toLowerCase().includes(s) ||
      t.city.toLowerCase().includes(s)
    );
  }

  if (theatres.length === 0) {
    $('theatreList').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:3rem">No theatres found</p>';
  } else {
    $('theatreList').innerHTML = theatres.map(t => `
      <div class="theatre-card">
        <h3>${t.name}</h3>
        <p class="location">📍 ${t.location}, ${t.city}</p>
        <div class="show-times">
          ${t.shows.map((s, i) => `
            <div class="show-badge" onclick="selectShow(${t.id}, ${i})" data-theatre="${t.id}" data-show="${i}">
              <span>${s.time}</span>
              <span class="format">${s.format}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
}

// ========== SHOW SELECTION ==========
async function selectShow(theatreId, showIndex) {
  const theatre = THEATRES.find(t => t.id === theatreId);
  state.selectedTheatre = theatre;
  state.selectedShow = theatre.shows[showIndex];
  state.selectedSeats = [];
  state.lockedSeats = [];

  $('seatMap').innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">Checking seat availability...</p>';
  showPage('seatSection');

  try {
    const res = await fetch('/api/check-locked-seats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theatreId,
        showIndex,
        date: new Date().toISOString().split('T')[0]
      })
    });
    const data = await res.json();
    if (res.ok && data.lockedSeats) state.lockedSeats = data.lockedSeats;
  } catch (e) {
    console.error('Failed to check locked seats', e);
  }

  generateTakenSeats();
  renderSeats();
}

// ========== SEAT RENDERING ==========
function renderSeats() {
  const rows = 'ABCDEFGHIJ'.split('');
  const categories = {
    gold: rows.slice(0, 3),
    silver: rows.slice(3, 7),
    platinum: rows.slice(7),
  };
  let html = '';
  for (const [cat, catRows] of Object.entries(categories)) {
    html += `<div class="seat-category-label ${cat}">${cat.toUpperCase()} — ₹${SEAT_PRICES[cat]}</div>`;
    for (const row of catRows) {
      html += `<div class="seat-row"><span class="seat-row-label">${row}</span>`;

      const renderBlock = (start, end) => {
        let blockHtml = '<div class="seat-block">';
        for (let s = start; s <= end; s++) {
          const seatId = row + s;
          const taken = state.takenSeats.includes(seatId);
          const locked = state.lockedSeats.includes(seatId);
          const isUnavailable = taken || locked;
          const selected = state.selectedSeats.includes(seatId);
          let cls = 'seat';
          if (isUnavailable) cls += ' taken';
          else if (selected) cls += ` selected${cat === 'gold' ? ' gold-cat' : ''}`;
          blockHtml += `<div class="${cls}" data-seat="${seatId}" data-cat="${cat}" ${isUnavailable ? '' : `onclick="toggleSeat('${seatId}','${cat}')"`}>${s}</div>`;
        }
        blockHtml += '</div>';
        return blockHtml;
      };

      html += renderBlock(1, 3); // Left aisle
      html += renderBlock(4, 7); // Center main
      html += renderBlock(8, 10); // Right aisle

      html += `<span class="seat-row-label">${row}</span></div>`;
    }
  }
  $('seatMap').innerHTML = html;
  updateSeatSummary();

  // Recommend button
  $('recommendBtn').onclick = recommendSeats;
  // Proceed
  $('proceedToPayment').onclick = async () => {
    if (state.selectedSeats.length === 0) { showToast('Please select at least one seat'); return; }

    const btn = $('proceedToPayment');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Locking Seats... <div class="spinner" style="display:inline-block;width:14px;height:14px;border-width:2px;margin-left:8px;"></div>';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    try {
      const showIndex = state.selectedTheatre.shows.indexOf(state.selectedShow);
      const res = await fetch('/api/lock-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theatreId: state.selectedTheatre.id,
          showIndex,
          date: new Date().toISOString().split('T')[0],
          seats: state.selectedSeats
        })
      });
      const data = await res.json();

      btn.innerHTML = originalText;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';

      if (res.ok) {
        state.lockExpires = new Date(data.expiresAt).getTime();
        startLockTimer();
        renderPayment();
        showPage('paymentSection');
      } else {
        showToast(data.message || 'Failed to lock seats. Someone else may have grabbed them!');
        // Re-check locks
        selectShow(state.selectedTheatre.id, showIndex);
      }
    } catch (e) {
      btn.innerHTML = originalText;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      showToast('Network error while locking seats.');
    }
  };
}

// ========== LOCK TIMER ==========
function startLockTimer() {
  if (state.lockInterval) clearInterval(state.lockInterval);

  // Create or update timer UI on payment page
  let timerDiv = $('seatLockTimer');
  if (!timerDiv) {
    const paymentHeader = document.querySelector('#paymentSection .payment-header');
    if (paymentHeader) {
      timerDiv = document.createElement('div');
      timerDiv.id = 'seatLockTimer';
      timerDiv.style.background = 'rgba(230, 57, 70, 0.1)';
      timerDiv.style.border = '1px solid var(--red)';
      timerDiv.style.color = 'var(--red)';
      timerDiv.style.padding = '0.5rem 1rem';
      timerDiv.style.borderRadius = 'var(--radius-sm)';
      timerDiv.style.marginTop = '1rem';
      timerDiv.style.display = 'flex';
      timerDiv.style.alignItems = 'center';
      timerDiv.style.justifyContent = 'center';
      timerDiv.style.gap = '8px';
      timerDiv.style.fontWeight = '600';
      paymentHeader.after(timerDiv);
    }
  }

  state.lockInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = state.lockExpires - now;

    if (distance < 0) {
      clearInterval(state.lockInterval);
      if (timerDiv) timerDiv.innerHTML = '🕒 Seat lock expired! Redirecting...';
      setTimeout(() => {
        showToast('Seat lock expired. Please select seats again.');
        const showIndex = state.selectedTheatre.shows.indexOf(state.selectedShow);
        selectShow(state.selectedTheatre.id, showIndex);
      }, 2000);
      return;
    }

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    if (timerDiv) {
      timerDiv.innerHTML = `🕒 Seats locked for: <span>${minutes}:${seconds < 10 ? '0' : ''}${seconds}</span>`;
    }
  }, 1000);
}

function stopLockTimer() {
  if (state.lockInterval) {
    clearInterval(state.lockInterval);
    state.lockInterval = null;
  }
  const timerDiv = $('seatLockTimer');
  if (timerDiv) timerDiv.remove();
}

function toggleSeat(seatId, cat) {
  const idx = state.selectedSeats.indexOf(seatId);
  if (idx === -1) state.selectedSeats.push(seatId);
  else state.selectedSeats.splice(idx, 1);
  renderSeats();
}

function updateSeatSummary() {
  const summary = $('seatSummary');
  if (state.selectedSeats.length === 0) { summary.style.display = 'none'; return; }
  summary.style.display = 'flex';
  $('selectedSeatsList').textContent = state.selectedSeats.join(', ');
  let total = 0;
  const cats = {};
  state.selectedSeats.forEach(s => {
    const row = s.charAt(0);
    let cat = 'silver';
    if ('ABC'.includes(row)) cat = 'gold';
    else if ('HIJ'.includes(row)) cat = 'platinum';
    total += SEAT_PRICES[cat];
    cats[cat] = (cats[cat] || 0) + 1;
  });
  $('totalPrice').textContent = total.toLocaleString();
  $('seatCategoryInfo').textContent = Object.entries(cats).map(([c, n]) => `${n} ${c}`).join(' + ');
}

// ========== SMART RECOMMENDATION ==========
function recommendSeats() {
  const n = parseInt($('groupSize').value) || 2;
  const genre = state.selectedMovie?.genre || 'Drama';
  state.selectedSeats = [];
  const rows = 'ABCDEFGHIJ'.split('');
  let targetRows;
  if (['Action', 'Thriller'].includes(genre)) {
    targetRows = ['D', 'E', 'F', 'G'];
  } else {
    targetRows = ['E', 'F', 'D', 'G'];
  }
  let found = false;
  for (const row of targetRows) {
    if (found) break;
    const available = [];
    for (let s = 1; s <= 10; s++) {
      const seatId = row + s;
      if (!state.takenSeats.includes(seatId)) available.push(seatId);
    }
    if (n <= 3) {
      const center = available.filter(s => { const num = parseInt(s.slice(1)); return num >= 4 && num <= 7; });
      if (center.length >= n) { state.selectedSeats = center.slice(0, n); found = true; }
    }
    if (!found && n >= 4) {
      for (let i = 0; i <= available.length - n; i++) {
        const chunk = available.slice(i, i + n);
        const nums = chunk.map(s => parseInt(s.slice(1)));
        const consecutive = nums.every((v, j) => j === 0 || v === nums[j - 1] + 1);
        if (consecutive) { state.selectedSeats = chunk; found = true; break; }
      }
    }
    if (!found && available.length >= n) { state.selectedSeats = available.slice(0, n); found = true; }
  }
  if (!found) {
    for (const row of rows) {
      const available = [];
      for (let s = 1; s <= 10; s++) {
        const seatId = row + s;
        if (!state.takenSeats.includes(seatId)) available.push(seatId);
      }
      if (available.length >= n) { state.selectedSeats = available.slice(0, n); found = true; break; }
    }
  }
  if (found) showToast(`✨ Recommended ${n} seats for ${genre}!`);
  else showToast('Not enough seats available');
  renderSeats();
}

// ========== PAYMENT ==========
function renderPayment() {
  const m = state.selectedMovie;
  const t = state.selectedTheatre;
  const s = state.selectedShow;
  let total = 0;
  state.selectedSeats.forEach(seat => {
    const row = seat.charAt(0);
    let cat = 'silver';
    if ('ABC'.includes(row)) cat = 'gold';
    else if ('HIJ'.includes(row)) cat = 'platinum';
    total += SEAT_PRICES[cat];
  });
  const convFee = Math.round(total * 0.05);
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  $('orderSummary').innerHTML = `
    <h2>Order Summary</h2>
    <div class="order-detail"><span class="label">Movie</span><span>${m.title}</span></div>
    <div class="order-detail"><span class="label">Theatre</span><span>${t.name}</span></div>
    <div class="order-detail"><span class="label">Date</span><span>${dateStr}</span></div>
    <div class="order-detail"><span class="label">Time</span><span>${s.time} (${s.format})</span></div>
    <div class="order-detail"><span class="label">Seats</span><span>${state.selectedSeats.join(', ')}</span></div>
    <div class="order-detail"><span class="label">Tickets</span><span>₹${total.toLocaleString()}</span></div>
    <div class="order-detail"><span class="label">Convenience Fee</span><span>₹${convFee}</span></div>
    <div class="order-total"><span>Total</span><span class="price">₹${(total + convFee).toLocaleString()}</span></div>
  `;

  const finalTotal = total + convFee;
  if ($('stripePayAmount')) $('stripePayAmount').textContent = `₹${finalTotal.toLocaleString()}`;

  // Card masking
  $('cardNumber').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = v;
  });
  $('cardExpiry').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });

  // Confirm payment
  $('confirmPayBtn').onclick = () => {
    const cardNum = $('cardNumber').value.replace(/\s+/g, '');
    const cardExp = $('cardExpiry').value;
    const cardCvv = $('cardCvv').value;
    const cardName = $('cardName').value;
    const email = $('paymentEmail').value;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showToast('Please enter a valid email');
      return;
    }
    if (cardNum.length !== 16) {
      showToast('Card number must be 16 digits');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExp)) {
      showToast('Invalid expiry format (MM/YY)');
      return;
    }
    const [mm, yy] = cardExp.split('/');
    const month = parseInt(mm, 10);
    const year = parseInt('20' + yy, 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month < 1 || month > 12) {
      showToast('Invalid expiry month');
      return;
    }
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      showToast('Card has expired');
      return;
    }
    if (cardCvv.length < 3) {
      showToast('Invalid CVC');
      return;
    }
    if (!cardName.trim()) {
      showToast('Please enter name on card');
      return;
    }

    const btn = $('confirmPayBtn');
    btn.innerHTML = '<div class="spinner" style="border-width:2px; width:16px; height:16px; margin-right:8px;"></div> Processing...';
    btn.disabled = true;

    setTimeout(() => {
      stopLockTimer(); // Clear the lock timer

      const bookingId = 'CB' + Date.now().toString(36).toUpperCase();

      if (state.user) {
        if (!state.user.bookings) state.user.bookings = [];
        state.user.bookings.unshift({
          id: bookingId,
          movie: state.selectedMovie.title,
          poster: state.selectedMovie.poster,
          theatre: state.selectedTheatre.name + ', ' + state.selectedTheatre.location,
          date: dateStr,
          time: state.selectedShow.time + ' (' + state.selectedShow.format + ')',
          seats: state.selectedSeats.join(', '),
          amount: finalTotal
        });
        saveState();
      }

      renderTicket(finalTotal, dateStr, bookingId);
      showPage('ticketSection');
      btn.innerHTML = `<span>Pay </span><b><span id="stripePayAmount">₹${finalTotal.toLocaleString()}</span></b>`;
      btn.disabled = false;
    }, 2000);
  };
}

// ========== E-TICKET ==========
function renderTicket(totalAmount, dateStr, passBookingId) {
  const m = state.selectedMovie;
  const t = state.selectedTheatre;
  const s = state.selectedShow;
  const bookingId = passBookingId || ('CB' + Date.now().toString(36).toUpperCase());

  $('ticketMovieName').textContent = m.title;
  $('ticketTheatre').textContent = t.name + ', ' + t.location;
  $('ticketDate').textContent = dateStr;
  $('ticketTime').textContent = s.time + ' (' + s.format + ')';
  $('ticketSeats').textContent = state.selectedSeats.join(', ');
  $('ticketAmount').textContent = '₹' + totalAmount.toLocaleString();
  $('ticketBookingId').textContent = bookingId;

  // QR encodes all ticket details
  drawQR(bookingId, {
    movie: m.title,
    theatre: t.name + ', ' + t.location,
    date: dateStr,
    time: s.time + ' (' + s.format + ')',
    seats: state.selectedSeats.join(', '),
    amount: '₹' + totalAmount.toLocaleString()
  });

  // Download
  $('downloadTicket').onclick = async () => {
    try {
      const btn = $('downloadTicket');
      btn.innerHTML = '<div class="spinner" style="display:inline-block;width:16px;height:16px;border-width:2px;vertical-align:middle;margin-right:6px"></div> Generating...';
      btn.disabled = true;

      const ticketEl = $('ticketCard');

      // Use html2canvas to snapshot the ticket card
      const canvas = await html2canvas(ticketEl, {
        scale: 2,
        backgroundColor: '#0d0d1a',
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      const bookingId = $('ticketBookingId').textContent || 'ticket';
      pdf.save(`CinTic-${bookingId}.pdf`);

      btn.innerHTML = '📄 Download PDF';
      btn.disabled = false;
      showToast('✅ Ticket downloaded!');
    } catch (err) {
      console.error('PDF generation failed:', err);
      $('downloadTicket').innerHTML = '📄 Download PDF';
      $('downloadTicket').disabled = false;
      showToast('❌ Download failed. Try again.');
    }
  };
  $('shareTicket').onclick = () => {
    if (navigator.share && false) {
      navigator.share({ title: 'CinTic Ticket', text: `${m.title} at ${t.name} — ${s.time} on ${dateStr}` });
    } else {
      navigator.clipboard.writeText(`CinTic Ticket: ${m.title} at ${t.name}, ${s.time}, Seats: ${state.selectedSeats.join(', ')}`);
      showToast('🔗 Ticket link copied!');
    }
  };
}

function drawQR(bookingId, ticketInfo) {
  const container = $('qrCanvas').parentElement;
  container.innerHTML = '';
  try {
    // Encode full ticket details into the QR
    const qrData = JSON.stringify({
      id: bookingId,
      movie: ticketInfo.movie,
      theatre: ticketInfo.theatre,
      date: ticketInfo.date,
      time: ticketInfo.time,
      seats: ticketInfo.seats,
      amount: ticketInfo.amount
    });
    const qr = qrcode(0, 'M');
    qr.addData(qrData);
    qr.make();
    const img = document.createElement('div');
    img.innerHTML = qr.createImgTag(3, 6);
    const imgEl = img.querySelector('img');
    imgEl.style.borderRadius = '8px';
    imgEl.style.display = 'block';
    imgEl.style.maxWidth = '140px';
    container.appendChild(imgEl);
  } catch (e) {
    // Fallback: smaller data if QR overflows
    const canvas = document.createElement('canvas');
    canvas.id = 'qrCanvas';
    canvas.width = 120; canvas.height = 120;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 120, 120);
    ctx.fillStyle = '#000'; ctx.font = '9px monospace';
    ctx.fillText('ID: ' + bookingId, 8, 60);
  }
}
// ========== MY BOOKINGS ==========
function renderMyBookings() {
  const container = $('myBookingsList');
  if (!container) return;
  if (!state.user || !state.user.bookings || state.user.bookings.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:4rem;">No bookings found.</div>';
    return;
  }

  container.innerHTML = state.user.bookings.map(b => `
    <div class="ticket-card" style="margin: 0 auto; margin-bottom: 2rem;">
      <div class="ticket-card-header">
        <h3 style="margin:0">${b.movie}</h3>
        <span class="ticket-logo">CinTic</span>
      </div>
      <div class="ticket-card-body">
        <div class="ticket-field"><div class="tf-label">Theatre</div><div class="tf-value">${b.theatre}</div></div>
        <div class="ticket-field"><div class="tf-label">Date</div><div class="tf-value">${b.date}</div></div>
        <div class="ticket-field"><div class="tf-label">Time</div><div class="tf-value">${b.time}</div></div>
        <div class="ticket-field"><div class="tf-label">Seats</div><div class="tf-value">${b.seats}</div></div>
        <div class="ticket-field"><div class="tf-label">Amount Paid</div><div class="tf-value">₹${b.amount.toLocaleString()}</div></div>
        <div class="ticket-field"><div class="tf-label">Booking ID</div><div class="tf-value">${b.id}</div></div>
      </div>
    </div>
  `).join('');
}

// ========== THEME TOGGLE ==========
function initTheme() {
  const saved = localStorage.getItem('cintic_theme') || 'dark';
  applyTheme(saved);

  $('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('cintic_theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const knob = $('themeKnob');
  if (knob) knob.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// ========== INIT ==========
initTheme();
loadState();
initAuth();

// Auto-login if user exists
if (state.user) {
  $('authPage').classList.remove('active');
  $('mainApp').style.display = 'block';
  updateNavUser();
  initApp();
}
