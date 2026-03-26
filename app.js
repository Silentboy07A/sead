import { $, fetchWithTimeout, showToast, escapeHTML, debounce, getCookie, initCSRF } from './js/utils.js';
import API from './js/api.js';
import stateStore, { SEAT_PRICES, GENRES, SNACKS } from './js/state.js';
import { getDominantColor, updateTheme, initScrollAnimations } from './js/theme.js';

/* ============================================
   CINTIC — Movie Ticket Booking App
   Main Application Logic (Refactored)
   ============================================ */

// ---- EMERGENCY CACHE CLEAR ESCAPE HATCH ----
if (window.location.search.includes('reset=1')) {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((c) => { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  window.history.replaceState({}, document.title, window.location.pathname);
  window.location.reload(true);
}

// Initialize CSRF Protection
initCSRF();

// Use stateStore for global state
let state = stateStore.getState();
stateStore.subscribe((newState) => {
  state = newState;
});

// Helper for saving state
const saveState = () => {
  if (state.user) {
    localStorage.setItem('cintic_user', JSON.stringify(state.user));
  }
};


let isAuthInitialized = false;
function initAuth() {
  if (isAuthInitialized) return;
  isAuthInitialized = true;
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return; // Guard against redundant clicks
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
  $('loginPassword').addEventListener('input', () => { updateLoginBtn(); });
  $('loginPassword').addEventListener('blur', () => { if (!$('loginPassword').value) $('loginPassword').classList.remove('valid', 'invalid'); });

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

  // Guest Access
  const bypassAuth = () => {
    const authPage = $('authPage');
    if (authPage) authPage.remove();
    const mainApp = $('mainApp');
    if (mainApp) mainApp.style.display = 'block';
    const chatbot = document.getElementById('chatbotWidget');
    if (chatbot) chatbot.style.display = 'block';
    initApp();
  };

  if ($('guestLinkLogin')) $('guestLinkLogin').addEventListener('click', bypassAuth);
  if ($('guestLinkSignup')) $('guestLinkSignup').addEventListener('click', bypassAuth);

  // Initialize Google OAuth
  setTimeout(initGoogleAuth, 100);
}

let isGoogleAuthInitialized = false;
async function initGoogleAuth() {
  if (isGoogleAuthInitialized) return;
  
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
    isGoogleAuthInitialized = true;
  } catch (err) {
    console.error('Failed to init Google Auth:', err);
  }
}

async function handleEmailVerification(token, email) {
  showToast('Verifying your email...');
  try {
    const res = await API.auth.verifyEmail(token, email);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`✓ ${data.message}`, 6000);
    // Switch to login tab
    document.querySelectorAll('.auth-tab')[0].click();
    $('loginEmail').value = email;
    $('loginPassword').focus();
  } catch (err) {
    showToast(`✗ Verification failed: ${err.message}`, 6000);
  }
}

async function handleGoogleLogin(response) {
  try {
    const activeTab = document.querySelector('.auth-tab.active');
    const mode = activeTab ? activeTab.dataset.tab : 'login';

    const res = await API.auth.googleLogin(response.credential, mode);
    const data = await res.json();
    if (!res.ok) throw new Error(data.details || data.error || 'Google login failed');

    stateStore.setState({ user: { ...data.user, bookings: data.user.bookings || [] } });

    showToast(data.isNewUser ? `Welcome to CineBook, ${data.user.name}!` : `Welcome back, ${data.user.name}!`);
    enterApp();
  } catch (error) {
    console.error('Google Auth Error:', error);
    showToast('Google sign-in failed: ' + (error.message || 'Please try again'));
  }
}

function togglePassword(inputId, toggleId) {
  const inp = $(inputId);
  const tog = $(toggleId);
  if (inp.type === 'password') { 
    inp.type = 'text'; 
    tog.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>`;
  } else { 
    inp.type = 'password'; 
    tog.innerHTML = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>`;
  }
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
  if (bar && label) {
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
  }

  // Checklist
  const checklist = $(checklistId);
  if (checklist) {
    const items = checklist.querySelectorAll('.checklist-item');
    const ruleKeys = ['length', 'upper', 'lower', 'number', 'special'];
    const ruleLabels = ['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'];
    items.forEach((item, i) => {
      const passed = rules[ruleKeys[i]];
      item.classList.toggle('met', passed);
      item.textContent = (passed ? '✓ ' : '✗ ') + ruleLabels[i];
    });
  }

  // Input state
  inp.classList.remove('valid', 'invalid');
  if (val) inp.classList.add(allPassed ? 'valid' : 'invalid');

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
  const passOk = $('loginPassword').value.length > 0;
  $('loginBtn').disabled = !(emailOk && passOk);
}
function updateSignupBtn() {
  const nameOk = validateName();
  const emailOk = checkEmail($('signupEmail').value).valid;
  const passOk = checkPassword($('signupPassword').value).allPassed;
  const confOk = $('signupConfirm').value === $('signupPassword').value && $('signupConfirm').value.length > 0;
  $('signupBtn').disabled = !(nameOk && emailOk && passOk && confOk);
}

async function handleLogin(e) {
  e.preventDefault();
  const emailOk = validateLoginEmail();
  const passOk = validatePasswordField('loginPassword', 'loginPasswordError', 'loginStrengthBar', 'loginStrengthLabel', 'loginChecklist');
  if (!emailOk || !passOk) {
    $('authFormCard').classList.add('shake');
    setTimeout(() => $('authFormCard').classList.remove('shake'), 500);
    return;
  }
  const btn = $('loginBtn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled = true;

  try {
    const email = $('loginEmail').value;
    const password = $('loginPassword').value;

    const res = await API.auth.login(email, password);
    const data = await res.json();
    
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(data.error || 'Please verify your email before logging in.');
      }
      throw new Error(data.error || 'Login failed');
    }

    stateStore.setState({ user: data.user });
    btn.innerHTML = '✓';
    showToast(`Welcome back, ${data.user.name}!`);
    setTimeout(() => enterApp(), 1000);
  } catch (error) {
    console.error('Login error:', error);
    showToast(error.message);
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    $('authFormCard').classList.add('shake');
    setTimeout(() => $('authFormCard').classList.remove('shake'), 500);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  if ($('signupBtn').disabled) {
    $('authFormCard').classList.add('shake');
    setTimeout(() => $('authFormCard').classList.remove('shake'), 500);
    return;
  }
  const btn = $('signupBtn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled = true;

  try {
    const name = $('signupName').value;
    const email = $('signupEmail').value;
    const password = $('signupPassword').value;

    const res = await API.auth.register(name, email, password);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    btn.innerHTML = '✓';
    
    // Show verification message instead of entering app
    let successMsg = data.message;
    if (data.previewUrl) {
      successMsg += ` <a href="${data.previewUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--gold);text-decoration:underline;">[Test Email Link]</a>`;
      showToast(successMsg, 10000, true);
    } else {
      showToast(successMsg, 10000);
    }

    // Switch to login tab automatically
    setTimeout(() => {
      const loginTab = document.querySelectorAll('.auth-tab')[0];
      if (loginTab) loginTab.click();
      $('loginEmail').value = email;
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Signup error:', error);
    showToast(error.message);
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    $('authFormCard').classList.add('shake');
    setTimeout(() => $('authFormCard').classList.remove('shake'), 500);
  }
}

function enterApp() {
  // Use document.getElementById directly as a failsafe
  const authPage = document.getElementById('authPage');
  if (authPage) {
    authPage.classList.remove('active');
    authPage.style.display = 'none';
    authPage.style.visibility = 'hidden';
    authPage.style.pointerEvents = 'none';
    authPage.style.zIndex = '-1';
    authPage.remove();
    console.log('Auth page removed from DOM');
  }
  
  // Also kill any remaining .auth-page elements (paranoid cleanup)
  document.querySelectorAll('.auth-page').forEach(el => {
    el.remove();
    console.log('Removed stale .auth-page element');
  });
  
  const mainApp = document.getElementById('mainApp');
  if (mainApp) mainApp.style.display = 'block';
  
  const chatbot = document.getElementById('chatbotWidget');
  if (chatbot) chatbot.style.display = 'block'; 
  
  updateNavUser();
  initApp();
  
  // Delayed failsafe: re-check after 500ms to catch any race conditions
  setTimeout(() => {
    const ghost = document.getElementById('authPage');
    if (ghost) {
      ghost.remove();
      console.warn('Failsafe: removed ghost authPage');
    }
    document.querySelectorAll('.auth-page').forEach(el => el.remove());
  }, 500);
}

function updateNavUser() {
  if (state.user) {
    const initial = state.user.name.charAt(0).toUpperCase();
    $('navAvatar').textContent = initial;
    $('navUserName').textContent = state.user.name;
    // Show admin link if user is admin
    const adminLink = $('adminNavLink');
    if (adminLink) adminLink.style.display = state.user.isAdmin ? 'block' : 'none';
  }
}

// ========== PASSWORD RESET LOGIC ==========
function initPasswordReset() {
  const forgotLink = $('forgotPasswordLink');
  const forgotModal = $('forgotPasswordModal');
  const forgotForm = $('forgotPasswordForm');

  if (forgotLink && forgotModal && forgotForm) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.style.display = 'flex';
      $('forgotEmail').focus();
    });

    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('forgotEmail').value;
      const btn = $('forgotSubmitBtn');
      const originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const res = await API.auth.forgotPassword(email);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.testMode && data.resetLink) {
          showToast(`Test Link: <a href="${data.resetLink}" style="color:var(--gold);text-decoration:underline;">Click here to Reset</a>`, 10000);
        } else {
          showToast(data.message);
        }
        forgotModal.style.display = 'none';
        forgotForm.reset();
      } catch (err) {
        showToast(err.message);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // Check for reset token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('reset');
  const resetEmail = urlParams.get('email');

  if (resetToken && resetEmail) {
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Show reset modal
    const resetModal = $('resetPasswordModal');
    if (resetModal) {
      resetModal.style.display = 'flex';
      $('resetToken').value = resetToken;
      $('resetEmail').value = resetEmail;
      $('resetNewPassword').focus();
    }
  }

  const resetForm = $('resetPasswordForm');
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('resetEmail').value;
      const token = $('resetToken').value;
      const newPassword = $('resetNewPassword').value;
      
      const btn = $('resetSubmitBtn');
      const originalText = btn.textContent;
      btn.textContent = 'Updating...';
      btn.disabled = true;

      try {
        const res = await API.auth.resetPassword(email, token, newPassword);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast(data.message);
        $('resetPasswordModal').style.display = 'none';
        resetForm.reset();
        
        // Ensure user is on login tab
        const loginTab = document.querySelectorAll('.auth-tab')[0];
        if (loginTab) loginTab.click();
        $('loginEmail').value = email;
        $('loginPassword').focus();
      } catch (err) {
        showToast(err.message);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }
}

// ========== MAIN APP INIT ==========
let isAppInitialized = false;
async function initApp() {
  if (isAppInitialized) return;
  isAppInitialized = true;

  const grid = $('movieGrid');
  if (grid) {
    grid.innerHTML = Array(8).fill(0).map(() => `
      <div class="movie-card skeleton">
        <div class="skeleton-shimmer"></div>
        <div style="height:350px;" class="skeleton-box"></div>
        <div style="padding:1.5rem">
          <div style="height:20px;width:70%;margin-bottom:10px;" class="skeleton-box"></div>
          <div style="height:15px;width:40%;" class="skeleton-box"></div>
        </div>
      </div>
    `).join('');
  }

  try {
    const [moviesRes, theatresRes] = await Promise.all([
      API.movies.getAll(),
      API.theatres.getAll()
    ]);

    if (!moviesRes.ok || !theatresRes.ok) throw new Error('Failed to fetch data');

    let movies = await moviesRes.json();
    let theatres = await theatresRes.json();

    // Rewrite TMDB poster URLs through local proxy to avoid CORS issues
    movies = movies.map(m => {
      let posterUrl = m.poster;
      if (posterUrl && (posterUrl.includes('image.tmdb.org') || posterUrl.startsWith('https://image.tmdb.org'))) {
        posterUrl = `/api/poster?url=${encodeURIComponent(posterUrl)}`;
      }
      return { ...m, poster: posterUrl };
    });

    stateStore.setState({ movies, theatres });

  } catch (error) {
    console.error('Error fetching data:', error);
    showToast('Failed to load data from database.');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--red)">Failed to load data.</div>';
    return;
  }

  generateTakenSeats();

  if (state.movies.length > 0) {
    renderHero();
  }

  renderGenreTabs();
  renderMovies('All');
  initNavigation();
  initSearch();
  initChatbot();

  // Initialize scroll animations
  window.movieScrollObserver = initScrollAnimations();
}

function generateTakenSeats() {
  const takenSeats = [];
  const rows = 'ABCDEFGHIJ';
  for (let i = 0; i < 15; i++) {
    const r = rows[Math.floor(Math.random() * 10)];
    const s = Math.floor(Math.random() * 10) + 1;
    const seat = r + s;
    if (!takenSeats.includes(seat)) takenSeats.push(seat);
  }
  stateStore.setState({ takenSeats });
}

// ========== HERO ==========
async function renderHero() {
  const m = state.movies[0];
  if (!m) return;
  const posterUrl = m.poster;
  
  const heroBg = $('heroBg');
  const heroTitle = $('heroTitle');
  const heroRating = $('heroRating');
  const heroDuration = $('heroDuration');
  const heroDesc = $('heroDesc');
  const heroGenreTags = $('heroGenreTags');
  const heroBookBtn = $('heroBookBtn');

  if (heroBg) heroBg.style.backgroundImage = `url(${posterUrl})`;
  if (heroTitle) heroTitle.textContent = m.title;
  if (heroRating) heroRating.textContent = 'Rating ' + m.rating;
  if (heroDuration) heroDuration.textContent = m.duration + ' • ' + m.language;
  if (heroDesc) heroDesc.textContent = m.description;
  
  if (heroGenreTags) {
    heroGenreTags.textContent = '';
    const gSpan = document.createElement('span');
    gSpan.className = 'genre-tag';
    gSpan.textContent = m.genre;
    const lSpan = document.createElement('span');
    lSpan.className = 'genre-tag';
    lSpan.textContent = m.language;
    heroGenreTags.appendChild(gSpan);
    heroGenreTags.appendChild(lSpan);
  }

  if (heroBookBtn) heroBookBtn.onclick = () => selectMovie(m);

  // Dynamic Theme Extraction for Hero
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = posterUrl;
  img.onload = async () => {
    const color = await getDominantColor(img);
    updateTheme(color);
  };
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
  let filtered = state.movies;
  if (genre && genre !== 'All') filtered = filtered.filter(m => m.genre.includes(genre));
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(s) || m.genre.toLowerCase().includes(s) || m.language.toLowerCase().includes(s)
    );
  }
  if (lang) filtered = filtered.filter(m => m.language === lang);
  
  if (city) {
    // Only show movies that have shows in the selected city
    const theatresInCity = state.theatres.filter(t => t.city === city);
    filtered = filtered.filter(m => {
      return theatresInCity.some(t => t.shows && t.shows.length > 0);
      // Note: In this app's seed, every theatre has all movies effectively (simplified)
      // but we filter by the existence of any theatre in that city to start.
    });
  }

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
        <img class="movie-poster" src="${escapeHTML(m.poster)}" alt="${escapeHTML(m.title)}" onerror="${onErr}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;position:absolute;top:0;left:0">
        <div id="${fallbackId}" style="display:none;background:linear-gradient(160deg,${gc[0]},${gc[1]});width:100%;height:100%;align-items:center;justify-content:center;flex-direction:column;padding:1.2rem;text-align:center;position:absolute;top:0;left:0">
          <div style="font-size:2.8rem;margin-bottom:0.6rem;opacity:0.5;color:#fff">
            <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
          </div>
          <div style="color:#fff;font-weight:700;font-size:0.95rem;line-height:1.3;font-family:Poppins,sans-serif">${escapeHTML(m.title)}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:0.75rem;margin-top:0.4rem">${escapeHTML(m.language)} • ${escapeHTML(m.genre)}</div>
        </div>
        <div class="movie-overlay">
          <div class="overlay-content">
            <button class="play-btn" onclick="openTrailer('${escapeHTML(m.trailerId)}', event)">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <p>${escapeHTML(m.description.substring(0, 80))}...</p>
          </div>
        </div>
        <div class="rating-badge">${escapeHTML(m.rating)}</div>
      </div>
      <div class="movie-info">
        <h3>${escapeHTML(m.title)}</h3>
        <div class="movie-meta">
          <span>${escapeHTML(m.year)} • ${escapeHTML(m.language)}</span>
          <span class="genre-tag">${escapeHTML(m.genre)}</span>
        </div>
        <button class="btn-book" onclick="selectMovie(${m.id})">Book Now</button>
      </div>
    </div>
  `}).join('') : '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem">No movies found</p>';

  // Removed 3D Tilt logic
}

// ========== SEARCH ==========
function initSearch() {
  const debouncedApplyFilters = debounce(applyFilters, 300);
  const debouncedRenderTheatres = debounce(renderTheatres, 300);
  
  $('globalSearchInput').addEventListener('input', () => {
    if ($('moviesSection').classList.contains('active')) {
      debouncedApplyFilters();
    } else if ($('theatreSection').classList.contains('active')) {
      debouncedRenderTheatres();
    }
  });
  
  $('langFilter').addEventListener('change', debouncedApplyFilters);
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
          showToast(`Location detected: ${city}`);
        } else {
          throw new Error('City not found');
        }
      } catch (err) {
        console.warn('Geolocation failed:', err);
        showToast('Could not detect location.');
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
  const searchInput = $('globalSearchInput');
  const search = searchInput ? searchInput.value : '';
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
  const logoutBtns = [$('logoutBtn'), $('mobileLogoutBtn')].filter(Boolean);
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // Set a flag to prevent immediate auto-login loop
        sessionStorage.setItem('just_logged_out', 'true');
        localStorage.removeItem('cintic_user'); // Clear local state
        await fetch('/api/auth/logout', { credentials: 'same-origin' });
      } catch (err) { console.warn('Logout fetch failed:', err); }
      state.user = null;
      window.location.reload();
    });
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

      const matchedMovies = state.movies.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.genre.toLowerCase().includes(query)
      ).slice(0, 5); // top 5 results

      const matchedTheatres = state.theatres.filter(t =>
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
                <div style="font-size:0.9rem;font-weight:500;">${escapeHTML(m.title)}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(m.genre)}</div>
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
              <div style="font-size:1.2rem;opacity:0.6;"></div>
              <div>
                <div style="font-size:0.9rem;font-weight:500;">${escapeHTML(t.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(t.location)}, ${escapeHTML(t.city)}</div>
              </div>
            </div>
          `;
        });
      }

      if (html === '') {
        html = '<div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">No results found.</div>';
      } else {
        html += `
          <div style="margin:0.5rem 0;border-top:1px solid rgba(255,255,255,0.1);"></div>
          <div class="global-search-item" onclick="viewAllResults()" style="padding:0.6rem;border-radius:0.5rem;cursor:pointer;text-align:center;color:var(--red);font-weight:600;font-size:0.85rem;">
            View all results for "${escapeHTML(query)}"
          </div>
        `;
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
      
      // Update points UI
      const points = state.user.points || 0;
      const progress = Math.min(100, (points / 1000) * 100);
      $('profilePoints').textContent = points.toLocaleString();
      $('pointsProgress').style.width = progress + '%';
      $('pointsToNext').textContent = points >= 1000 ? 'You have a free snack!' : `${1000 - points} more to free snack`;
    }
    if ($('userDropdown')) $('userDropdown').classList.remove('show');
    $('profileModal').style.display = 'flex';
  });

  // Mobile Profile Button
  if ($('mobileProfileBtn')) {
    $('mobileProfileBtn').addEventListener('click', (e) => {
      e.preventDefault();
      if (state.user) {
        $('profileName').textContent = state.user.name;
        $('profileEmail').textContent = state.user.email;
        $('profileAvatar').textContent = state.user.name.charAt(0).toUpperCase();
        $('profileJoined').textContent = 'Today';
      }
      $('profileModal').style.display = 'flex';
    });
  }

  // Bottom Nav Interactions
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      if (section) {
        showPage(section);
      }
    });
  });

  // Back buttons
  $('backToMovies').addEventListener('click', () => showPage('heroSection'));
  $('backToTheatres').addEventListener('click', () => showPage('theatreSection'));
  $('backToSeats').addEventListener('click', () => showPage('seatSection'));
  $('backToSeatsFromSnacks').addEventListener('click', () => showPage('seatSection'));
  $('backToHome').addEventListener('click', () => {
    state.selectedMovie = null;
    state.selectedSeats = [];
    state.selectedSnacks = {};
    showPage('heroSection');
  });

  // Snacks Navigation
  $('skipSnacks').addEventListener('click', () => {
    state.selectedSnacks = {};
    renderPayment();
    showPage('paymentSection');
  });

  // Persona Selection
  document.querySelectorAll('.persona-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.persona-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activePersona = btn.dataset.persona;
      recommendSeats(); // Auto-update recommendation
    });
  });

  // Real-time group size listener
  const groupSizeInput = $('groupSize');
  if (groupSizeInput) {
    groupSizeInput.addEventListener('input', () => {
      recommendSeats();
    });
  }
}

// ========== GLOBAL SEARCH HELPERS ==========
function selectMovieFromGlobal(movieId) {
  const movie = state.movies.find(m => m.id === movieId);
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
  const theatre = state.theatres.find(t => t.id === theatreId);
  if (searchInput && theatre) {
    searchInput.value = theatre.name;
    renderTheatres();
  }
}

function viewAllResults() {
  const query = $('globalSearchInput').value;
  if ($('globalSearchResults')) $('globalSearchResults').style.display = 'none';
  showPage('moviesSection');
  applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (id === 'theatreSection') {
    renderTheatres();
  }
  
  if (id === 'snacksSection') {
    renderSnacks();
    // Handle standalone vs booking context
    const isBooking = state.selectedSeats.length > 0;
    const backBtn = $('backToSeatsFromSnacks');
    const skipBtn = $('skipSnacks');
    const confirmBtn = $('confirmSnacks');

    if (backBtn) backBtn.style.display = isBooking ? 'block' : 'none';
    if (skipBtn) skipBtn.style.display = isBooking ? 'block' : 'none';
    
    // Update confirm button text and logic
    if (confirmBtn) {
      if (isBooking) {
        confirmBtn.onclick = () => {
          renderPayment();
          showPage('paymentSection');
        };
      } else {
        confirmBtn.onclick = () => {
          showToast('Browse our snacks! Select a movie to book & eat.');
          showPage('heroSection');
        };
      }
    }
  }
  
  const pages = document.querySelectorAll('#mainApp .page');
  pages.forEach(p => {
    p.classList.remove('active');
    p.style.opacity = '0';
    p.style.transform = 'translateY(8px)';
  });

  const activePage = $(id);
  activePage.classList.add('active');
  
  // Smooth Entry Animation
  setTimeout(() => {
    activePage.style.transition = 'all 0.4s cubic-bezier(0.2, 0, 0.2, 1)';
    activePage.style.opacity = '1';
    activePage.style.transform = 'translateY(0)';
  }, 50);
  
  // Desktop Nav Links
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navA = document.querySelector(`.nav-links a[data-section="${id}"]`);
  if (navA) navA.classList.add('active');

  // Bottom Nav Links
  document.querySelectorAll('.bottom-nav-item').forEach(a => a.classList.remove('active'));
  const bottomA = document.querySelector(`.bottom-nav-item[data-section="${id}"]`);
  if (bottomA) bottomA.classList.add('active');

  window.scrollTo(0, 0);
}

// ========== MOVIE SELECTION ==========
function selectMovie(movieOrId) {
  if (typeof movieOrId === 'number' || typeof movieOrId === 'string' || !movieOrId.title) {
    const id = (typeof movieOrId === 'object') ? movieOrId.id : movieOrId;
    state.selectedMovie = state.movies.find(m => m.id == id);
  } else {
    state.selectedMovie = movieOrId;
  }
  
  if (!state.selectedMovie) {
    console.error('Movie selection failed: Movie not found');
    showToast('Something went wrong. Please select another movie.');
    return;
  }

  state.selectedShow = null;
  state.selectedSeats = [];
  renderTheatres();

  showPage('theatreSection');
}

// ========== THEATRE RENDERING ==========
function renderTheatres() {
  const m = state.selectedMovie;

  if (m) {
    if ($('selectedMovieInfo')) {
      $('selectedMovieInfo').style.display = 'flex';
      const bgUrl = m.poster || '';
      $('selectedMovieInfo').style.setProperty('--movie-bg', bgUrl ? `url(${bgUrl})` : 'none');
      
      const posterHtml = m.poster 
        ? `<img src="${m.poster}" alt="${escapeHTML(m.title)}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=No+Poster'">`
        : `<div class="movie-poster-placeholder" style="width:150px;height:220px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.6);z-index:1;position:relative;">
             <div class="premium-sparkle-icon">
               <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M12 2l2.4 7.2L22 12l-7.6 2.4L12 22l-2.4-7.2L2 12l7.6-2.4z"/></svg>
             </div>
           </div>`;

      $('selectedMovieInfo').innerHTML = `
        ${posterHtml}
        <div class="movie-details">
          <h3>${escapeHTML(m.title) || 'Movie Details'}</h3>
          <p>
            ${escapeHTML(m.genre) || 'Various'} • 
            ${escapeHTML(m.language) || 'Multiple'} • 
            ${escapeHTML(m.duration) || 'N/A'} • 
            Rating ${escapeHTML(m.rating) || 'N/A'}
          </p>
          ${m.trailerId ? `<button onclick="openTrailer('${m.trailerId}')" class="btn-primary" style="margin-top:12px; padding:0.6rem 1.2rem; font-size:0.85rem; border-radius: 50px;">Watch Trailer</button>` : ''}
        </div>
      `;
    }
  } else {
    if ($('selectedMovieInfo')) {
      $('selectedMovieInfo').style.display = 'none';
      $('selectedMovieInfo').innerHTML = '';
    }
  }

  const city = $('cityFilter').value;
  let theatres = state.theatres;
  if (city) theatres = theatres.filter(t => t.city === city);

  const searchInput = $('globalSearchInput');
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
        <h3>${escapeHTML(t.name)}</h3>
        <p class="location">${escapeHTML(t.location)}, ${escapeHTML(t.city)}</p>
        ${m ? `
        <div class="show-times">
          ${t.shows.map((s, i) => `
            <div class="show-badge" onclick="selectShow(${t.id}, ${i})" data-theatre="${t.id}" data-show="${i}">
              <span>${escapeHTML(s.time)}</span>
              <span class="format">${escapeHTML(s.format)}</span>
            </div>
          `).join('')}
        </div>` : '<p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem">Select a movie from the home page to see available showtimes here.</p>'}
      </div>
    `).join('');
  }
}

// ========== SHOW SELECTION ==========
async function selectShow(theatreId, showIndex) {
  // Tactile feedback (vibration) for mobile
  if (navigator.vibrate) navigator.vibrate(15);

  const theatre = state.theatres.find(t => t.id === theatreId);
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
    if (res.ok) {
      if (data.lockedSeats) state.lockedSeats = data.lockedSeats;
      if (data.bookedSeats) state.takenSeats = data.bookedSeats;
    }
  } catch (e) {
    console.error('Failed to check locked seats', e);
  }

  // Availability is checked via /api/check-locked-seats
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
  $('seatMap').innerHTML = `
    <div class="seat-map-wrapper">
      <div class="scanning-overlay" id="scanningOverlay">
        <div class="scan-line"></div>
      </div>
      <div class="seat-grid-container">
        ${html}
      </div>
    </div>
  `;
  updateSeatSummary();

  // Recommend button
  $('recommendBtn').onclick = recommendSeats;
  // Proceed to Snacks
  $('proceedToSnacks').onclick = async () => {
    if (state.selectedSeats.length === 0) { showToast('Please select at least one seat'); return; }

    const btn = $('proceedToSnacks');
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
        renderSnacks();
        showPage('snacksSection');
      } else {
        showToast(data.message || 'Failed to lock seats. Someone else may have grabbed them!');
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

// ========== SNACKS RENDERING ==========
function renderSnacks() {
  const grid = $('snacksGrid');
  if (!grid) return;

  grid.innerHTML = SNACKS.map(s => {
    const qty = state.selectedSnacks[s.id] || 0;
    return `
      <div class="snack-card ${qty > 0 ? 'selected' : ''}">
        <div class="snack-img">
          <img src="${escapeHTML(s.image)}" alt="${escapeHTML(s.name)}">
          <div class="snack-cat">${escapeHTML(s.category)}</div>
        </div>
        <div class="snack-info">
          <h4>${escapeHTML(s.name)}</h4>
          ${s.desc ? `<p>${escapeHTML(s.desc)}</p>` : ''}
          <div class="snack-price-row">
            <span class="price">₹${escapeHTML(s.price)}</span>
            <div class="snack-qty-control">
              <button onclick="updateSnackQty('${s.id}', -1, event)">-</button>
              <span>${qty}</span>
              <button onclick="updateSnackQty('${s.id}', 1, event)">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateSnacksSummary();
  renderSnackTray();
}

function renderSnackTray() {
  const tray = $('snackTrayItems');
  if (!tray) return;

  const selectedEntries = Object.entries(state.selectedSnacks);
  if (selectedEntries.length === 0) {
    tray.innerHTML = '<p style="color:rgba(255,255,255,0.2);font-size:0.8rem;width:100%;text-align:center;">Add snacks to build your combo</p>';
    return;
  }

  tray.innerHTML = selectedEntries.map(([id, qty]) => {
    const snack = SNACKS.find(s => s.id === id);
    if (!snack) return '';
    return `
      <div class="tray-item" title="${escapeHTML(snack.name)}">
        <img src="${escapeHTML(snack.image)}" alt="${escapeHTML(snack.name)}">
        <div class="badge">${qty}</div>
      </div>
    `;
  }).join('');
}

function updateSnackQty(id, delta, event) {
  const current = state.selectedSnacks[id] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete state.selectedSnacks[id];
  else state.selectedSnacks[id] = next;
  
  if (navigator.vibrate) navigator.vibrate(5);
  
  // Trigger animation if adding
  if (delta > 0 && event) {
    animateSnackToTray(id, event.target);
  }

  renderSnacks();

  // Add pop animation to the changed card
  const card = document.querySelector(`.snack-card:has(button[onclick*="'${id}'"])`);
  if (card) {
    card.classList.remove('pop-anim');
    void card.offsetWidth; // trigger reflow
    card.classList.add('pop-anim');
  }
}

function animateSnackToTray(snackId, targetElement) {
  const snack = SNACKS.find(s => s.id === snackId);
  if (!snack) return;

  const rect = targetElement.getBoundingClientRect();
  const flying = document.createElement('img');
  flying.src = snack.image;
  flying.className = 'flying-snack';
  
  // Start position
  flying.style.left = `${rect.left}px`;
  flying.style.top = `${rect.top}px`;
  document.body.appendChild(flying);

  // Target position (Tray)
  const tray = $('snackTrayItems');
  const trayRect = tray.getBoundingClientRect();
  const targetX = trayRect.left + trayRect.width / 2;
  const targetY = trayRect.top + trayRect.height / 2;

  // Animate using Web Animations API
  flying.animate([
    { 
      left: `${rect.left}px`, 
      top: `${rect.top}px`, 
      transform: 'scale(1) rotate(0deg)',
      opacity: 1 
    },
    { 
      left: `${targetX}px`, 
      top: `${targetY}px`, 
      transform: 'scale(0.3) rotate(360deg)',
      opacity: 0.5 
    }
  ], {
    duration: 800,
    easing: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)', // Gravity/arc feel
    fill: 'forwards'
  }).onfinish = () => {
    flying.remove();
    // Small bounce on tray
    tray.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.02)' },
      { transform: 'scale(1)' }
    ], { duration: 200 });
  };
}

function updateSnacksSummary() {
  let total = 0;
  let count = 0;
  Object.entries(state.selectedSnacks).forEach(([id, qty]) => {
    const snack = SNACKS.find(s => s.id === id);
    if (snack) {
      total += snack.price * qty;
      count += qty;
    }
  });

  $('snacksCount').textContent = `${count} item${count !== 1 ? 's' : ''} added`;
  $('snacksTotal').textContent = `Total: ₹${total.toLocaleString()}`;
  
  const confirmBtn = $('confirmSnacks');
  if (count > 0) {
    confirmBtn.textContent = 'Add & Continue →';
    confirmBtn.classList.add('pulse');
  } else {
    confirmBtn.textContent = 'Continue →';
    confirmBtn.classList.remove('pulse');
  }
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
      if (timerDiv) timerDiv.innerHTML = 'Seat lock expired!';
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
      timerDiv.innerHTML = `Seats locked for: <span>${minutes}:${seconds < 10 ? '0' : ''}${seconds}</span>`;
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
  const seatEl = document.querySelector(`.seat[data-seat="${seatId}"]`);
  
  if (idx === -1) {
    state.selectedSeats.push(seatId);
    if (seatEl) {
      seatEl.classList.add('selected');
      if (cat === 'gold') seatEl.classList.add('gold-cat');
    }
  } else {
    state.selectedSeats.splice(idx, 1);
    if (seatEl) {
      seatEl.classList.remove('selected', 'gold-cat', 'recommended');
    }
  }
  updateSeatSummary();
}

function updateSeatSummary() {
  const summary = $('seatSummary');
  if (state.selectedSeats.length === 0) { summary.style.display = 'none'; return; }
  summary.style.display = 'flex';
  $('selectedSeatsList').textContent = state.selectedSeats.join(', ');
  
  const capacity = (state.takenSeats.length + state.lockedSeats.length) / 100;
  const isHighDemand = capacity >= 0.8;
  if ($('highDemandBadge')) $('highDemandBadge').style.display = isHighDemand ? 'block' : 'none';

  let total = 0;
  const cats = {};
  state.selectedSeats.forEach(s => {
    const row = s.charAt(0);
    let cat = 'silver';
    if ('ABC'.includes(row)) cat = 'gold';
    else if ('HIJ'.includes(row)) cat = 'platinum';
    
    let price = SEAT_PRICES[cat];
    if (isHighDemand && cat === 'platinum') price = Math.floor(price * 1.15);
    if (isHighDemand && cat === 'gold') price = Math.floor(price * 0.90);
    
    total += price;
    cats[cat] = (cats[cat] || 0) + 1;
  });
  $('totalPrice').textContent = total.toLocaleString();
  $('seatCategoryInfo').textContent = Object.entries(cats).map(([c, n]) => `${n} ${c}`).join(' + ');
}

// ========== SMART RECOMMENDATION ==========
let isAiScanning = false;
async function runAiScanning(duration = 2000) {
  if (isAiScanning) return; // Prevent rapid invocations (CodeRabbit)
  isAiScanning = true;
  
  const overlay = $('scanningOverlay');
  if (!overlay) { isAiScanning = false; return; }
  
  overlay.classList.add('active');
  if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
  
  return new Promise(resolve => {
    setTimeout(() => {
      overlay.classList.remove('active');
      isAiScanning = false;
      resolve();
    }, duration);
  });
}

async function recommendSeats() {
  const n = parseInt($('groupSize') ? $('groupSize').value : 2) || 2;
  const persona = state.activePersona || 'Cinephile';
  
  // 1. Waitlist / Rush Seating Analytics
  let isRushHour = false;
  try {
    const showTimeStr = state.selectedShow?.time;
    if (showTimeStr) {
      const now = new Date();
      const showDate = new Date();
      const match = showTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1], 10);
        let m = parseInt(match[2], 10);
        if (match[3]) {
          if (match[3].toUpperCase() === 'PM' && h < 12) h += 12;
          if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
        }
        showDate.setHours(h, m, 0, 0);
        const diffMins = (showDate.getTime() - now.getTime()) / 60000;
        // Rush hour: 35 minutes before start, up to 30 mins after start
        if (diffMins <= 35 && diffMins >= -30) isRushHour = true;
      }
    }
  } catch (e) {
    console.warn('Rush hour parse failed', e);
  }

  if (isRushHour) {
    showToast("🕒 RUSH SEATING ACTIVE: Premium Front Rows (A-C) unlocked for walk-ins!");
  }

  // 1.5 ACCESSIBILITY (ADA) BYPASS
  const isAda = $('adaToggle') && $('adaToggle').checked;
  if (isAda) {
    const adaBlocks = [['J1', 'J2'], ['J9', 'J10'], ['D1', 'D2'], ['D9', 'D10']];
    state.selectedSeats = [];
    for (const block of adaBlocks) {
      if (block.every(s => !state.takenSeats.includes(s) && !state.lockedSeats.includes(s))) {
        state.selectedSeats = block.slice(0, n);
        if (n > 2) {
           const otherBlock = adaBlocks.find(b => b !== block && b.every(s => !state.takenSeats.includes(s) && !state.lockedSeats.includes(s)));
           if (otherBlock) state.selectedSeats = state.selectedSeats.concat(otherBlock.slice(0, n - 2));
        }
        break;
      }
    }
    if (state.selectedSeats.length > 0) {
      updateSeatSummary();
      showToast(`ADA Mode: Secured ${state.selectedSeats.length} accessible seats.`);
      renderSeats();
      return;
    } else {
      showToast("ADA Mode: All accessible designated blocks are taken.");
      renderSeats();
      return;
    }
  }


  // 2. Dynamic Scanning Simulation with "Prime Zone" discovery
  await runAiScanning(2500); 
  
  state.selectedSeats = [];
  const rows = 'ABCDEFGHIJ'.split('');
  let seatOptions = [];

  // 3. VISION PHYSICS: Priority Matrix
  
  for (const row of rows) {
    const rowIndex = rows.indexOf(row);
    // WAITLIST BLOCK: Exclude Rows A-C unless Rush Hour is active
    if (!isRushHour && rowIndex < 3) continue;
    
    const available = [];
    for (let s = 1; s <= 10; s++) {
      const seatId = row + s;
      if (!state.takenSeats.includes(seatId) && !state.lockedSeats.includes(seatId)) available.push(seatId);
    }

    // Find consecutive potential blocks
    for (let i = 0; i <= available.length - n; i++) {
      const chunk = available.slice(i, i + n);
      const nums = chunk.map(s => parseInt(s.slice(1)));
      const isConsecutive = nums.every((v, j) => {
          if (j === 0) return true;
          if (v !== nums[j - 1] + 1) return false;
          // Aisle check: seats are numerically consecutive but physically separated
          if (nums[j-1] === 3 && v === 4) return false;
          if (nums[j-1] === 7 && v === 8) return false;
          return true;
      });
      
        if (isConsecutive) {
          const avgPos = nums.reduce((a, b) => a + b, 0) / n;
          const rowIndex = rows.indexOf(row);
          const y = rowIndex + 1; // 1-indexed (A=1, J=10)
          const x = avgPos;
          
          let score = 0;
          
          if (persona === 'Couple') {
             // Prefer Platinum (Rows H, I, J -> y=8,9,10) and corners
             const yDist = Math.abs(10 - y); 
             const xDist = Math.min(Math.abs(1 - x), Math.abs(10 - x)); // Distance to nearest edge
             score = yDist * 2 + xDist;
             if (y < 8) score += 20; // Heavy penalty for non-platinum
          } else if (persona === 'Introvert') {
             // Prefer Corners, strictly NOT platinum
             const xDist = Math.min(Math.abs(1 - x), Math.abs(10 - x));
             let yDist = Math.abs(4 - y); // Row D is y=4
             score = yDist * 0.5 + xDist * 2;
             if (y >= 8) score += 20; // Exclude Platinum
             
             let neighborsCount = 0;
             nums.forEach(s => {
               if (state.takenSeats.includes(row + (s-1)) || state.lockedSeats.includes(row + (s-1))) neighborsCount++;
               if (state.takenSeats.includes(row + (s+1)) || state.lockedSeats.includes(row + (s+1))) neighborsCount++;
             });
             score += neighborsCount * 5; // Heavy penalty for neighbors
          } else {
             // ---------------------------------------------------------
             // TRUE VIEWING ANGLE (ARC CALCULUS ALGORITHM)
             // ---------------------------------------------------------
             // 1. Neck Strain (Vertical Angle) & AI Target Override
             // Rows 1-3 have severe neck strain. Rows 5-7 are ideal.
             let neckStrain = 0;
             if (y < 4) neckStrain = (4 - y) * 3; // +3 to +9 penalty
             else if (y > 7) neckStrain = (y - 7) * 1.5; // Slight penalty for far back
             
             
             // 2. Parallax Skew (Horizontal Viewing Cone)
             // Skew matters A LOT in the front row, but barely matters in the back row.
             // We divide the horizontal distance from center by the depth squared.
             const xDistFromCenter = Math.abs(5.5 - x);
             const depthFactor = y + 2; // +2 offsets the screen distance
             const parallaxSkew = (xDistFromCenter * xDistFromCenter) / depthFactor * 2;
             
             // 3. Anti-Stranding Logic
             // Penalize leaving exactly 1 empty seat next to the chunk
             let strandingPenalty = 0;
             const leftSeatObj = row + (nums[0] - 2);
             const leftSeatBoundary = row + (nums[0] - 1);
             const rightSeatObj = row + (nums[nums.length-1] + 2);
             const rightSeatBoundary = row + (nums[nums.length-1] + 1);
             
             const isLeftStranded = (!state.takenSeats.includes(leftSeatBoundary) && !state.lockedSeats.includes(leftSeatBoundary) && nums[0] - 1 > 0) &&
                                    (nums[0] - 2 === 0 || state.takenSeats.includes(leftSeatObj) || state.lockedSeats.includes(leftSeatObj));
             const isRightStranded = (!state.takenSeats.includes(rightSeatBoundary) && !state.lockedSeats.includes(rightSeatBoundary) && nums[nums.length-1] + 1 <= 10) &&
                                     (nums[nums.length-1] + 2 > 10 || state.takenSeats.includes(rightSeatObj) || state.lockedSeats.includes(rightSeatObj));
             
             if (isLeftStranded) strandingPenalty += 4;
             if (isRightStranded) strandingPenalty += 4;
             
             score = neckStrain + parallaxSkew + strandingPenalty;
             
             // Cinephile is stricter on the sweet spot, Family is more forgiving but strongly hates stranding
             if (persona === 'Cinephile') {
                if (xDistFromCenter < 1.5 && y >= 5 && y <= 7) score -= 3; // Huge bonus for perfect center
             } else if (persona === 'Friends' || persona === 'Family') {
                if (strandingPenalty > 0) score += 5; // Absolutely hate stranding
             }
          }
          
          score += Math.random() * 0.2; // Tiny tie-breaker
          seatOptions.push({ chunk, score });
        }
    }
  }

    // 3. CLUSTER IQ: If no premium large block found, split into Mirror Clusters (especially for 4+)
    if (seatOptions.length === 0 && n >= 4) {
      const splitSize = Math.floor(n / 2);
      const rem = n - splitSize; // Renamed to avoid confusion (CodeRabbit)
      
      // Attempt to find two separate blocks
      let subOptions = [];
      
      // Find all possible smaller blocks
      const smallerBlocks = [];
      const remainderBlocks = []; // For the second half if different size

      for (const row of rows) {
        const rowIndex = rows.indexOf(row);
        // WAITLIST BLOCK: Combine rule applies here too
        if (!isRushHour && rowIndex < 3) continue;

        const avail = [];
        for (let s = 1; s <= 10; s++) {
          const id = row + s;
          if (!state.takenSeats.includes(id) && !state.lockedSeats.includes(id)) avail.push(id);
        }

        // Find blocks of splitSize
        for (let i = 0; i <= avail.length - splitSize; i++) {
          const chunk = avail.slice(i, i + splitSize);
          const nums = chunk.map(s => parseInt(s.slice(1)));
          const isConsec = nums.every((v, j) => j === 0 || (v === nums[j-1] + 1 && !(nums[j-1] === 3 && v === 4) && !(nums[j-1] === 7 && v === 8)));
          if (isConsec) {
            smallerBlocks.push({ chunk, rowIndex: rows.indexOf(row), score: Math.abs(5.5 - (nums.reduce((a,b)=>a+b,0)/splitSize)) });
          }
        }

        // Find blocks of rem (if different)
        if (rem !== splitSize) {
          for (let i = 0; i <= avail.length - rem; i++) {
            const chunk = avail.slice(i, i + rem);
            const nums = chunk.map(s => parseInt(s.slice(1)));
            const isConsec = nums.every((v, j) => j === 0 || (v === nums[j-1] + 1 && !(nums[j-1] === 3 && v === 4) && !(nums[j-1] === 7 && v === 8)));
            if (isConsec) {
              remainderBlocks.push({ chunk, rowIndex: rows.indexOf(row), score: Math.abs(5.5 - (nums.reduce((a,b)=>a+b,0)/rem)) });
            }
          }
        }
      }

      const secondSet = rem === splitSize ? smallerBlocks : remainderBlocks;

      // Try to pair them (Fixed: 'remainder' bug - CodeRabbit)
      for (let i = 0; i < smallerBlocks.length; i++) {
        for (let j = 0; j < secondSet.length; j++) {
          const b1 = smallerBlocks[i];
          const b2 = secondSet[j];
          if (b1 === b2) continue; // Don't pair with self
          
          // Check if overlapping
          const allSeats = [...b1.chunk, ...b2.chunk];
          if (new Set(allSeats).size < (b1.chunk.length + b2.chunk.length)) continue;

          let pairScore = b1.score + b2.score;
          const rowDiff = Math.abs(b1.rowIndex - b2.rowIndex);
          
          if (rowDiff === 0) pairScore *= 0.8;
          else if (rowDiff === 1) pairScore *= 0.9;
          else pairScore *= (1 + rowDiff * 0.5);

          const avgCol1 = b1.chunk.map(s => parseInt(s.slice(1))).reduce((a,b)=>a+b,0) / b1.chunk.length;
          const avgCol2 = b2.chunk.map(s => parseInt(s.slice(1))).reduce((a,b)=>a+b,0) / b2.chunk.length;
          const colDiff = Math.abs(avgCol1 - avgCol2);
          pairScore += colDiff * 2; // Penalty for horizontal separation

          subOptions.push({ chunk: allSeats, score: pairScore });
        }
      }
      
      if (subOptions.length > 0) {
        subOptions.sort((a, b) => a.score - b.score);
        seatOptions.push(subOptions[0]);
      }
    }

  // 4. Final Selection with Variety Cluster (Top K)
  seatOptions.sort((a,b) => a.score - b.score);

  if (seatOptions.length > 0) {
    // Pick randomly from the top 3 options if available for better variety
    const k = Math.min(3, seatOptions.length);
    const selectedOption = seatOptions[Math.floor(Math.random() * k)];
    
    state.selectedSeats = selectedOption.chunk;
    updateSeatSummary();
    
    const rationale = (persona === 'Couple' && state.selectedSeats.some(s => s.endsWith('1') || s.endsWith('10'))) 
      ? "Corner Privacy Mode" 
      : (persona === 'Introvert' ? "Social Distancing Mode" : 
        (n >= 4 && !selectedOption.chunk.every(s => s.charAt(0) === selectedOption.chunk[0].charAt(0)) ? "Smart Group Split" : "Vision Variety Cluster"));
    showToast(`Vision IQ 9.2: ${state.selectedSeats.length} seats secured. Logic: ${rationale}.`);
    
    // Clear old visual classes
    document.querySelectorAll('.seat.recommended, .seat.selected').forEach(s => {
      s.classList.remove('recommended', 'selected', 'gold-cat');
    });
    
    // High-end animation feedback
    state.selectedSeats.forEach((seatId, i) => {
      setTimeout(() => {
        const el = document.querySelector(`.seat[data-seat="${seatId}"]`);
        if (el) {
          el.classList.add('recommended', 'selected');
          const cat = el.getAttribute('data-cat');
          if (cat === 'gold') el.classList.add('gold-cat');
          if (navigator.vibrate) navigator.vibrate(20);
        }
      }, i * 100);
    });
  } else {
    // 5. DISPERSION FALLBACK: Find any available seats if no consecutive block
    // Randomize starting row for variety in fallback
    const shuffledRows = [...rows].sort(() => Math.random() - 0.5);
    const allAvailable = [];
    for (const row of shuffledRows) {
      const rowIndex = rows.indexOf(row);
      // WAITLIST BLOCK
      if (!isRushHour && rowIndex < 3) continue;
      
      for (let s = 1; s <= 10; s++) {
        const id = row + s;
        if (!state.takenSeats.includes(id) && !state.lockedSeats.includes(id)) allAvailable.push(id);
      }
    }
    state.selectedSeats = allAvailable.slice(0, n);
    updateSeatSummary();
    if (state.selectedSeats.length > 0) {
      showToast(`Vision IQ 8.7: Randomized best available seats.`);
    } else {
      showToast(isRushHour ? "Vision IQ: Cinema is fully booked!" : "Vision IQ: All prime seats taken! Front row Waitlist blocked until 30 mins before showtime.");
    }
  }
  renderSeats();
}

// ========== PAYMENT ==========
function renderPayment() {
  const m = state.selectedMovie;
  const t = state.selectedTheatre;
  const s = state.selectedShow;
  
  const capacity = (state.takenSeats.length + state.lockedSeats.length) / 100;
  const isHighDemand = capacity >= 0.8;
  
  let total = 0;
  state.selectedSeats.forEach(seat => {
    const row = seat.charAt(0);
    let cat = 'silver';
    if ('ABC'.includes(row)) cat = 'gold';
    else if ('HIJ'.includes(row)) cat = 'platinum';
    
    let price = SEAT_PRICES[cat];
    if (isHighDemand && cat === 'platinum') price = Math.floor(price * 1.15);
    if (isHighDemand && cat === 'gold') price = Math.floor(price * 0.90);
    
    total += price;
  });
  const convFee = Math.round(total * 0.05);

  let snacksTotal = 0;
  let snacksHtml = '';
  Object.entries(state.selectedSnacks).forEach(([id, qty]) => {
    const snack = SNACKS.find(s => s.id === id);
    if (snack) {
      const sub = snack.price * qty;
      snacksTotal += sub;
      snacksHtml += `<div class="order-detail"><span class="label">${escapeHTML(snack.name)} (x${qty})</span><span>₹${sub.toLocaleString()}</span></div>`;
    }
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  $('orderSummary').innerHTML = `
    <h2>Summary</h2>
    <div class="order-detail"><span class="label">Movie</span><span>${escapeHTML(m.title)}</span></div>
    <div class="order-detail"><span class="label">Theatre</span><span>${escapeHTML(t.name)}</span></div>
    <div class="order-detail"><span class="label">Date</span><span>${escapeHTML(dateStr)}</span></div>
    <div class="order-detail"><span class="label">Time</span><span>${escapeHTML(s.time)} (${escapeHTML(s.format)})</span></div>
    <div class="order-detail"><span class="label">Seats</span><span>${escapeHTML(state.selectedSeats.join(', '))}</span></div>
    <div class="order-detail"><span class="label">Tickets</span><span>₹${total.toLocaleString()}</span></div>
    ${snacksHtml}
    <div class="order-detail"><span class="label">Convenience Fee</span><span>₹${convFee}</span></div>
    <div class="order-total"><span>Total</span><span class="price">₹${(total + snacksTotal + convFee).toLocaleString()}</span></div>
  `;

  const finalTotal = total + snacksTotal + convFee;
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
  $('confirmPayBtn').onclick = async () => {
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

    setTimeout(async () => {
      stopLockTimer(); // Clear the lock timer

      const bookingId = 'CB' + Date.now().toString(36).toUpperCase();

      if (state.user) {
        if (!state.user.bookings) state.user.bookings = [];
        
        // Award CinePoints (10% of booking total)
        const pointsEarned = Math.floor(finalTotal * 0.1);
        
        const bookingData = {
          bookingId: bookingId,
          movie: state.selectedMovie.title,
          poster: state.selectedMovie.poster,
          theatre: state.selectedTheatre.name + ', ' + state.selectedTheatre.location,
          theatreId: state.selectedTheatre.id,
          showIndex: state.selectedTheatre.shows.indexOf(state.selectedShow),
          date: dateStr,
          time: state.selectedShow.time + ' (' + state.selectedShow.format + ')',
          seats: state.selectedSeats,
          amount: finalTotal,
          pointsEarned: pointsEarned
        };

        // Persist to BACKEND (The Bridge)
        try {
          await fetch('/api/bookings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
          });
        } catch (backendErr) {
          console.warn('Backend persistence failed (offline mode):', backendErr);
        }

        state.user.points = (state.user.points || 0) + pointsEarned;
        state.user.bookings.unshift({...bookingData, seats: bookingData.seats.join(', ')});
        saveState();
        showToast(`Congrats! You earned ${pointsEarned} CinePoints!`);
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

      btn.innerHTML = 'Download PDF';
      btn.disabled = false;
      showToast('Ticket downloaded!');
    } catch (err) {
      console.error('PDF generation failed:', err);
      $('downloadTicket').innerHTML = 'Download PDF';
      $('downloadTicket').disabled = false;
      showToast('Download failed.');
    }
  };
  $('shareTicket').onclick = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?movie=${btoa(m.title)}&theatre=${btoa(t.name)}`;
    navigator.clipboard.writeText(`Movie Night Invitation!\n\nI just booked tickets for "${m.title}" at ${t.name}.\nJoin me for the ${s.time} show!\n\nBook here: ${shareUrl}`);
    showToast('Invitation link copied! Share it with friends.');
  };
}

function drawQR(bookingId, ticketInfo) {
  const container = $('qrCanvas').parentElement;
  container.innerHTML = '';
  try {
    // Encode full ticket details into a URL for easy verification
    const ticketDetails = JSON.stringify({
      id: bookingId,
      movie: ticketInfo.movie,
      theatre: ticketInfo.theatre,
      date: ticketInfo.date,
      time: ticketInfo.time,
      seats: ticketInfo.seats
    });

    const path = window.location.pathname.endsWith('index.html') 
      ? window.location.pathname.replace('index.html', '') 
      : window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
    
    const baseUrl = window.location.origin + path;
    const verifyUrl = `${baseUrl}verify.html?data=${encodeURIComponent(btoa(ticketDetails))}`;

    const qr = qrcode(0, 'L'); // 'L' for least density/easiest scanning
    qr.addData(verifyUrl);
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
        <h3 style="margin:0">${escapeHTML(b.movie)}</h3>
        <span class="ticket-logo">CinTic</span>
      </div>
      <div class="ticket-card-body">
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
}

// ========== PROFILE ACTIONS ==========
function initProfileActions() {
  const updateBtn = $('updatePasswordBtn');
  if (updateBtn) {
    updateBtn.addEventListener('click', async () => {
      const currentPassword = $('currentPassword').value;
      const newPassword = $('newPassword').value;
      const msg = $('cpMessage');

      if (!currentPassword || !newPassword) {
        msg.textContent = 'Please fill all fields';
        msg.style.color = 'var(--red)';
        msg.style.display = 'block';
        return;
      }

      if (newPassword.length < 8) {
        msg.textContent = 'New password must be at least 8 characters';
        msg.style.color = 'var(--red)';
        msg.style.display = 'block';
        return;
      }

      updateBtn.disabled = true;
      updateBtn.textContent = 'Updating...';
      msg.style.display = 'none';

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();

        if (res.ok) {
          msg.textContent = 'Password updated successfully!';
          msg.style.color = '#2ecc71';
          $('currentPassword').value = '';
          $('newPassword').value = '';
        } else {
          msg.textContent = data.error || 'Failed to update password';
          msg.style.color = 'var(--red)';
        }
        msg.style.display = 'block';
      } catch (err) {
        msg.textContent = 'Network error. Please try again.';
        msg.style.color = 'var(--red)';
        msg.style.display = 'block';
      } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = 'Update Password';
      }
    });
  }
}

// ========== MAIN APP INIT ==========
initTheme();
initAuth();
initPasswordReset();
initProfileActions();

// Verification link handler (CodeRabbit: ensure invocation)
const params = new URLSearchParams(window.location.search);
if (params.has('verify') && params.has('email')) {
    handleEmailVerification(params.get('verify'), params.get('email'));
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

// Try to auto-login via JWT cookie
(async function initSession() {
  // Check if we just logged out — if so, skip auto-login
  if (sessionStorage.getItem('just_logged_out')) {
    sessionStorage.removeItem('just_logged_out');
    // Still run the rest of the logic to set up the auth page
  } else {
    try {
      const res = await fetchWithTimeout('/api/auth/me', { 
        credentials: 'same-origin', 
        timeout: 8000,
        cache: 'no-store' // Force browser to bypass local fetch cache
      });
      if (res.ok) {
        const data = await res.json();
        state.user = data.user;
        if (!state.user.bookings) state.user.bookings = [];
        enterApp();
        return;
      }
    } catch (err) {
      console.warn('Session check failed:', err);
    }
  }

  // No valid session — show auth page with correct tab
  const hasVisited = localStorage.getItem('cintic_visited');
  const tabs = document.querySelectorAll('.auth-tab');
  
  const authPage = $('authPage');
  if (authPage) {
    authPage.classList.add('active');
    console.log('Guest user detected, showing auth overlay');
  }
  
  if (!hasVisited) {
    if (tabs[1]) tabs[1].click(); // Switch to Signup for first time users
    showToast('Welcome! Join CinTic today to book your favorite movies.');
    localStorage.setItem('cintic_visited', 'true');
  } else {
    // Default is usually logic tab, only click if it's not active
    if (tabs[0] && !tabs[0].classList.contains('active')) tabs[0].click();
  }
  
  // Initialize auth forms and logic
  initAuth();
  
  // Load data immediately even for guests
  initApp();
  const mainApp = $('mainApp');
  if (mainApp) mainApp.style.display = 'block';
})();

// ========== AI CONCIERGE LOGIC ==========
function initChatbot() {
  const toggle = $('chatToggle');
  const chatWin = $('chatWindow');
  const close = $('chatClose');
  const send = $('sendChat');
  const input = $('chatInput');
  const messages = $('chatMessages');
  const quickReplies = $('quickReplies');

  if (!toggle) return;

  toggle.onclick = () => chatWin.classList.add('active');
  close.onclick = () => chatWin.classList.remove('active');

  const addMsg = (text, sender, isMedia = false) => {
    const div = document.createElement('div');
    div.className = `message ${sender} ${isMedia ? 'media-container' : ''}`;
    
    if (isMedia) {
      // isMedia is only used for bot-generated template content (like recommendations)
      // which we control via renderMovieCards. Regular text uses textContent.
      div.innerHTML = text;
    } else {
      div.textContent = text;
    }
    
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  };

  const renderMovieCards = (movies) => {
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'chat-media-scroll';
    
    movies.forEach(m => {
      const card = document.createElement('div');
      card.className = 'chat-movie-mini-card';
      
      // Use secure elements for user-controlled/external data (CodeRabbit)
      const img = document.createElement('img');
      img.src = m.poster;
      img.alt = m.title;
      
      const info = document.createElement('div');
      info.className = 'mini-card-info';
      
      const h6 = document.createElement('h6');
      h6.textContent = m.title;
      
      const meta = document.createElement('div');
      meta.className = 'mini-meta';
      const ratingSpan = document.createElement('span');
      ratingSpan.className = 'mini-rating';
      ratingSpan.textContent = `★ ${m.rating}`;
      const genreSpan = document.createElement('span');
      genreSpan.className = 'mini-genre';
      genreSpan.textContent = m.genre.split(', ')[0];
      meta.appendChild(ratingSpan);
      meta.appendChild(genreSpan);
      
      const btn = document.createElement('button');
      btn.className = 'mini-book-btn';
      btn.textContent = 'Book';
      btn.onclick = () => {
        $('chatWindow').classList.remove('active');
        selectMovie(m.id);
      };
      
      info.appendChild(h6);
      info.appendChild(meta);
      info.appendChild(btn);
      
      card.appendChild(img);
      card.appendChild(info);
      scrollDiv.appendChild(card);
    });
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot media';
    msgDiv.appendChild(scrollDiv);
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  };

  const handleSend = async (text) => {
    const val = text || input.value.trim();
    if (!val) return;

    if (!text) input.value = '';
    addMsg(val, 'user');

    // Show typing
    const typing = addMsg('...', 'bot');

    try {
      // Prepare user data for personalization
      const userData = state.user ? {
        points: state.user.points || 0,
        bookings: state.user.bookings || []
      } : null;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: val,
          userData: userData,
          context: {
            currentView: document.querySelector('.section.active')?.id || 'home',
            selectedMovie: state.selectedMovie?.title,
            selectedTheatre: state.selectedTheatre?.name,
            selectedSeats: state.selectedSeats
          }
        })
      });
      const data = await res.json();
      
      typing.textContent = data.response;
      
      if (data.recommendations && data.recommendations.length > 0) {
        setTimeout(() => renderMovieCards(data.recommendations), 400);
      }
    } catch (e) {
      typing.textContent = "I apologize, but I am currently unable to process your request. Please try again later.";
    }
  };

  send.onclick = () => handleSend();
  input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

  // Quick Replies
  quickReplies.onclick = (e) => {
    if (e.target.classList.contains('quick-chip')) {
      handleSend(e.target.dataset.query);
    }
  };
}

// Expose functions to global window for inline HTML handlers (Module Scoping Fix)
window.selectMovie = selectMovie;
window.selectShow = selectShow;
window.openTrailer = openTrailer;
window.closeTrailer = closeTrailer;
window.toggleSeat = toggleSeat;
window.updateSnackQty = updateSnackQty;
window.recommendSeats = recommendSeats;
window.selectMovieFromGlobal = selectMovieFromGlobal;
window.selectTheatreFromGlobal = selectTheatreFromGlobal;
window.viewAllResults = viewAllResults;
window.showPage = showPage;
