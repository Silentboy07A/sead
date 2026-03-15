const { connectToDatabase } = require('../utils/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sanitize = require('../utils/sanitize');
const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = sanitize(req.body);
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { db } = await connectToDatabase();
        const user = await db.collection('users').findOne({ email });

        // Always return success to prevent email enumeration attacks
        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { resetToken: resetTokenHash, resetExpires } }
        );

        // Build the reset link
        const appUrl = (process.env.APP_URL || 'http://localhost:3000').trim();
        const resetLink = `${appUrl}/?reset=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send email via Nodemailer (uses Ethereal for testing, or configure SMTP)
        let transporter;
        if (process.env.SMTP_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Use Ethereal for testing (free test SMTP)
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        }

        const info = await transporter.sendMail({
            from: '"CinTic Support" <noreply@cintic.app>',
            to: email,
            subject: '🔑 Reset your CinTic password',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#141420;border-radius:12px;color:#f1f1f1;">
                    <h1 style="color:#e63946;font-size:24px;">CinTic Password Reset</h1>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>We received a request to reset your password. Click the button below to set a new one:</p>
                    <a href="${resetLink}" style="display:inline-block;padding:12px 28px;background:#e63946;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0;">Reset Password</a>
                    <p style="color:#8a8a9a;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border-color:#1e1e30;margin:20px 0;">
                    <p style="color:#8a8a9a;font-size:12px;">— CinTic Team</p>
                </div>
            `
        });

        // Log the preview URL for Ethereal test emails
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('📧 Preview reset email at:', previewUrl);
        }

        res.status(200).json({
            message: 'If an account with that email exists, a reset link has been sent.',
            ...((IS_PROD || process.env.SMTP_HOST) ? {} : { resetLink, testMode: true }),
            ...((IS_PROD || !previewUrl) ? {} : { previewUrl })
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request. Please try again.' });
    }
};
