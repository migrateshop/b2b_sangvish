const mongoose = require('mongoose');
const EmailTemplate = require('./models/EmailTemplate');
require('dotenv').config();

const templates = [
    {
        name: 'Welcome Email',
        slug: 'welcome-email',
        subject: 'Welcome to {{site_name}}!',
        body: 'Hello {{user_name}},\n\nWelcome to {{site_name}}! We are glad to have you on board.\n\nYou can now start exploring products and connecting with global suppliers.\n\nBest regards,\nThe {{site_name}} Team',
        placeholders: ['user_name', 'site_name'],
        status: 'active',
        description: 'Sent to new users after registration.'
    },
    {
        name: 'Order Confirmation',
        slug: 'order-confirmation',
        subject: 'Order Confirmed: #{{order_id}}',
        body: 'Dear {{user_name}},\n\nYour order #{{order_id}} has been successfully placed.\n\nOrder Total: {{order_total}}\n\nYou can track your order in your dashboard.\n\nThank you for shopping with us!',
        placeholders: ['user_name', 'order_id', 'order_total'],
        status: 'active',
        description: 'Sent to buyers after a successful order placement.'
    },
    {
        name: 'Post RFQ Confirmation',
        slug: 'post-rfq-confirmation',
        subject: 'Your RFQ "{{rfq_title}}" has been posted successfully',
        body: 'Hello {{user_name}},\n\nYour Request for Quotation (RFQ) for "{{rfq_title}}" has been successfully posted on {{site_name}}.\n\nDetails:\n- Quantity: {{quantity}} {{unit}}\n- Expected Price: {{target_price}} {{currency}}\n\nYou will receive a notification when suppliers submit their quotes.\n\nBest regards,\nThe {{site_name}} Team',
        placeholders: ['user_name', 'rfq_title', 'quantity', 'unit', 'target_price', 'currency', 'site_name'],
        status: 'active',
        description: 'Sent to buyer after posting a new RFQ.'
    },
    {
        name: 'New Quote received',
        slug: 'new-quote-received',
        subject: 'New Quote for your RFQ: {{rfq_title}}',
        body: 'Hello {{user_name}},\n\nA supplier has submitted a new quote for your RFQ "{{rfq_title}}".\n\nPrice Offered: {{price_offered}} {{currency}}\nNote: {{note}}\n\nYou can view and negotiate this quote in your dashboard: {{quote_link}}\n\nBest regards,\nThe {{site_name}} Team',
        placeholders: ['user_name', 'rfq_title', 'price_offered', 'currency', 'note', 'quote_link', 'site_name'],
        status: 'active',
        description: 'Sent to buyer when a supplier submits a quote.'
    },
    {
        name: 'Quote Status Update',
        slug: 'quote-status-update',
        subject: 'Update on your quote for RFQ: {{rfq_title}}',
        body: 'Hello {{user_name}},\n\nYour quote for the RFQ "{{rfq_title}}" has been {{status}}.\n\nYou can view the details here: {{quote_link}}\n\nBest regards,\nThe {{site_name}} Team',
        placeholders: ['user_name', 'rfq_title', 'status', 'quote_link', 'site_name'],
        status: 'active',
        description: 'Sent to supplier when quote status is updated (Accepted/Rejected).'
    },
    {
        name: 'Quote Negotiation Notification',
        slug: 'quote-negotiated',
        subject: 'New counter-offer received for RFQ: {{rfq_title}}',
        body: 'Hello {{user_name}},\n\nA new counter-offer has been sent for the RFQ "{{rfq_title}}".\n\nNew Price: {{price}} {{currency}}\nNote: {{note}}\n\nYou can view and respond here: {{quote_link}}\n\nBest regards,\nThe {{site_name}} Team',
        placeholders: ['user_name', 'rfq_title', 'price', 'currency', 'note', 'quote_link', 'site_name'],
        status: 'active',
        description: 'Sent to the counter-party when a price negotiation happens.'
    },
    {
        name: 'Admin: New RFQ Posted',
        slug: 'admin-new-rfq-notification',
        subject: 'New RFQ Posted: {{rfq_title}}',
        body: 'Hello Admin,\n\nA new RFQ has been posted by {{buyer_name}} ({{buyer_email}}).\n\nRFQ Title: {{rfq_title}}\nCategory: {{category}}\nQuantity: {{quantity}} {{unit}}\n\nYou can review it in the admin panel: {{admin_link}}\n\nBest regards,\n{{site_name}}',
        placeholders: ['buyer_name', 'buyer_email', 'rfq_title', 'category', 'quantity', 'unit', 'admin_link', 'site_name'],
        status: 'active',
        description: 'Sent to the site administrator when a new RFQ is created.'
    },
    {
        name: 'Verify Email',
        slug: 'verify-email',
        subject: 'Verify your email address',
        body: 'Hello,\n\nPlease click the link below to verify your email address:\n\n{{verification_link}}\n\nIf you did not create an account, no further action is required.',
        placeholders: ['verification_link'],
        status: 'active',
        description: 'Account verification email.'
    }
];

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_demo');
        console.log('Connected to MongoDB...');

        for (const t of templates) {
            await EmailTemplate.findOneAndUpdate(
                { slug: t.slug },
                t,
                { upsert: true, new: true }
            );
        }

        console.log('Email templates seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding templates:', err);
        process.exit(1);
    }
};

seedTemplates();
