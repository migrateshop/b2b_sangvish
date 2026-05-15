const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User = require('../models/User');

const initSocket = async (server) => {
    const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000";
    const allowedOrigins = rawOrigins.split(',').map(url => url.trim());

    const io = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Redis Setup
    try {
        const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        console.log('Redis connected and Socket.io adapter set up.');
    } catch (err) {
        console.warn('Redis connection failed, defaulting to memory adapter.', err.message);
    }

    let users = {}; // userId -> socketId

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        socket.on('join', (userId) => {
            if (!userId) {
                console.warn('📡 Socket: Join attempted with empty userId');
                return;
            }
            const userRoom = userId.toString();
            socket.join(userRoom);
            console.log(`📡 Socket: User ${userRoom} joined their personal room. (Socket ID: ${socket.id})`);
        });

        socket.on('sendMessage', async (data) => {
            const { conversationId, senderId, receiverId, content, messageType, attachments, productDetails, orderId } = data;

            try {
                // Save to Database
                const newMessage = new Message({
                    conversationId,
                    senderId,
                    receiverId,
                    content,
                    messageType,
                    attachments,
                    productDetails,
                    orderId
                });

                // Simple Translation Support (Mock or Logic)
                // For demonstration, we can auto-translate to 'es' if requested, or just structure it
                newMessage.translations = new Map();
                // In a real app, you'd call a translation API here
                // Example: newMessage.translations.set('es', await translate(content, 'es'));

                await newMessage.save();

                // Update Conversation last message
                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: newMessage._id,
                    updatedAt: new Date()
                });

                // Emit to Receiver
                io.to(receiverId.toString()).emit('messageReceived', newMessage);

                // Emit to Sender (for sync across multiple tabs)
                io.to(senderId.toString()).emit('messageSent', newMessage);

                // Determine receiver's role in the conversation
                const conversation = await Conversation.findById(conversationId);
                let receiverRole = 'buyer';
                if (conversation && conversation.supplier_id.toString() === receiverId.toString()) {
                    receiverRole = 'supplier';
                }

                // Create Notification
                const sender = await User.findById(senderId);
                const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'User';

                const notification = new Notification({
                    userId: receiverId,
                    title: `new message from ${senderName}`.trim(),
                    message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    type: 'chat',
                    role: receiverRole,
                    link: `${receiverRole === 'supplier' ? '/supplier' : ''}/dashboard/chat/${conversationId}`
                });
                await notification.save();

                // Emit Notification
                console.log(`🔔 Emitting notificationReceived to room ${receiverId.toString()}`);
                io.to(receiverId.toString()).emit('notificationReceived', notification);

            } catch (err) {
                console.error('Socket sendMessage error:', err);
            }
        });

        socket.on('markAsRead', async (data) => {
            const userId = data.userId || data.receiverId;
            const { conversationId } = data;
            
            if (!userId) {
                console.warn('📡 Socket: markAsRead error - missing userId/receiverId');
                return;
            }

            try {
                await Message.updateMany(
                    { conversationId, receiverId: userId, isRead: false },
                    { $set: { isRead: true } }
                );

                // Notify the sender that messages were read
                // We need to find who the sender was for these messages
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                const otherUserId = conversation.buyer_id && conversation.buyer_id.toString() === userId.toString() 
                    ? conversation.supplier_id 
                    : conversation.buyer_id;

                if (otherUserId) {
                    io.to(otherUserId.toString()).emit('messagesRead', { conversationId, readerId: userId });
                }
            } catch (err) {
                console.error('📡 Socket: markAsRead error:', err);
            }
        });

        socket.on('disconnect', () => {
            for (let userId in users) {
                if (users[userId] === socket.id) {
                    delete users[userId];
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

let _io;
const setIO = (io) => { _io = io; };
const getIO = () => _io;

module.exports = { initSocket, setIO, getIO };
