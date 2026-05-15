const fs = require('fs');
const path = require('path');

exports.getEmailSettings = (req, res) => {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const settings = {
            MAIL_MAILER: '',
            MAIL_HOST: '',
            MAIL_PORT: '',
            MAIL_USERNAME: '',
            MAIL_PASSWORD: '',
            MAIL_ENCRYPTION: '',
            MAIL_FROM_ADDRESS: '',
            MAIL_FROM_NAME: ''
        };

        envContent.split(/\r?\n/).forEach(line => {
            if (line && line.includes('=')) {
                // To safely handle the first '=', avoiding splitting the value if it has '='
                const index = line.indexOf('=');
                const key = line.substring(0, index).trim();
                let value = line.substring(index + 1).trim();
                
                // Remove surrounding quotes if they exist
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.slice(1, -1);
                }

                if (Object.prototype.hasOwnProperty.call(settings, key)) {
                    settings[key] = value;
                }
            }
        });

        res.json(settings);
    } catch (err) {
        console.error('Failed to read email settings:', err);
        res.status(500).json({ message: 'Failed to read environment configurations.' });
    }
};

exports.updateEmailSettings = (req, res) => {
    try {
        const payload = req.body;
        const envPath = path.resolve(__dirname, '../../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        let lines = envContent.split(/\r?\n/);

        const keysToUpdate = [
            'MAIL_MAILER', 'MAIL_HOST', 'MAIL_PORT', 
            'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_ENCRYPTION', 
            'MAIL_FROM_ADDRESS', 'MAIL_FROM_NAME'
        ];

        keysToUpdate.forEach(key => {
            if (payload[key] !== undefined) {
                // Need to encode quotes for from_name if there's spaces
                let value = payload[key];
                if (key === 'MAIL_FROM_NAME' && value.includes(' ')) {
                    value = `"${value}"`;
                }
                
                const regex = new RegExp(`^${key}=.*`, 'm');
                if (regex.test(envContent)) {
                    // Update existing
                    envContent = envContent.replace(regex, `${key}=${value}`);
                } else {
                    // Append if not found
                    envContent += `\n${key}=${value}`;
                }
            }
        });

        fs.writeFileSync(envPath, envContent, 'utf8');

        // Manually update process.env and reset transporter
        const { resetTransporter } = require('../../services/mailService');
        keysToUpdate.forEach(key => {
            if (payload[key] !== undefined) {
                process.env[key] = payload[key];
            }
        });
        resetTransporter();

        res.json({ message: 'Email settings updated successfully and applied.' });
    } catch (err) {
        console.error('Failed to update email settings:', err);
        res.status(500).json({ message: 'Failed to write environment configurations.' });
    }
};
