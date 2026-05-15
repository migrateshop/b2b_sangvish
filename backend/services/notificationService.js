const Notification = require('../models/Notification');

const sendNotification = async (io, userId, title, message, type, link, role = 'buyer') => {
    try {
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            link,
            role
        });

        if (io) {
            io.to(userId.toString()).emit('notificationReceived', notification);
        }

        return notification;
    } catch (err) {
        console.error('Failed to send notification:', err);
    }
};

module.exports = { sendNotification };
