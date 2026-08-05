const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../utils/db');
const { authMiddleware } = require('../utils/jwt');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const { db } = await connectToDatabase();
    const user = await authMiddleware(req, db);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Only allow password change for non-Google users (or users with a password set)
    if (!user.password) {
      return res.status(400).json({ error: 'Google accounts cannot change password directly' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user record
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } },
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
