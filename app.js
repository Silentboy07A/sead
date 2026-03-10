/* ============================================
   CINTIC — Movie Ticket Booking App
   Main Application Logic
   ============================================ */

// ========== MOCK DATA ==========
const MOVIES = [
  { id: 1, title: "Sinners", genre: "Thriller", language: "English", rating: 8.7, duration: "2h 17m", description: "Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.", poster: "https://image.tmdb.org/t/p/w500/tgCfQmMJQdMgjclPMbMbMFOSLkP.jpg" },
  { id: 2, title: "Superman", genre: "Action", language: "English", rating: 8.3, duration: "2h 32m", description: "Superman, a cub reporter in Metropolis, must balance his heritage with his human upbringing as the hero of Metropolis in James Gunn's DC Universe.", poster: "https://image.tmdb.org/t/p/w500/sJFnKOlRfJCHCmMFcAo9eJkTajI.jpg" },
  { id: 3, title: "Avatar: Fire and Ash", genre: "Sci-Fi", language: "English", rating: 8.5, duration: "3h 2m", description: "Jake Sully and Neytiri venture to the volcanic Ash People clan of Pandora, uncovering new wonders and facing an even deadlier threat.", poster: "https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg" },
  { id: 4, title: "A Minecraft Movie", genre: "Comedy", language: "English", rating: 7.2, duration: "1h 41m", description: "Four misfits are pulled through a portal into the Overworld, a bizarre cubic wonderland that thrives on imagination and must overcome it.", poster: "https://image.tmdb.org/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg" },
  { id: 5, title: "Wicked: For Good", genre: "Drama", language: "English", rating: 8.1, duration: "2h 40m", description: "The epic conclusion follows Elphaba's transformation into the Wicked Witch as political strife threatens to tear Oz apart.", poster: "https://image.tmdb.org/t/p/w500/tVnMCFf4a0sLKjYILc6bOh0c6nC.jpg" },
  { id: 6, title: "The Running Man", genre: "Action", language: "English", rating: 7.9, duration: "2h 10m", description: "In a dystopian America, a desperate man enters a deadly game show where convicted criminals must survive to win freedom.", poster: "https://image.tmdb.org/t/p/w500/mCl4JMjb3CdDZJAxblBVjR0EUqo.jpg" },
  { id: 7, title: "Lilo & Stitch", genre: "Comedy", language: "English", rating: 7.8, duration: "1h 48m", description: "A live-action reimagining of the beloved story about a lonely Hawaiian girl and the mischievous alien experiment who becomes her best friend.", poster: "https://image.tmdb.org/t/p/w500/2Mo4qFBqYEhdVqcAn8jEASG2CyW.jpg" },
  { id: 8, title: "Zootopia 2", genre: "Comedy", language: "English", rating: 8.0, duration: "1h 53m", description: "Judy Hopps and Nick Wilde face their biggest case yet when mysterious disappearances threaten the fragile peace of Zootopia.", poster: "https://image.tmdb.org/t/p/w500/65IW0HyPzlFnMBTlGkvnxJkif2R.jpg" },
  { id: 9, title: "Pushpa 2: The Rule", genre: "Action", language: "Hindi", rating: 7.5, duration: "3h 20m", description: "Pushpa Raj returns as the undisputed king of the red sandalwood syndicate, facing off against SP Bhanwar Singh Shekhawat.", poster: "https://image.tmdb.org/t/p/w500/bnmPFBjbRCgNhVgCGlNVFmqnLdD.jpg" },
  { id: 10, title: "28 Years Later", genre: "Thriller", language: "English", rating: 8.4, duration: "2h 28m", description: "Almost three decades after the original rage virus outbreak, a group of survivors face a horrifying new evolution of the plague on an isolated island.", poster: "https://image.tmdb.org/t/p/w500/ds5JKCx5Cz2cOfc0u5MoATVqXa3.jpg" },
  { id: 11, title: "Jurassic World Rebirth", genre: "Sci-Fi", language: "English", rating: 7.6, duration: "2h 15m", description: "Five years after the events of Dominion, a covert team must extract DNA from three massive dinosaurs in the wild.", poster: "https://image.tmdb.org/t/p/w500/6bQLRzMo2jCayvKSan8MBHmL1Mr.jpg" },
  { id: 12, title: "Sikandar", genre: "Action", language: "Hindi", rating: 7.3, duration: "2h 45m", description: "Salman Khan stars as a fearless warrior navigating a world of power and betrayal in this action-packed blockbuster directed by AR Murugadoss.", poster: "https://image.tmdb.org/t/p/w500/7TulCghb7G3KXRJL5pREaPsxjTu.jpg" },
];

const THEATRES = [
  {
    id: 1, name: "PVR IMAX Phoenix", location: "Lower Parel", city: "Mumbai", shows: [
      { time: "10:30 AM", format: "IMAX" }, { time: "1:45 PM", format: "3D" },
      { time: "5:00 PM", format: "IMAX" }, { time: "8:30 PM", format: "2D" }, { time: "10:45 PM", format: "3D" }
    ]
  },
  {
    id: 2, name: "INOX Megaplex", location: "Malad West", city: "Mumbai", shows: [
      { time: "11:00 AM", format: "2D" }, { time: "2:15 PM", format: "3D" },
      { time: "6:00 PM", format: "2D" }, { time: "9:30 PM", format: "3D" }
    ]
  },
  {
    id: 3, name: "Cinepolis DLF", location: "Vasant Kunj", city: "Delhi", shows: [
      { time: "9:30 AM", format: "2D" }, { time: "12:45 PM", format: "IMAX" },
      { time: "4:00 PM", format: "3D" }, { time: "7:15 PM", format: "IMAX" }, { time: "10:30 PM", format: "2D" }
    ]
  },
  {
    id: 4, name: "PVR Orion Mall", location: "Rajajinagar", city: "Bangalore", shows: [
      { time: "10:00 AM", format: "3D" }, { time: "1:30 PM", format: "2D" },
      { time: "5:30 PM", format: "IMAX" }, { time: "9:00 PM", format: "2D" }
    ]
  },
  {
    id: 5, name: "SPI Palazzo", location: "Anna Nagar", city: "Chennai", shows: [
      { time: "11:30 AM", format: "2D" }, { time: "3:00 PM", format: "3D" },
      { time: "6:30 PM", format: "2D" }, { time: "9:45 PM", format: "IMAX" }
    ]
  },
];

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
function initApp() {
  generateTakenSeats();
  renderHero();
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

// ========== INIT ==========
loadState();
initAuth();

// Auto-login if user exists
if (state.user) {
  $('authPage').classList.remove('active');
  $('mainApp').style.display = 'block';
  updateNavUser();
  initApp();
}
