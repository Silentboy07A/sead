/**
 * CinTic Utilities Module
 */

/**
 * Enhanced fetch with timeout safety
 */
export async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort('timeout'), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Shorthand for document.getElementById
 */
export const $ = (id) => document.getElementById(id);

/**
 * Show a toast notification
 */
export function showToast(msg, duration = 3000, isHtml = false) {
  const t = $('toast');
  if (!t) return;

  if (isHtml) {
    t.innerHTML = msg;
  } else {
    t.textContent = msg;
  }
  t.classList.add('show');

  if (t._timeout) clearTimeout(t._timeout);

  t._timeout = setTimeout(() => {
    t.classList.remove('show');
    t._timeout = null;
  }, duration);
}

/**
 * Basic HTML escaping for security
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[m]);
}

/**
 * Debounce function for performance
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get cookie value by name
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}

/**
 * Initialize CSRF Protection for fetch
 */
export function initCSRF() {
  if (typeof window === 'undefined') return;
  const originalFetch = window.fetch;
  window.fetch = function (url, options = {}) {
    const isLocal = typeof url === 'string' && (url.startsWith('/') || url.startsWith(window.location.origin));
    const isMutative = options.method && ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase());

    if (isLocal && isMutative) {
      options.headers = options.headers || {};
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        options.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return originalFetch(url, options);
  };
}
