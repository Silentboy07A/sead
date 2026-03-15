module.exports = async (req, res) => {
    try {
        const { resource } = req.query;

        switch (resource) {
            case 'movies':
                return require('../_lib/admin/_movies')(req, res);
            case 'theatres':
                return require('../_lib/admin/_theatres')(req, res);
            default:
                res.status(404).json({ error: 'Admin resource not found' });
        }
    } catch (error) {
        console.error('Admin Dispatcher Error:', error);
        res.status(500).json({ 
            error: 'Admin dispatcher error', 
            details: error.message 
        });
    }
};
