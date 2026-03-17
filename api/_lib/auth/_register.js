const { connectToDatabase } = require('../utils/db');
const bcrypt = require('bcryptjs');
const { signToken, buildCookieHeader } = require('../utils/jwt');
const sanitize = require('../utils/sanitize');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, name } = sanitize(req.body);

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Robust email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password complexity (matches frontend)
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (password.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            return res.status(400).json({ error: 'Password does not meet complexity requirements' });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({ error: 'Name must be at least 3 characters' });
        }

        // Security: Strip HTML from name to prevent persistent XSS
        const cleanName = name.replace(/<[^>]*>?/gm, '').trim();
        if (cleanName.length < 3) {
            return res.status(400).json({ error: 'Name contains invalid characters or is too short after sanitization' });
        }

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const crypto = require('crypto');
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
        const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

        // Create new user
        const newUser = {
            name: cleanName,
            email,
            password: hashedPassword,
            isAdmin: false,
            isVerified: false,
            verificationToken: verificationTokenHash,
            verificationExpires,
            created_at: new Date(),
            last_login: new Date(),
            genre_preferences: [],
            bookings: []
        };

        const result = await usersCollection.insertOne(newUser);

        // Send verification email
        const nodemailer = require('nodemailer');
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

        const appUrl = (process.env.APP_URL || 'http://localhost:3000').trim();
        const verificationLink = `${appUrl}/?verify=${verificationToken}&email=${encodeURIComponent(email)}`;

        const info = await transporter.sendMail({
            from: '"CinTic Support" <noreply@cintic.app>',
            to: email,
            subject: '✉️ Verify your CinTic email',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#141420;border-radius:12px;color:#f1f1f1;">
                    <h1 style="color:#e63946;font-size:24px;">Welcome to CinTic!</h1>
                    <p>Hello <strong>${cleanName}</strong>,</p>
                    <p>Thanks for joining CinTic. Please verify your email address to activate your account:</p>
                    <a href="${verificationLink}" style="display:inline-block;padding:12px 28px;background:#e63946;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0;">Verify Email</a>
                    <p style="color:#8a8a9a;font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
                    <hr style="border-color:#1e1e30;margin:20px 0;">
                    <p style="color:#8a8a9a;font-size:12px;">— CinTic Team</p>
                </div>
            `
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('📧 Verification email preview:', previewUrl);
        }

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
            previewUrl: previewUrl || null,
            verificationLink: process.env.NODE_ENV === 'production' ? null : verificationLink
        });

    } catch (error) {
        console.error('Registration error:', error);
        // If we created a user but email failed, try to roll back (CodeRabbit)
        try {
            const { db } = await connectToDatabase();
            if (email) {
                await db.collection('users').deleteOne({ email, isVerified: false });
            }
        } catch (dbErr) {
            console.error('Rollback failed:', dbErr);
        }
        res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
    }
};
