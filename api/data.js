module.exports = async (req, res) => {
  try {
    // Determine the type from query or path if we use rewrites
    const { type } = req.query;

    switch (type) {
      case 'movies':
        return require('./_lib/data/_movies')(req, res);
      case 'theatres':
        return require('./_lib/data/_theatres')(req, res);
      case 'config':
        return require('./_lib/data/_config')(req, res);
      default:
        res.status(404).json({ error: 'Data endpoint not found' });
    }
  } catch (error) {
    console.error('Data Dispatcher Error:', error);
    res.status(500).json({
      error: 'Data dispatcher error',
      details: error.message,
    });
  }
};
