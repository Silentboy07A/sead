module.exports = async (req, res) => {
    const type = req.query.type;

    switch (type) {
        case 'lock':
            return require('./_lib/booking/_lock')(req, res);
        case 'check':
            return require('./_lib/booking/_check')(req, res);
        case 'create':
            return require('./_lib/booking/_create')(req, res);
        default:
            res.status(404).json({ error: 'Booking endpoint not found' });
    }
};
