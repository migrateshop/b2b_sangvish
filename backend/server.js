const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');

// Load env vars
dotenv.config({ override: true });

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: 'Too many requests'
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit login/register to 20 per hour
    message: 'Too many attempts. Please try again after an hour.'
});

const app = express();
app.set('trust proxy', 1); // Trust all proxies (Cloudflare, Nginx, etc.)

// CORS Middleware
const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(',').map(url => url.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in development or explicitly check
        // To prevent 500 errors on frontend IPs
        callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
}));

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" }
}));
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/send-otp', authLimiter);

const server = http.createServer(app);

// Middleware
app.use('/api/webhook', require('./routes/webhookRoutes')); // Must be before express.json()
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/search', express.static(path.join(__dirname, 'uploads/search')));
app.use('/uploads/worldwide', express.static(path.join(__dirname, 'uploads/worldwide')));
app.use('/documentation', express.static(path.join(__dirname, '../documentation')));

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        const { initSocket, setIO } = require('./socket/socketHandler');
        const io = await initSocket(server);
        setIO(io);
        app.use((req, res, next) => {
            req.io = io;
            next();
        });

        // Health Check
        app.get('/api/health', (req, res) => res.json({ status: 'ok', environment: process.env.NODE_ENV }));

        // Routes
        app.use('/api/admin', require('./routes/admin/adminRoutes'));
        app.use('/api/auth', require('./routes/authRoutes'));
        app.use('/api/categories', require('./routes/categoryRoutes'));
        app.use('/api/ai', require('./routes/aiRoutes'));
        app.use('/api/products', require('./routes/productRoutes'));
        app.use('/api/supplier', require('./routes/supplierRoutes'));
        app.use('/api/rfq', require('./routes/rfqRoutes'));
        app.use('/api/orders', require('./routes/orderRoutes'));
        app.use('/api/inquiries', require('./routes/inquiryRoutes'));
        app.use('/api/customizations', require('./routes/customizationRoutes'));
        app.use('/api/product-enquiries', require('./routes/enquiryRoutes'));
        app.use('/api/company', require('./routes/companyRoutes'));
        app.use('/api/wishlist', require('./routes/wishlistRoutes'));
        app.use('/api/reviews', require('./routes/reviewRoutes'));
        app.use('/api/disputes', require('./routes/disputeRoutes'));
        app.use('/api/billing-address', require('./routes/billingAddressRoutes'));
        app.use('/api/shipping-address', require('./routes/shippingAddressRoutes'));
        app.use('/api/chat', require('./routes/chatRoutes'));
        app.use('/api/subscription-plans', require('./routes/subscriptionPlanRoutes'));
        app.use('/api/cms', require('./routes/cmsRoutes'));
        app.use('/api/notifications', require('./routes/notificationRoutes'));
        app.use('/api/tax', require('./routes/taxRoutes'));
        app.use('/api/worldwide', require('./routes/worldwideRoutes'));
        app.use('/api/common', require('./routes/commonRoutes'));
        app.use('/api/commissions', require('./routes/commissionRoutes'));
        app.use('/api/hero-slides', require('./routes/heroSlideRoutes'));
        app.use('/api/homepage-sections', require('./routes/admin/homepageSectionRoutes'));
        
        // Public social login config
        app.get('/api/test-cors', (req, res) => res.send('CORS and server are updated!'));
        const { getSocialLoginPublic } = require('./controllers/socialLoginController');
        app.get('/api/social-login/public', getSocialLoginPublic);

        // Public payment methods config
        const { getPaymentMethodsPublic } = require('./controllers/paymentSettingController');
        app.get('/api/payment-methods/public', getPaymentMethodsPublic);

        // Public site settings (for frontend to load primary color etc)
        const { getSiteSettings } = require('./controllers/admin/siteSettingController');
        app.get('/api/site-settings/public', getSiteSettings);

        // Global Error Handler for Logging
        app.use((err, req, res, next) => {
            const fs = require('fs');
            const logMsg = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Error: ${err.message}\nStack: ${err.stack}\n\n`;
            fs.appendFileSync('error.log', logMsg);
            console.error('🔥 GLOBAL ERROR CAUGHT:', err);
            res.status(500).json({ error: 'Internal Server Error', details: err.message });
        });

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

            // Run system maintenance on start and daily
            const { runMaintenance } = require('./services/maintenanceService');
            runMaintenance();
            setInterval(runMaintenance, 24 * 60 * 60 * 1000);

            // 🚀 Start Background Job Processor (Queue)
            if (process.env.QUEUE_CONNECTION === 'database') {
                const { processJobs } = require('./services/queueService');
                console.log('📦 Queue system enabled (database)');
                setInterval(processJobs, 60 * 1000); // Check every minute
            }
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();
