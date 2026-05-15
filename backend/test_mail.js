require('dotenv').config();
const { sendMail } = require('./services/mailService');

const testEmail = async () => {
    try {
        console.log('Testing email configuration...');
        console.log('Using SMTP Host:', process.env.MAIL_HOST);
        console.log('Using Username:', process.env.MAIL_USERNAME);

        await sendMail({
            to: process.env.MAIL_USERNAME, // Send to yourself
            subject: 'Production Mail Test - Alibaba Demo',
            text: 'This is a test email to confirm that live mail configuration is working.',
            html: '<h1>Test Email</h1><p>This is a test email to confirm that <b>live mail configuration</b> is working.</p>',
        });

        console.log('✅ Test email sent successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to send test email:', error);
        process.exit(1);
    }
};

testEmail();
