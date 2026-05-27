const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://b2b.sangvish.com';
const API_URL = 'https://b2b.sangvish.com/api';
const DOC_IMAGES_DIR = 'e:\\alibaba_live\\frontend\\public\\documentation\\images';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to fetch token and user object
async function getAuthData(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to login for ${email}: ${response.status} - ${errText}`);
    }
    const data = await response.json();
    return data;
}

async function captureScreenshots() {
    console.log('Fetching auth tokens from backend...');

    const adminAuth = await getAuthData('admin@gmail.com', '12345678');
    console.log('Successfully authenticated Admin');

    const buyerAuth = await getAuthData('buyer@gmail.com', 'password123');
    console.log('Successfully authenticated Buyer');

    const supplierAuth = await getAuthData('supplier@gmail.com', 'password123');
    console.log('Successfully authenticated Supplier');

    console.log('Launching Chrome browser...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        defaultViewport: { width: 1440, height: 900 }
    });
    const page = await browser.newPage();

    // 1. Capture Admin Pages
    console.log('Navigating to homepage to initialize localStorage context...');
    await page.goto(BASE_URL, { waitUntil: 'load' });

    console.log('Setting Admin credentials in localStorage...');
    await page.evaluate((token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }, adminAuth.token, adminAuth);

    const adminScreenshots = [
        { route: '/admin/dashboard', filename: 'admin_dashboard.png' },
        { route: '/admin/users', filename: 'all_user.png' },
        { route: '/admin/verifications', filename: 'company_Verification.png' },
        { route: '/admin/approvals', filename: 'Admin-Panel-Approvals-04-07-2026_03_56_PM.png' },
        { route: '/admin/categories', filename: 'Admin-Panel-Categories-04-07-2026_03_56_PM.png' },
        { route: '/admin/cms', filename: 'Admin-Panel-Cms-04-07-2026_04_02_PM.png' },
        { route: '/admin/commissions', filename: 'Admin-Panel-Commissions-04-07-2026_04_01_PM.png' },
        { route: '/admin/disputes', filename: 'Admin-Panel-Disputes-04-07-2026_03_57_PM.png' },
        { route: '/admin/orders', filename: 'Admin-Panel-Orders-04-07-2026_03_55_PM.png' },
        { route: '/admin/payment-methods', filename: 'Admin-Panel-Payment-Methods-04-07-2026_04_01_PM.png' },
        { route: '/admin/products', filename: 'Admin-Panel-Products-04-07-2026_03_55_PM.png' },
        { route: '/admin/revenue', filename: 'Admin-Panel-Revenue-04-07-2026_03_59_PM.png' },
        { route: '/admin/social-login', filename: 'Admin-Panel-Social-Login-04-07-2026_04_03_PM.png' },
        { route: '/admin/subscriptions', filename: 'Admin-Panel-Subscriptions-04-07-2026_04_03_PM.png' },
        { route: '/admin/tax', filename: 'Admin-Panel-Tax-04-07-2026_04_02_PM.png' },
        { route: '/admin/withdrawals', filename: 'Admin-Panel-Withdrawals-04-07-2026_03_58_PM.png' },
        { route: '/admin/worldwide', filename: 'Admin-Panel-Worldwide-04-07-2026_03_57_PM.png' }
    ];

    for (const item of adminScreenshots) {
        const url = `${BASE_URL}${item.route}`;
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'load' });
        await sleep(3000); // Wait for API data/charts to render fully
        const savePath = path.join(DOC_IMAGES_DIR, item.filename);
        await page.screenshot({ path: savePath });
        console.log(`Saved ${item.filename}`);
    }

    // 2. Capture Buyer Pages
    console.log('Setting Buyer credentials in localStorage...');
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.evaluate((token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }, buyerAuth.token, buyerAuth);

    console.log('Navigating to Buyer dashboard...');
    await page.goto(`${BASE_URL}/buyer/dashboard`, { waitUntil: 'load' });
    await sleep(3000);
    const buyerPath = path.join(DOC_IMAGES_DIR, 'all_buyer.png');
    await page.screenshot({ path: buyerPath });
    console.log('Saved all_buyer.png');

    console.log('Setting mock cart in localStorage...');
    await page.evaluate(() => {
        localStorage.setItem('cart', JSON.stringify([
            {
                name: "Premium Long Grain Basmati Rice",
                price: 1.25,
                quantity: 5000,
                image: "https://b2b.sangvish.com/rice_main_1773128254733.png",
                moq: 1000,
                variants: { "Type": "Basmati", "Grade": "A++" },
                supplier: "Global Grains Export House"
            },
            {
                name: "Raw Organic Cashew Nuts (Bulk)",
                price: 6.50,
                quantity: 800,
                image: "https://b2b.sangvish.com/cashew_nuts_main_1773128236238.png",
                moq: 200,
                variants: { "Quality": "W180 (King Size)", "Processing": "Raw" },
                supplier: "Viet Crop Processing Co."
            }
        ]));
     });

    console.log('Navigating to Buyer Cart...');
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'load' });
    await sleep(4000);
    const cartPath = path.join(DOC_IMAGES_DIR, 'buyer_cart.png');
    await page.screenshot({ path: cartPath });
    console.log('Saved buyer_cart.png');

    console.log('Navigating to Buyer Dashboard (representing wallet/payments)...');
    await page.goto(`${BASE_URL}/buyer/dashboard`, { waitUntil: 'load' });
    await sleep(3000);
    const buyerWalletPath = path.join(DOC_IMAGES_DIR, 'buyer_wallet.png');
    await page.screenshot({ path: buyerWalletPath });
    console.log('Saved buyer_wallet.png');

    console.log('Navigating to Buyer Settings...');
    await page.goto(`${BASE_URL}/buyer/dashboard/settings`, { waitUntil: 'load' });
    await sleep(3000);
    const buyerProfilePath = path.join(DOC_IMAGES_DIR, 'buyer_profile.png');
    await page.screenshot({ path: buyerProfilePath });
    console.log('Saved buyer_profile.png');

    console.log('Navigating to Buyer RFQs...');
    await page.goto(`${BASE_URL}/buyer/dashboard/my_rfqs`, { waitUntil: 'load' });
    await sleep(3000);
    const buyerRfqsPath = path.join(DOC_IMAGES_DIR, 'buyer_rfqs.png');
    await page.screenshot({ path: buyerRfqsPath });
    console.log('Saved buyer_rfqs.png');

    // 3. Capture Supplier Pages
    console.log('Setting Supplier credentials in localStorage...');
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.evaluate((token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }, supplierAuth.token, supplierAuth);

    console.log('Navigating to Supplier dashboard...');
    await page.goto(`${BASE_URL}/supplier/dashboard`, { waitUntil: 'load' });
    await sleep(3000);
    const supplierPath = path.join(DOC_IMAGES_DIR, 'all_supplier.png');
    await page.screenshot({ path: supplierPath });
    console.log('Saved all_supplier.png');

    console.log('Navigating to Supplier Wallet...');
    await page.goto(`${BASE_URL}/supplier/dashboard/wallet`, { waitUntil: 'load' });
    await sleep(3000);
    const supplierWalletPath = path.join(DOC_IMAGES_DIR, 'supplier_wallet.png');
    await page.screenshot({ path: supplierWalletPath });
    console.log('Saved supplier_wallet.png');

    console.log('Navigating to Supplier Quotes...');
    await page.goto(`${BASE_URL}/supplier/dashboard/my-quotes`, { waitUntil: 'load' });
    await sleep(3000);
    const supplierQuotesPath = path.join(DOC_IMAGES_DIR, 'supplier_quotes.png');
    await page.screenshot({ path: supplierQuotesPath });
    console.log('Saved supplier_quotes.png');

    await browser.close();
    console.log('Browser closed. All screenshots updated successfully.');
}

captureScreenshots().catch(err => {
    console.error('CRITICAL ERROR in capture script:', err);
    process.exit(1);
});
