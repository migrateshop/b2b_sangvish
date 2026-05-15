const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CMSPage = require('./models/Page');

dotenv.config();

const seedCMS = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_demo');
        console.log('Connected to MongoDB');

        const pages = [
            {
                title: 'Privacy Policy',
                slug: 'privacy-policy',
                content: `<h2>Privacy Policy</h2>
<p>Your privacy is important to us. This privacy statement explains the personal data we process, how we process it, and for what purposes.</p>
<h3>1. Information We Collect</h3>
<p>We collect data to provide the best experience on our platform. This includes information you provide directly to us (such as when you create an account) and information we collect automatically (such as your IP address, browser type, and device information).</p>
<h3>2. How We Use Your Information</h3>
<p>The information we collect is used to:</p>
<ul>
    <li>Provide, maintain, and improve our services.</li>
    <li>Process transactions and send related information.</li>
    <li>Send administrative messages, security alerts, and support messages.</li>
    <li>Respond to user comments, questions, and requests.</li>
</ul>
<h3>3. Data Security</h3>
<p>We prioritize your security and adopt appropriate data collection, storage, and processing practices. We use advanced encryption protocols to protect your sensitive information from unauthorized access, alteration, disclosure, or destruction.</p>
<h3>4. Changes to This Policy</h3>
<p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated effective date.</p>
<p>If you have any questions about this Privacy Policy, please contact our support team.</p>`,
                isPublished: true,
                metaDescription: 'Our Privacy Policy.'
            },
            {
                title: 'Terms of Use',
                slug: 'terms-of-use',
                content: `<h2>Terms of Use</h2>
<p>Welcome to our B2B marketplace. By accessing or using our platform, you agree to be bound by these Terms of Use and our Privacy Policy.</p>
<h3>1. Acceptance of Terms</h3>
<p>By registering for an account, accessing, or using our services, you confirm that you have read, understood, and agreed to be bound by these Terms. If you do not agree to these Terms, you may not access or use the services.</p>
<h3>2. User Accounts</h3>
<ul>
    <li>You must provide accurate and complete information when creating an account.</li>
    <li>You are responsible for safeguarding your account credentials and for any activities or actions under your account.</li>
    <li>You agree to notify us immediately of any unauthorized use of your account or any other breach of security.</li>
</ul>
<h3>3. Acceptable Use</h3>
<p>You agree to use our platform only for lawful purposes in a B2B context. You must not use the platform to engage in any activity that:</p>
<ul>
    <li>Violates any local, state, national, or international law or regulation.</li>
    <li>Is fraudulent, deceptive, or misleading.</li>
    <li>Infringes on the intellectual property rights of others.</li>
    <li>Distributes malware, viruses, or other harmful computer code.</li>
</ul>
<h3>4. Content Ownership</h3>
<p>Any content you upload, post, or transmit through our platform remains your property. However, by providing content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display such content in connection with providing our services.</p>
<h3>5. Limitation of Liability</h3>
<p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from your access to or use of or inability to access or use our services.</p>
<p>For more details, please contact us.</p>`,
                isPublished: true,
                metaDescription: 'Terms of Use for our platform.'
            },
            {
                title: 'Legal Information',
                slug: 'legal-information',
                content: `<h2>Legal Information</h2>
<p>This page contains legal disclosures and related compliance information.</p>
<h3>Copyright Notice</h3>
<p>&copy; ${new Date().getFullYear()} Alibaba Demo. All rights reserved. The text, images, graphics, sound files, animation files, video files, and their arrangement on our platform are all subject to copyright and other intellectual property protection.</p>
<h3>Trademarks</h3>
<p>Unless otherwise indicated, all marks displayed on our platform are subject to the trademark rights of our company, including each respective primary brand and its corporate logos and emblems.</p>
<h3>Disclaimer</h3>
<p>The information contained on this website is for general information purposes only. The information is provided by Alibaba Demo, and while we endeavor to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose.</p>`,
                isPublished: true,
                metaDescription: 'Legal and compliance information.'
            },
            {
                title: 'For Buyers',
                slug: 'for-buyers',
                content: `
<h2>Buyer Help Center</h2>
<p>Welcome to the ultimate buyer guide. Here you can find comprehensive information on how to seamlessly source high-quality products, communicate with trusted verified suppliers, and effectively manage your wholesale orders securely on our platform.</p>
<h3>1. Searching for Products</h3>
<p>Use our advanced search engine with category filters and AI-driven recommendations to discover exactly what you need. Filter by price, Minimum Order Quantity (MOQ), supplier region, and product certifications to ensure the items meet your specific requirements.</p>
<h3>2. Contacting Suppliers</h3>
<p>Reach out directly to suppliers using our real-time instant messaging system or by submitting a Request for Quotation (RFQ). Communicate your specific needs, request customizations, and negotiate pricing to secure the best deal.</p>
<h3>3. Placing Orders Securely</h3>
<p>Once you've agreed on terms, proceed with our secure payment gateway that offers escrow services, ensuring your funds are protected until you receive and verify your goods.</p>
<h3>4. Managing Orders</h3>
<p>Track your shipments, view invoices, request after-sales support, and manage your buyer profile effortlessly through your dedicated Buyer Dashboard.</p>`,
                isPublished: true,
                metaDescription: 'Complete guide for buyers on our platform.'
            }
        ];

        for (const page of pages) {
            const exists = await CMSPage.findOne({ slug: page.slug });
            if (exists) {
                console.log(`Page ${page.slug} already exists, updating...`);
                await CMSPage.findOneAndUpdate({ slug: page.slug }, page);
            } else {
                console.log(`Creating page ${page.slug}...`);
                await CMSPage.create(page);
            }
        }

        console.log('Privacy, Terms, and updated Buyer pages seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding CMS:', err);
        process.exit(1);
    }
};

seedCMS();
