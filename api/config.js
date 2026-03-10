require('dotenv').config();
module.exports = async (req, res) => {
    const googleClientId = ((process.env.GOOGLE_CLIENT_ID || '').trim())
        || '554940727049-j2fcom24vrb6ssal0i6om0r4gpap77d1.apps.googleusercontent.com';
    res.status(200).json({ googleClientId });
};
