/**
 * CinTic API Client Module
 */
import { fetchWithTimeout } from './utils.js';

const API_BASE = '/api';

export const API = {
  /**
   * Auth APIs
   */
  auth: {
    async getConfig() {
      const res = await fetch(`${API_BASE}/config`);
      return res.json();
    },
    async login(email, password) {
      return fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
    },
    async register(name, email, password) {
      return fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, password }),
      });
    },
    async googleLogin(credential, mode) {
      return fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ credential, mode }),
      });
    },
    async verifyEmail(token, email) {
      return fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });
    },
    async forgotPassword(email) {
      return fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    },
    async resetPassword(email, token, newPassword) {
      return fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });
    },
    async logout() {
      return fetch(`${API_BASE}/auth/logout`, { credentials: 'same-origin' });
    },
  },

  /**
   * Movie & Theatre APIs
   */
  movies: {
    async getAll() {
      return fetchWithTimeout(`${API_BASE}/movies`, { timeout: 5000 });
    },
  },
  theatres: {
    async getAll() {
      return fetchWithTimeout(`${API_BASE}/theatres`, { timeout: 5000 });
    },
  },

  /**
   * Booking APIs
   */
  booking: {
    async checkLockedSeats(theatreId, showIndex, date) {
      return fetch(`${API_BASE}/check-locked-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theatreId, showIndex, date }),
      });
    },
    async lockSeats(theatreId, showIndex, date, seats) {
      return fetch(`${API_BASE}/lock-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theatreId, showIndex, date, seats,
        }),
      });
    },
    async createBooking(bookingData) {
      return fetch(`${API_BASE}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
    },
  },
};

export default API;
