const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');

let transporter = null;

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: process.env.MAIL_PORT || 587,
        secure: process.env.MAIL_ENCRYPTION === 'ssl', // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });
};

const getTransporter = () => {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
};

// Reset transporter when settings change (handled in emailSettingController potentially)
const resetTransporter = () => {
    transporter = null;
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<void>}
 */
const sendMail = async ({ to, subject, text, html }) => {
    try {
        const info = await getTransporter().sendMail({
            from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Send an email using a template
 * @param {string} slug - Template slug
 * @param {string} to - Recipient email
 * @param {Object} data - Placeholder data
 * @returns {Promise<void>}
 */
const sendTemplatedMail = async (slug, to, data) => {
    try {
        const template = await EmailTemplate.findOne({ slug, status: 'active' });
        if (!template) {
            console.error(`Template not found or inactive: ${slug}`);
            return;
        }

        let subject = template.subject;
        let body = template.body;

        // Replace placeholders
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, data[key]);
            body = body.replace(regex, data[key]);
        });

        // Basic HTML wrapper if not already HTML
        const html = body.includes('<') ? body : body.replace(/\n/g, '<br/>');

        return await sendMail({
            to,
            subject,
            html
        });
    } catch (error) {
        console.error(`Error sending templated email (${slug}):`, error);
        throw error;
    }
};

/**
 * Enqueue a templated email [Queue Integration]
 * @param {string} slug - Template slug
 * @param {string} to - Recipient email
 * @param {Object} data - Placeholder data
 * @returns {Promise<void>}
 */
const enqueueTemplatedMail = async (slug, to, data) => {
    try {
        const template = await EmailTemplate.findOne({ slug, status: 'active' });
        if (!template) {
            console.error(`Template not found or inactive for queue: ${slug}`);
            return;
        }

        let subject = template.subject;
        let body = template.body;

        // Replace placeholders (doing this now so it's stored pre-processed in the job)
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, data[key]);
            body = body.replace(regex, data[key]);
        });

        const html = body.includes('<') ? body : body.replace(/\n/g, '<br/>');

        const { addJob } = require('./queueService');
        return await addJob('email', {
            to,
            subject,
            html
        });
    } catch (error) {
        console.error(`Error enqueuing templated email (${slug}):`, error);
        throw error;
    }
};

module.exports = { sendMail, sendTemplatedMail, enqueueTemplatedMail, resetTransporter };

