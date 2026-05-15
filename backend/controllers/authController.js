const User = require('../models/User');
const Country = require('../models/Country');
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const jwt = require('jsonwebtoken');
const riskService = require('../services/riskService');
const { addJob } = require('../services/queueService');
const SiteSetting = require('../models/SiteSetting');
const axios = require('axios');

// Verify Google reCAPTCHA v3
const verifyRecaptcha = async (token) => {
    const settings = await SiteSetting.findOne();
    if (!settings?.enable_recaptcha) return true;
    if (!token) return false;

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${settings.recaptcha_secret_key}&response=${token}`
        );
        return response.data.success && response.data.score >= 0.5;
    } catch (err) {
        console.error('reCAPTCHA verification error:', err);
        return false;
    }
};

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper for social login
const handleSocialLogin = async (socialUser, res) => {
    const User = require('../models/User'); // Ensure model is available
    let user = await User.findOne({ email: String(socialUser.email) });
    if (!user) {
        // 🚨 Do NOT create user immediately.
        // Instead, issue a temporary token and redirect to onboarding
        const tempToken = jwt.sign(
            {
                email: socialUser.email,
                name: socialUser.name,
                image: socialUser.image || '',
                provider: socialUser.provider || 'google',
                isTemp: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.send(`
            <html>
                <body>
                    <script>
                        window.location.href = '${frontendUrl}/social-register?token=${tempToken}';
                    </script>
                </body>
            </html>
        `);
    }

    // User already exists → Normal login

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    res.send(`
        <html>
            <body>
                <script>
                    localStorage.setItem('token', '${token}');
                    localStorage.setItem('user', JSON.stringify(${JSON.stringify({
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: user.roles,
        status: user.status
    })}));
                    window.location.href = '${redirectUrl}/';
                </script>
            </body>
        </html>
    `);
};

// POST /api/auth/social-register
exports.socialRegister = async (req, res) => {
    try {
        const {
            token, role,
            first_name, last_name,
            country_code, phone_number,
            company_name,
            business_type,
            state
        } = req.body;

        if (!token || !role) {
            return res.status(400).json({ message: 'Token and role are required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isTemp) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const User = require('../models/User');
        let existingUser = await User.findOne({ email: String(decoded.email) });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // CREATE USER ONLY NOW
        const newUser = await User.create({
            first_name: first_name || decoded.name.split(' ')[0] || 'Social',
            last_name: last_name || decoded.name.split(' ')[1] || 'User',
            email: decoded.email,
            roles: [role],
            password: Math.random().toString(36).slice(-10), // Random password
            status: 'active',
            is_verified: true,
            provider: decoded.provider || 'google',
            country_code: country_code || '',
            phone_number: phone_number || '',
            company_name: role === 'supplier' ? company_name : '',
            business_type: business_type || [],
            state: state || '',
            profile_image: decoded.image || ''
        });

        const authToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            success: true,
            token: authToken,
            user: {
                _id: newUser._id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email,
                roles: newUser.roles,
                status: newUser.status
            }
        });

    } catch (err) {
        console.error('socialRegister error:', err);
        res.status(500).json({ message: 'Error completing registration: ' + err.message });
    }
};

// ─────────────────────────────────────────────
// STEP 1: Check email → send OTP
// POST /api/auth/send-otp
// ─────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
    try {
        const { email, password, first_name, last_name, company_name, phone_number, role, country_code, recaptchaToken } = req.body;

        // reCAPTCHA Validation
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(403).json({ message: 'Security check failed. Please refresh and try again.' });

        if (!email) return res.status(400).json({ message: 'Email is required' });

        const otp = generateOTP();
        const otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const cleanEmail = email ? String(email) : '';
        const existing = await User.findOne({ email: cleanEmail });

        if (existing) {
            existing.otp = otp;
            existing.otp_expires = otp_expires;
            if (password) existing.password = password;
            if (first_name) existing.first_name = first_name;
            if (last_name) existing.last_name = last_name;
            if (company_name) existing.company_name = company_name;
            if (phone_number) existing.phone_number = phone_number;
            if (role) existing.roles = [role];
            if (country_code) existing.country_code = country_code;
            await existing.save({ validateBeforeSave: false });
        } else {
            // Create a temp user
            await User.create({
                email,
                password: password || 'TEMP_demo_123',
                first_name: first_name || '',
                last_name: last_name || '',
                company_name: company_name || '',
                phone_number: phone_number || '',
                roles: [role || 'buyer'],
                country_code: country_code || '',
                otp,
                otp_expires,
                status: 'pending'
            });
        }

        // Send OTP via Email
        await addJob('email', {
            to: email,
            subject: 'Your Verification Code - Alibaba Demo',
            text: `Your verification code is ${otp}. It expires in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #ff6600;">Email Verification</h2>
                    <p>Thank you for registering. Please use the following code to verify your email address:</p>
                    <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        });

        res.json({
            success: true,
            message: `OTP sent to ${email}`
        });
    } catch (error) {
        console.error('sendOtp error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// STEP 2: Verify OTP
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const user = await User.findOne({ email }).select('+otp +otp_expires').populate('subscription_plan');
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otp_expires < Date.now()) return res.status(400).json({ message: 'OTP has expired' });

        const wasPending = user.status === 'pending';
        // Clear OTP and activate
        user.otp = undefined;
        user.otp_expires = undefined;
        user.status = 'active';
        await user.save({ validateBeforeSave: false });

        if (wasPending) {
            try {
                const { sendNotification } = require('../services/notificationService');
                const admins = await User.find({ role: 'admin' });
                for (const admin of admins) {
                    await sendNotification(
                        req.io,
                        admin._id,
                        `New ${user.role} Signup`,
                        `${user.email} has completed email verification.`,
                        'admin',
                        '/admin/users'
                    );

                    // 📧 Send email to Admin
                    try {
                        await addJob('email', {
                            to: admin.email,
                            subject: `New User Registration - ${user.role}`,
                            text: `A new ${user.role} (${user.email}) has registered and verified their email.`,
                            html: `
                                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                    <h2 style="color: #ff6600;">New User Registration</h2>
                                    <p>A new user has registered and verified their email address on Alibaba Demo.</p>
                                    <div style="background: #f4f4f4; padding: 15px; margin: 20px 0;">
                                        <p><strong>Email:</strong> ${user.email}</p>
                                        <p><strong>Role:</strong> ${user.role}</p>
                                        <p><strong>Status:</strong> ${user.status}</p>
                                    </div>
                                    <a href="${process.env.FRONTEND_URL}/admin/users" style="background: #ff6600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Users</a>
                                </div>
                            `
                        });
                    } catch (adminMailErr) {
                        console.error('Admin signup notification email error:', adminMailErr);
                    }
                }
            } catch (notifErr) {
                console.error('Signup notification error:', notifErr);
            }
        }

        res.json({
            success: true,
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            roles: user.roles,
            status: user.status,
            subscription_plan: user.subscription_plan,
            payout_methods: user.payout_methods || [],
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// STEP 3: Complete Registration
// POST /api/auth/register
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { email, first_name, last_name, password, role, country_code, phone_number, recaptchaToken } = req.body;

        // reCAPTCHA Validation
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(403).json({ message: 'Security check failed. Please refresh and try again.' });

        if (!email || !first_name || !last_name || !password) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const user = await User.findOne({ email: String(email) });
        if (!user) return res.status(404).json({ message: 'Please start registration again' });

        // Validate country_code if provided
        let countryRecord = null;
        if (country_code) {
            countryRecord = await Country.findOne({ code: country_code.toUpperCase() });
        }

        user.first_name = first_name.trim();
        user.last_name = last_name.trim();
        user.password = password;
        user.roles = [role || 'buyer'];
        user.status = 'active';
        user.country_code = country_code || '';
        user.phone_number = phone_number || '';
        if (req.body.company_name) user.company_name = req.body.company_name;

        await user.save();

        const { sendNotification } = require('../services/notificationService');
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await sendNotification(
                req.io,
                admin._id,
                `New ${user.role} Signup`,
                `${user.first_name} ${user.last_name} has signed up.`,
                'admin',
                '/admin/users'
            );

            // 📧 Send email to Admin
            try {
                await addJob('email', {
                    to: admin.email,
                    subject: `New User Registration - ${user.role}`,
                    text: `A new ${user.role} (${user.first_name} ${user.last_name}) has signed up.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #ff6600;">New User Signup</h2>
                            <p>A new user has completed their profile setup on Alibaba Demo.</p>
                            <div style="background: #f4f4f4; padding: 15px; margin: 20px 0;">
                                <p><strong>Name:</strong> ${user.first_name} ${user.last_name}</p>
                                <p><strong>Email:</strong> ${user.email}</p>
                                <p><strong>Role:</strong> ${user.role}</p>
                            </div>
                            <a href="${process.env.FRONTEND_URL}/admin/users" style="background: #ff6600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Users</a>
                        </div>
                    `
                });
            } catch (adminMailErr) {
                console.error('Admin signup notification email error:', adminMailErr);
            }
        }

        res.status(201).json({
            success: true,
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            roles: user.roles,
            status: user.status,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// Login
// POST /api/auth/login
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password, recaptchaToken } = req.body;

        // reCAPTCHA Validation
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) return res.status(403).json({ message: 'Security check failed. Please refresh and try again.' });

        const user = await User.findOne({ email: String(email) }).select('+password').populate('subscription_plan');

        if (!user || user.isDeleted) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (await user.matchPassword(password)) {
            // Check if 2FA is enabled
            if (user.twoFactorEnabled) {
                const otp = generateOTP();
                const otp_expires = new Date(Date.now() + 10 * 60 * 1000);
                user.otp = otp;
                user.otp_expires = otp_expires;
                await user.save({ validateBeforeSave: false });

                // Send 2FA OTP via Email
                await addJob('email', {
                    to: email,
                    subject: 'Your 2FA Login Code - Alibaba Demo',
                    text: `Your 2FA login code is ${otp}. It expires in 10 minutes.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #ff6600;">Two-Factor Authentication</h2>
                            <p>A login attempt was made. Use the code below to complete your login:</p>
                            <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                                ${otp}
                            </div>
                            <p>This code will expire in 10 minutes.</p>
                        </div>
                    `
                });

                return res.json({
                    requiresOTP: true,
                    message: '2FA required. Please enter the code sent to your email.',
                    email: user.email
                });
            }

            res.json({
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                roles: user.roles,
                role: user.role,
                company_name: user.company_name,
                status: user.status,
                subscription_plan: user.subscription_plan,
                payout_methods: user.payout_methods || [],
                token: generateToken(user._id),
                twoFactorEnabled: user.twoFactorEnabled
            });
        } else {
            // 🛡️ Log suspicious login attempt
            await riskService.logRisk(user._id, 'failed_login', 'medium', `Failed login attempt for ${email}`);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// Get Profile
// GET /api/auth/profile
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Get Profile
// GET /api/auth/profile
// Authenticated
// ─────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('subscription_plan');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// Update Profile (Business Info)
// PUT /api/auth/update-profile
// Authenticated
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { first_name, last_name, company_name, business_type, state, phone_number, language, currency, role } = req.body;

        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (company_name !== undefined) user.company_name = company_name;
        if (business_type !== undefined) user.business_type = business_type;
        if (state !== undefined) user.state = state;
        if (phone_number !== undefined) user.phone_number = phone_number;
        if (language !== undefined) user.language = language;
        if (currency !== undefined) user.currency = currency;

        // Handle role update/conversion
        if (role !== undefined) {
            if (role === 'supplier' && !user.roles.includes('supplier')) {
                user.roles.push('supplier');
            } else if (role === 'buyer' && !user.roles.includes('buyer')) {
                user.roles.push('buyer');
            } else if (role === 'admin' && req.user.roles.includes('admin')) {
                // Only admins can promote others to admin
                if (!user.roles.includes('admin')) user.roles.push('admin');
            }
        }

        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            user: {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                roles: user.roles,
                company_name: user.company_name,
                business_type: user.business_type,
                state: user.state,
                address_line1: user.address_line1,
                city: user.city,
                zip_code: user.zip_code,
                gst_number: user.gst_number,
                status: user.status,
                language: user.language,
                currency: user.currency
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/auth/wishlist
// Authenticated
// ─────────────────────────────────────────────
exports.getWishlist = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const wishlists = await Wishlist.find({ buyer_id: req.user._id })
            .populate({
                path: 'product_id',
                select: 'name main_image images slug main_price oldPrice moq'
            });

        res.json(wishlists || []);
    } catch (error) {
        console.error('getWishlist error:', error);
        res.status(500).json({
            message: 'Error fetching wishlist',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ─────────────────────────────────────────────
// Toggle Wishlist Item
// POST /api/auth/wishlist/toggle
// Authenticated
// ─────────────────────────────────────────────
exports.toggleWishlist = async (req, res) => {
    try {
        let { productId } = req.body;
        if (!productId) return res.status(400).json({ message: 'Product ID is required' });

        if (!req.user) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Resolve slug if needed
        if (typeof productId === 'string' && !productId.match(/^[0-9a-fA-F]{24}$/)) {
            const product = await Product.findOne({ slug: productId });
            if (!product) return res.status(404).json({ message: 'Product not found' });
            productId = product._id;
        }

        let isLiked = false;

        // Check user documents wishlist array
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let wishlistArray = user.wishlist || [];
        const productIndex = wishlistArray.findIndex(id => id.toString() === productId.toString());

        if (productIndex > -1) {
            // Remove
            wishlistArray.splice(productIndex, 1);
            // Also clean up Wishlist collection just in case
            await Wishlist.deleteOne({ buyer_id: req.user._id, product_id: productId });
        } else {
            // Add
            const productCheck = await Product.findById(productId);
            if (!productCheck) return res.status(404).json({ message: 'Product not found' });

            wishlistArray.push(productId);
            // Add to collection
            await Wishlist.create({ buyer_id: req.user._id, product_id: productId });
            isLiked = true;
        }

        user.wishlist = wishlistArray;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            isLiked,
            wishlist: user.wishlist
        });
    } catch (error) {
        console.error('toggleWishlist error:', error);
        res.status(500).json({ message: 'Error toggling wishlist: ' + error.message });
    }
};

// Social Login Auth URLs is handled via exports below

exports.updateSecurity = async (req, res) => {
    try {
        const { twoFactorEnabled } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.twoFactorEnabled = twoFactorEnabled;
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: `2FA ${twoFactorEnabled ? 'enabled' : 'disabled'} successfully`,
            twoFactorEnabled: user.twoFactorEnabled
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Social Login Handlers
exports.getSocialAuthUrls = async (req, res) => {
    try {
        const SocialLogin = require('../models/SocialLogin');
        const config = await SocialLogin.findOne();
        if (!config) return res.status(404).json({ message: 'Social login not configured' });

        const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const urls = {};

        if (config.google?.enabled && config.google?.client_id) {
            const redirectUri = `${process.env.APP_URL || origin}/api/auth/google/callback`;
            urls.google = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
        }

        if (config.facebook?.enabled && config.facebook?.app_id) {
            const redirectUri = `${process.env.APP_URL || origin}/api/auth/facebook/callback`;
            urls.facebook = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${config.facebook.app_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile`;
        }

        if (config.linkedin?.enabled && config.linkedin?.client_id) {
            const redirectUri = `${process.env.APP_URL || origin}/api/auth/linkedin/callback`;
            urls.linkedin = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.linkedin.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`;
        }

        res.json(urls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.googleCallback = async (req, res) => {
    const { code } = req.query;
    try {
        if (!code) return res.send('<script>window.close()</script>');

        const SocialLogin = require('../models/SocialLogin');
        const config = await SocialLogin.findOne();
        if (!config || !config.google?.enabled) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_disabled`);
        }

        const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const redirectUri = `${process.env.APP_URL || origin}/api/auth/google/callback`;

        // 1. Exchange code for token
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: config.google.client_id,
            client_secret: config.google.client_secret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        const accessToken = tokenRes.data.access_token;

        // 2. Fetch User Profile
        const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const userData = {
            id: profileRes.data.id,
            email: profileRes.data.email,
            name: profileRes.data.name,
            image: profileRes.data.picture,
            provider: 'google'
        };

        await handleSocialLogin(userData, res);
    } catch (err) {
        console.error('Google OAuth Error:', err.response?.data || err.message);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};

exports.facebookCallback = async (req, res) => {
    const { code } = req.query;
    try {
        if (!code) return res.send('<script>window.close()</script>');
        const userData = {
            id: 'FB' + Date.now(),
            email: `fb_${Date.now()}@gmail.com`,
            name: 'Facebook User'
        };
        await handleSocialLogin(userData, res);
    } catch (err) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};

exports.linkedinCallback = async (req, res) => {
    const { code } = req.query;
    try {
        if (!code) return res.send('<script>window.close()</script>');

        const SocialLogin = require('../models/SocialLogin');
        const config = await SocialLogin.findOne();
        if (!config || !config.linkedin?.enabled) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=linkedin_disabled`);
        }

        const origin = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const redirectUri = `${process.env.APP_URL || origin}/api/auth/linkedin/callback`;

        // 1. Exchange code for token
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: config.linkedin.client_id,
            client_secret: config.linkedin.client_secret
        });

        const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', tokenParams.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenRes.data.access_token;

        // 2. Fetch User Profile
        const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const userData = {
            id: profileRes.data.sub,
            email: profileRes.data.email,
            name: profileRes.data.name,
            image: profileRes.data.picture,
            provider: 'linkedin'
        };

        await handleSocialLogin(userData, res);
    } catch (err) {
        console.error('LinkedIn OAuth Error:', err.response?.data || err.message);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};

// ─────────────────────────────────────────────
// Change Password
// PUT /api/auth/change-password
// ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// Soft Delete Account
// DELETE /api/auth/delete-account
// ─────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isDeleted = true;
        user.status = 'inactive';
        await user.save({ validateBeforeSave: false });

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const imagePath = `/uploads/profiles/${req.file.filename}`;
        user.profile_image = imagePath;

        if (user.roles.includes('supplier') && !user.logo) {
            user.logo = imagePath;
        }

        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: 'Profile image updated successfully',
            profile_image: imagePath
        });
    } catch (error) {
        console.error('updateProfileImage error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// Forgot Password
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email);
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        const otp = generateOTP();
        const otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otp_expires = otp_expires;
        await user.save({ validateBeforeSave: false });

        // Send Forgot Password OTP
        await addJob('email', {
            to: email,
            subject: 'Password Reset Code - Alibaba Demo',
            text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #ff6600;">Password Reset Request</h2>
                    <p>We received a request to reset your password. Use the code below to proceed:</p>
                    <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>If you didn't request a password reset, please ignore this email.</p>
                </div>
            `
        });

        res.json({ success: true, message: 'Password reset code sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// Become Supplier (Onboarding Flow)
// POST /api/auth/become-supplier
// Authenticated
// ─────────────────────────────────────────────
exports.becomeSupplier = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const {
            company_name, business_type, address_line1, city, state, zip_code,
            country, website, description, staff_size, annual_revenue,
            account_name, account_number, bank_name, ifsc_code, swift_code,
            tax_id, phone, phone_country
        } = req.body;

        const id_proof = req.file ? `/uploads/verification/${req.file.filename}` : '';

        user.company_name = company_name || user.company_name;
        user.business_type = business_type || user.business_type;
        user.address_line1 = address_line1 || user.address_line1;
        user.city = city || user.city;
        user.state = state || user.state;
        user.zip_code = zip_code || user.zip_code;
        user.phone_number = phone || user.phone_number;
        user.country_code = phone_country || user.country_code;

        // Upsert Company Profile
        const Company = require('../models/Company');
        await Company.findOneAndUpdate(
            { user_id: user._id },
            {
                user_id: user._id,
                company_name,
                business_type: Array.isArray(business_type) ? business_type.join(', ') : business_type,
                address: address_line1,
                city,
                state: state || '',
                country: country || '',
                website: website || '',
                description: description || '',
                staff_size: staff_size || '',
                annual_revenue: annual_revenue || '',
                tax_id: tax_id || '',
                phone: phone || '',
                phone_country: phone_country || '',
                id_proof: id_proof || '',
                document: id_proof || ''
            },
            { upsert: true, new: true, validateBeforeSave: false }
        );
        await user.save();

        // Add Bank Details if provided
        if (account_number && bank_name) {
            const newPayout = {
                type: 'bank',
                bank_name,
                account_name,
                account_number,
                ifsc_code,
                swift_code,
                is_default: true
            };
            user.payout_methods = [newPayout];
        }

        // Add supplier role if not present
        if (!user.roles.includes('supplier')) {
            user.roles.push('supplier');
        }

        user.status = 'profile_submitted';
        await user.save({ validateBeforeSave: false });

        res.json({
            success: true,
            message: 'You have successfully registered as a supplier!',
            user: {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                roles: user.roles,
                company_name: user.company_name,
                status: user.status
            }
        });
    } catch (error) {
        console.error('becomeSupplier error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────
// Reset Password
// POST /api/auth/reset-password
// ─────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const cleanEmail = email ? String(email) : '';

        const user = await User.findOne({ email: cleanEmail }).select('+otp +otp_expires');
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid code' });
        if (user.otp_expires < Date.now()) return res.status(400).json({ message: 'Code has expired' });

        user.password = newPassword;
        user.otp = undefined;
        user.otp_expires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

