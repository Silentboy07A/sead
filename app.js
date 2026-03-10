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
let state = {
  user: null,
  selectedMovie: null,
  selectedTheatre: null,
  selectedShow: null,
  selectedSeats: [],
  takenSeats: [],
};

// Restore from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem('cintic_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.user) state.user = parsed.user;
    }
  } catch (e) { }
}
function saveState() {
  localStorage.setItem('cintic_state', JSON.stringify({ user: state.user }));
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
    saveState();

    showToast(`Welcome, ${state.user.name}! 🎬`);
    enterApp();
  } catch (error) {
    console.error('Google Auth Error:', error);
    showToast('Failed to sign in with Google');
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
    state.user = { name, email };
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
    state.user = { name, email };
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
    $('navAvatar').textContent = state.user.name.charAt(0).toUpperCase();
    $('navUserName').textContent = state.user.name;
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
  if (genre && genre !== 'All') filtered = filtered.filter(m => m.genre === genre);
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(s) || m.genre.toLowerCase().includes(s) || m.language.toLowerCase().includes(s)
    );
  }
  if (lang) filtered = filtered.filter(m => m.language === lang);
  $('movieGrid').innerHTML = filtered.length ? filtered.map(m => `
    <div class="movie-card" data-id="${m.id}">
      <img class="movie-poster" src="${m.poster}" alt="${m.title}" onerror="this.style.background='linear-gradient(135deg,#1a1a2e,#16213e)'" loading="lazy">
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
  `).join('') : '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem">No movies found</p>';
}

// ========== SEARCH ==========
function initSearch() {
  $('searchInput').addEventListener('input', applyFilters);
  $('langFilter').addEventListener('change', applyFilters);
  $('cityFilter').addEventListener('change', applyFilters);
}
function applyFilters() {
  const search = $('searchInput').value;
  const lang = $('langFilter').value;
  const city = $('cityFilter').value;
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

  // User dropdown
  $('navUser').addEventListener('click', (e) => {
    e.stopPropagation();
    $('userDropdown').classList.toggle('show');
  });
  document.addEventListener('click', () => $('userDropdown').classList.remove('show'));

  // Logout
  $('logoutBtn').addEventListener('click', () => {
    state.user = null;
    localStorage.removeItem('cintic_state');
    $('mainApp').style.display = 'none';
    $('authPage').classList.add('active');
    // Reset forms
    $('loginForm').reset();
    $('signupForm').reset();
    $('loginBtn').disabled = true;
    $('signupBtn').disabled = true;
    showToast('Logged out successfully');
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

function showPage(id) {
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
    </div>
  `;
  const city = $('cityFilter').value;
  let theatres = THEATRES;
  if (city) theatres = theatres.filter(t => t.city === city);

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

// ========== SHOW SELECTION ==========
function selectShow(theatreId, showIndex) {
  const theatre = THEATRES.find(t => t.id === theatreId);
  state.selectedTheatre = theatre;
  state.selectedShow = theatre.shows[showIndex];
  state.selectedSeats = [];
  generateTakenSeats();
  renderSeats();
  showPage('seatSection');
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
      for (let s = 1; s <= 10; s++) {
        const seatId = row + s;
        const taken = state.takenSeats.includes(seatId);
        const selected = state.selectedSeats.includes(seatId);
        let cls = 'seat';
        if (taken) cls += ' taken';
        else if (selected) cls += ` selected${cat === 'gold' ? ' gold-cat' : ''}`;
        html += `<div class="${cls}" data-seat="${seatId}" data-cat="${cat}" ${taken ? '' : `onclick="toggleSeat('${seatId}','${cat}')"`}>${s}</div>`;
      }
      html += `<span class="seat-row-label">${row}</span></div>`;
    }
  }
  $('seatMap').innerHTML = html;
  updateSeatSummary();

  // Recommend button
  $('recommendBtn').onclick = recommendSeats;
  // Proceed
  $('proceedToPayment').onclick = () => {
    if (state.selectedSeats.length === 0) { showToast('Please select at least one seat'); return; }
    renderPayment();
    showPage('paymentSection');
  };
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

  // Payment method toggle
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

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
    $('confirmPayBtn').innerHTML = '<div class="spinner"></div> Processing...';
    $('confirmPayBtn').disabled = true;
    setTimeout(() => {
      renderTicket(total + convFee, dateStr);
      showPage('ticketSection');
      $('confirmPayBtn').innerHTML = '🔒 Confirm & Pay';
      $('confirmPayBtn').disabled = false;
    }, 2000);
  };
}

// ========== E-TICKET ==========
function renderTicket(totalAmount, dateStr) {
  const m = state.selectedMovie;
  const t = state.selectedTheatre;
  const s = state.selectedShow;
  const bookingId = 'CB' + Date.now().toString(36).toUpperCase();

  $('ticketMovieName').textContent = m.title;
  $('ticketTheatre').textContent = t.name + ', ' + t.location;
  $('ticketDate').textContent = dateStr;
  $('ticketTime').textContent = s.time + ' (' + s.format + ')';
  $('ticketSeats').textContent = state.selectedSeats.join(', ');
  $('ticketAmount').textContent = '₹' + totalAmount.toLocaleString();
  $('ticketBookingId').textContent = bookingId;

  // Simple QR placeholder
  drawQR(bookingId);

  // Download
  $('downloadTicket').onclick = () => showToast('📄 PDF download started!');
  $('shareTicket').onclick = () => {
    if (navigator.share && false) {
      navigator.share({ title: 'CinTic Ticket', text: `${m.title} at ${t.name} — ${s.time} on ${dateStr}` });
    } else {
      navigator.clipboard.writeText(`CinTic Ticket: ${m.title} at ${t.name}, ${s.time}, Seats: ${state.selectedSeats.join(', ')}`);
      showToast('🔗 Ticket link copied!');
    }
  };
}

function drawQR(text) {
  const container = $('qrCanvas').parentElement;
  container.innerHTML = '';
  try {
    const qr = qrcode(0, 'M');
    qr.addData('CINTIC-TICKET:' + text);
    qr.make();
    container.innerHTML = qr.createImgTag(3, 8);
    container.querySelector('img').style.borderRadius = '4px';
  } catch (e) {
    // Fallback canvas QR
    const canvas = document.createElement('canvas');
    canvas.id = 'qrCanvas';
    canvas.width = 120; canvas.height = 120;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 120, 120);
    ctx.fillStyle = '#000'; ctx.font = '10px Poppins';
    ctx.fillText(text, 10, 65);
  }
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
