const { clearCookieHeader } = require('../utils/jwt');

module.exports = async (req, res) => {
    // Set the cookie to expire immediately
    res.setHeader('Set-Cookie', clearCookieHeader());
    res.status(200).json({ message: 'Logged out successfully' });
};
