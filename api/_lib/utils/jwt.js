require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = (process.env.JWT_SECRET || '').trim();
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const JWT_EXPIRY = '24h';

/**
 * Sign a JWT token for a user
 */
function signToken(userId) {
    return jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Build a Set-Cookie header string for the JWT
 */
function buildCookieHeader(token, maxAgeSeconds = 86400) {
    const isProd = process.env.NODE_ENV === 'production';
    return `token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAgeSeconds}${isProd ? '; Secure' : ''}`;
}

/**
 * Build a cookie-clearing header (for logout)
 */
function clearCookieHeader() {
    return `token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`;
}

/**
 * Parse cookies from a raw Cookie header string
 */
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(cookie => {
        const [key, ...val] = cookie.trim().split('=');
        if (key) cookies[key.trim()] = val.join('=').trim();
    });
    return cookies;
}

/**
 * Auth middleware: reads token from cookies, verifies, attaches req.user
 * Returns the user document or null
 */
async function authMiddleware(req, db) {
    try {
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies.token;
        if (!token) return null;

        const decoded = verifyToken(token);
        const { ObjectId } = require('mongodb');

        let userId;
        try {
            userId = new ObjectId(decoded.userId);
        } catch {
            return null;
        }

        const user = await db.collection('users').findOne({ _id: userId });
        if (!user) {
            console.warn(`Auth failed: User not found for ID ${decoded.userId}`);
            return null;
        }
        return user;
    } catch (err) {
        if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError') {
            console.error('Auth middleware error:', err);
        }
        return null;
    }
}

module.exports = { signToken, verifyToken, buildCookieHeader, clearCookieHeader, parseCookies, authMiddleware };
