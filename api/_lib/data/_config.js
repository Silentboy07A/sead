require('dotenv').config();
module.exports = async (req, res) => {
    const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!googleClientId) {
        return res.status(500).json({ error: 'Google Client ID not configured.' });
    }
    res.status(200).json({ googleClientId });
};
