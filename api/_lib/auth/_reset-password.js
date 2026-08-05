const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { connectToDatabase } = require('../utils/db');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, token, newPassword } = sanitize(req.body);

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Password complexity (consistent with registration)
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({ error: 'Password does not meet complexity requirements' });
    }

    const { db } = await connectToDatabase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await db.collection('users').findOne({
      email,
      resetToken: tokenHash,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Hash the new password and clear the reset token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: '', resetExpires: '' },
      },
    );

    res.status(200).json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};
