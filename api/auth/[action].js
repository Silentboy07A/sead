module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    const { action } = req.query;

    switch (action) {
        case 'login':
            return require('../_lib/auth/_login')(req, res);
        case 'register':
            return require('../_lib/auth/_register')(req, res);
        case 'google':
            return require('../_lib/auth/_google')(req, res);
        case 'me':
            return require('../_lib/auth/_me')(req, res);
        case 'logout':
            return require('../_lib/auth/_logout')(req, res);
        case 'forgot-password':
            return require('../_lib/auth/_forgot-password')(req, res);
        case 'reset-password':
            return require('../_lib/auth/_reset-password')(req, res);
        case 'change-password':
            return require('../_lib/auth/_change-password')(req, res);
        default:
            res.status(404).json({ error: 'Auth route not found' });
    }
};
