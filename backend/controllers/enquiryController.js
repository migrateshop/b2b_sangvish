const ProductEnquiry = require('../models/ProductEnquiry');
const Product = require('../models/Product');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// ─── BUYER: Send Enquiry ─────────────────────────────────────────────────────
exports.createEnquiry = async (req, res) => {
    try {
        const {
            productId,
            buyer_name,
            buyer_email,
            buyer_phone,
            subject,
            message,
            quantity,
            country
        } = req.body;

        const product = await Product.findById(productId).populate('supplier');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const supplierId = product.supplier._id || product.supplier;
        const buyerId = req.user._id;

        // Ensure buyer and supplier are different users
        if (buyerId.toString() === supplierId.toString()) {
            return res.status(400).json({ message: 'Suppliers cannot send general enquiries to themselves' });
        }

        let attachment = '';
        if (req.file) {
            attachment = `/uploads/enquiries/${req.file.filename}`;
        }

        // 1. Create or Find Conversation
        let conversation = await Conversation.findOne({
            buyer_id: buyerId,
            supplier_id: supplierId
        });

        if (!conversation) {
            conversation = await Conversation.create({
                buyer_id: buyerId,
                supplier_id: supplierId
            });
        }

        // 2. Post Chat Message with Product Context
        const chatMsg = `Hello! I have sent a Product Enquiry regarding "${product.name}".\n\n` +
                        `• Subject: ${subject}\n` +
                        `• Quantity interested: ${quantity} units\n` +
                        `• Message: ${message}`;

        const newMessage = await Message.create({
            conversationId: conversation._id,
            senderId: buyerId,
            receiverId: supplierId,
            content: chatMsg,
            messageType: 'text',
            productDetails: {
                productId: product._id,
                name: product.name,
                price: product.main_price,
                image: product.main_image
            }
        });

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        // 3. Create Product Enquiry Record
        const productEnquiry = await ProductEnquiry.create({
            product: productId,
            supplier: supplierId,
            buyer: buyerId,
            buyer_name,
            buyer_email,
            buyer_phone,
            subject,
            message,
            quantity: Number(quantity),
            country,
            attachment,
            status: 'unread',
            conversation: conversation._id
        });

        // 4. Send socket notification to Supplier
        const io = req.app.get('io');
        if (io) {
            await sendNotification(
                io,
                supplierId,
                'New Product Enquiry',
                `New enquiry for "${product.name}" from "${buyer_name}".`,
                'enquiry',
                `/supplier/dashboard/product-enquiries`
            );
            // Push message to active chat if connected
            io.to(supplierId.toString()).emit('messageReceived', newMessage);
        }

        // 5. Queue Email notification to Supplier
        try {
            const { enqueueTemplatedMail } = require('../services/mailService');
            const supplierUser = await User.findById(supplierId);
            if (supplierUser && supplierUser.email) {
                enqueueTemplatedMail('new-inquiry-received', supplierUser.email, {
                    first_name: supplierUser.first_name || 'Supplier',
                    buyer_name,
                    product_name: product.name,
                    subject: subject || `Enquiry for ${product.name}`,
                    quantity,
                    unit: 'pieces',
                    message: message,
                    inquiry_url: `${process.env.FRONTEND_URL}/supplier/dashboard/product-enquiries`
                }).catch(e => console.error('Enquiry email notify error:', e));
            }
        } catch (mailErr) {
            console.error('Enquiry email notification error:', mailErr);
        }

        res.status(201).json(productEnquiry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── BUYER & SUPPLIER: Get My Enquiries ──────────────────────────────────────
exports.getMyEnquiries = async (req, res) => {
    try {
        const isSupplier = req.user.roles?.includes('supplier') || req.user.role === 'supplier';
        const isBuyer = req.user.roles?.includes('buyer') || req.user.role === 'buyer';

        let query = {};
        if (isSupplier && isBuyer) {
            query = { $or: [{ supplier: req.user._id }, { buyer: req.user._id }] };
        } else if (isSupplier) {
            query = { supplier: req.user._id };
        } else {
            query = { buyer: req.user._id };
        }

        const enquiries = await ProductEnquiry.find(query)
            .populate('product', 'name main_image main_price')
            .populate('buyer', 'first_name last_name company_name country_code')
            .populate('supplier', 'first_name last_name company_name country_code')
            .sort({ createdAt: -1 });

        res.json(enquiries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── SUPPLIER: Reply to Enquiry ──────────────────────────────────────────────
exports.replyEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;

        const enquiry = await ProductEnquiry.findById(id)
            .populate('product', 'name')
            .populate('buyer', 'email first_name last_name');

        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        if (enquiry.supplier.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized. You are not the supplier for this enquiry.' });
        }

        enquiry.supplier_reply = replyMessage;
        enquiry.status = 'replied';
        await enquiry.save();

        // Send chat reply
        let conversation = await Conversation.findById(enquiry.conversation);
        if (!conversation) {
            conversation = await Conversation.findOne({
                buyer_id: enquiry.buyer._id,
                supplier_id: req.user._id
            });
        }

        if (conversation) {
            const chatReply = await Message.create({
                conversationId: conversation._id,
                senderId: req.user._id,
                receiverId: enquiry.buyer._id,
                content: `In response to your Enquiry regarding "${enquiry.product.name}":\n\n${replyMessage}`,
                messageType: 'text'
            });

            conversation.lastMessage = chatReply._id;
            await conversation.save();

            // Emit via socket to buyer
            const io = req.app.get('io');
            if (io) {
                io.to(enquiry.buyer._id.toString()).emit('messageReceived', chatReply);
            }
        }

        // Real-time notification to buyer
        const io = req.app.get('io');
        if (io) {
            await sendNotification(
                io,
                enquiry.buyer._id,
                'Supplier Replied to Enquiry',
                `Supplier sent a reply regarding "${enquiry.product.name}".`,
                'enquiry',
                `/dashboard/inquiries`
            );
        }

        // Email to Buyer
        try {
            const { enqueueTemplatedMail } = require('../services/mailService');
            if (enquiry.buyer && enquiry.buyer.email) {
                enqueueTemplatedMail('new-inquiry-received', enquiry.buyer.email, {
                    first_name: enquiry.buyer.first_name || 'Buyer',
                    buyer_name: req.user.company_name || `${req.user.first_name} ${req.user.last_name}`,
                    product_name: enquiry.product.name,
                    subject: `Re: Enquiry regarding ${enquiry.product.name}`,
                    quantity: enquiry.quantity,
                    unit: 'pieces',
                    message: replyMessage,
                    inquiry_url: `${process.env.FRONTEND_URL}/dashboard/inquiries`
                }).catch(e => console.error('Enquiry reply email notify error:', e));
            }
        } catch (mailErr) {
            console.error('Enquiry reply email error:', mailErr);
        }

        res.json(enquiry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── SUPPLIER: Close Enquiry ─────────────────────────────────────────────────
exports.closeEnquiry = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiry = await ProductEnquiry.findById(id);
        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        if (enquiry.supplier.toString() !== req.user._id.toString() && enquiry.buyer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        enquiry.status = 'closed';
        await enquiry.save();

        res.json(enquiry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── ADMIN: Get All Enquiries ────────────────────────────────────────────────
exports.getAdminEnquiries = async (req, res) => {
    try {
        const { status, supplierId } = req.query;

        let query = {};
        if (status) query.status = status;
        if (supplierId) query.supplier = supplierId;

        const enquiries = await ProductEnquiry.find(query)
            .populate('product', 'name main_image main_price')
            .populate('buyer', 'first_name last_name company_name email')
            .populate('supplier', 'first_name last_name company_name email')
            .sort({ createdAt: -1 });

        res.json(enquiries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── ADMIN: Delete Enquiry ───────────────────────────────────────────────────
exports.adminDeleteEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        await ProductEnquiry.findByIdAndDelete(id);
        res.json({ message: 'Enquiry deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
