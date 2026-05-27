const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all required models
const User = require('../models/User');
const Company = require('../models/Company');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const BillingAddress = require('../models/BillingAddress');
const ShippingAddress = require('../models/ShippingAddress');
const RFQ = require('../models/RFQ');
const Quote = require('../models/Quote');
const ProductEnquiry = require('../models/ProductEnquiry');
const ProductCustomizationRequest = require('../models/ProductCustomizationRequest');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Job = require('../models/Job');
const MongoLock = require('../models/MongoLock');
const DummyDataLog = require('../models/DummyDataLog');

const LOCK_KEY = 'dummy_data_action_lock';
const LOCK_TIMEOUT_MS = 600000; // 10 minutes max lock duration
const CHUNK_SIZE = 500; // Standard size to avoid BSON payload boundary errors

/**
 * Split array into chunks of a predefined maximum size
 */
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

/**
 * Capture current heap memory utilization
 */
const getMemoryTelemetry = () => {
    const memory = process.memoryUsage();
    return {
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100
    };
};

/**
 * Helper to acquire distributed lock in MongoDB
 */
const acquireLock = async (workerId) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TIMEOUT_MS);
    try {
        const lock = await MongoLock.findOneAndUpdate(
            { key: LOCK_KEY },
            { 
                $setOnInsert: { 
                    key: LOCK_KEY,
                    workerId,
                    acquiredAt: now,
                    expiresAt
                } 
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (lock.workerId === workerId) {
            return true;
        }

        if (lock.expiresAt < now) {
            const stolenLock = await MongoLock.findOneAndUpdate(
                { key: LOCK_KEY, expiresAt: { $lt: now } },
                { $set: { workerId, acquiredAt: now, expiresAt } },
                { new: true }
            );
            if (stolenLock && stolenLock.workerId === workerId) {
                return true;
            }
        }

        return false;
    } catch (err) {
        return false;
    }
};

/**
 * Helper to release distributed lock in MongoDB
 */
const releaseLock = async (workerId) => {
    try {
        await MongoLock.deleteOne({ key: LOCK_KEY, workerId });
    } catch (err) {
        console.error('Failed to release lock:', err);
    }
};

/**
 * Check if the current MongoDB connection supports replica sets/transactions
 */
const isReplicaSet = async () => {
    try {
        const adminDb = mongoose.connection.db.admin();
        const status = await adminDb.serverStatus();
        return !!status.repl;
    } catch (e) {
        return false;
    }
};

/**
 * Integrity & Readiness Health Check prior to database operations
 */
const runReadinessHealthChecks = () => {
    // 1. Verify Database socket readiness
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Database Health Check Failed: MongoDB connection is currently offline or connecting.');
    }

    const storagePath = path.join(__dirname, '../storage/dummy_data_import');
    const metadataFile = path.join(storagePath, 'metadata.json');

    // 2. Verify Metadata Configuration
    if (!fs.existsSync(metadataFile)) {
        throw new Error('Readiness Check Failed: Storage metadata tracker mapping (metadata.json) is missing.');
    }

    const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
    
    // 3. Verify Required Dump Files Presence
    if (metadata.requiredFiles && Array.isArray(metadata.requiredFiles)) {
        for (const file of metadata.requiredFiles) {
            const filePath = path.join(storagePath, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Readiness Check Failed: Required relational dump asset is missing or corrupted: ${file}`);
            }
        }
    }

    return metadata;
};

/**
 * Cleans dynamic demo and user data while KEEPING critical master collections
 */
const performCleanup = async (logSession, session = null) => {
    const addLog = (msg) => {
        const timestamped = `[${new Date().toISOString()}] ${msg}`;
        console.log(timestamped);
        logSession.logs.push(timestamped);
    };

    addLog('Starting Database Cleanup...');

    // 1. Resolve Demo users ObjectIds dynamically by email to avoid static ID coding dependencies
    const demoBuyer = await User.findOne({ email: 'buyer@gmail.com' }, null, { session });
    const demoSupplier = await User.findOne({ email: 'supplier@gmail.com' }, null, { session });

    const buyerId = demoBuyer ? demoBuyer._id : null;
    const supplierId = demoSupplier ? demoSupplier._id : null;

    if (buyerId || supplierId) {
        addLog(`Dynamics resolved for demo accounts - Buyer ID: ${buyerId || 'none'}, Supplier ID: ${supplierId || 'none'}.`);
    }

    // 2. Delete all Orders, Transactions, Reviews, Disputes
    const orderDel = await Order.deleteMany({}, { session });
    addLog(`Deleted ${orderDel.deletedCount} orders.`);

    const txDel = await Transaction.deleteMany({}, { session });
    addLog(`Deleted ${txDel.deletedCount} transactions.`);

    const revDel = await Review.deleteMany({}, { session });
    addLog(`Deleted ${revDel.deletedCount} product reviews.`);

    const dispDel = await Dispute.deleteMany({}, { session });
    addLog(`Deleted ${dispDel.deletedCount} disputes.`);

    // 3. Delete all Chats (Conversations & Messages)
    const msgDel = await Message.deleteMany({}, { session });
    const convDel = await Conversation.deleteMany({}, { session });
    addLog(`Deleted ${msgDel.deletedCount} chat messages and ${convDel.deletedCount} conversations.`);

    // 4. Delete dynamic Buyer inquiries, RFQs, Quotes, Customizations
    const rfqDel = await RFQ.deleteMany({}, { session });
    const quoteDel = await Quote.deleteMany({}, { session });
    const enqDel = await ProductEnquiry.deleteMany({}, { session });
    const custDel = await ProductCustomizationRequest.deleteMany({}, { session });
    addLog(`Cleared RFQs (${rfqDel.deletedCount}), Quotes (${quoteDel.deletedCount}), Enquiries (${enqDel.deletedCount}), and Customization Requests (${custDel.deletedCount}).`);

    // 5. Delete Address books
    const billDel = await BillingAddress.deleteMany({}, { session });
    const shipDel = await ShippingAddress.deleteMany({}, { session });
    addLog(`Cleared Billing (${billDel.deletedCount}) and Shipping (${shipDel.deletedCount}) address records.`);

    // 6. Delete general notifications
    const notifDel = await Notification.deleteMany({}, { session });
    addLog(`Deleted ${notifDel.deletedCount} user notifications.`);

    // 7. Delete users EXCEPT system admin accounts
    const userDel = await User.deleteMany({ roles: { $nin: ['admin'] } }, { session });
    addLog(`Deleted ${userDel.deletedCount} customer/supplier user profiles (keeping administrators).`);

    // 8. Delete all products EXCEPT those linked to remaining users (which would be none)
    const prodDel = await Product.deleteMany({}, { session });
    addLog(`Deleted ${prodDel.deletedCount} product listings.`);

    // 9. Delete supplier company profiles
    const compDel = await Company.deleteMany({}, { session });
    addLog(`Deleted ${compDel.deletedCount} supplier business profiles.`);

    // 10. Clean up pending background jobs
    const jobDel = await Job.deleteMany({}, { session });
    addLog(`Cleared ${jobDel.deletedCount} background jobs.`);

    // 11. Delete logs older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldLogs = await AuditLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } }, { session });
    addLog(`Archived and deleted ${oldLogs.deletedCount} audit logs older than 30 days.`);

    // 12. Cleanup temporary uploads directory files if any (Safely, keeping master assets)
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            let cleanedFiles = 0;
            for (const file of files) {
                const filePath = path.join(uploadsDir, file);
                const stat = fs.statSync(filePath);
                if (stat.isFile() && !file.startsWith('default') && !file.includes('site_logo')) {
                    fs.unlinkSync(filePath);
                    cleanedFiles++;
                }
            }
            if (cleanedFiles > 0) {
                addLog(`Cleaned up ${cleanedFiles} temporary/user uploaded files from storage.`);
            }
        }
    } catch (err) {
        addLog(`Warning on uploads cleanup: ${err.message}`);
    }

    addLog('Database Cleanup Completed Successfully.');
    
    return {
        users: userDel.deletedCount,
        products: prodDel.deletedCount,
        companies: compDel.deletedCount
    };
};

/**
 * Imports Predefined Dummy JSON dumps in chunked blocks
 */
const performImport = async (logSession, session = null) => {
    const addLog = (msg) => {
        const timestamped = `[${new Date().toISOString()}] ${msg}`;
        console.log(timestamped);
        logSession.logs.push(timestamped);
    };

    const loadJson = (filename) => {
        const filePath = path.join(__dirname, '../storage/dummy_data_import', filename);
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    };

    addLog('Starting Predefined Dummy Data Import...');

    // Load JSON structures
    const categoriesData = loadJson('categories.json');
    const usersData = loadJson('users.json');
    const companiesData = loadJson('companies.json');
    const productsData = loadJson('products.json');
    const ordersData = loadJson('orders.json');
    const transactionsData = loadJson('transactions.json');
    const reviewsData = loadJson('reviews.json');
    const disputesData = loadJson('disputes.json');

    // 1. Categories Bulk Restorations (with Chunking)
    addLog(`Restoring ${categoriesData.length} B2B Product Categories in blocks...`);
    await Category.deleteMany({}, { session });
    const categoryChunks = chunkArray(categoriesData, CHUNK_SIZE);
    let importedCategoriesCount = 0;
    for (const chunk of categoryChunks) {
        const result = await Category.insertMany(chunk, { session });
        importedCategoriesCount += result.length;
    }
    addLog(`Categories successfully restored: ${importedCategoriesCount} records.`);

    // 2. Users (Buyer and Supplier)
    addLog('Creating default demo users (buyer@gmail.com, supplier@gmail.com)...');
    const usersToInsert = [];
    for (const u of usersData) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        usersToInsert.push({
            ...u,
            password: hashedPassword
        });
    }
    const users = await User.insertMany(usersToInsert, { session });
    addLog(`Demo users successfully registered.`);

    // 3. Supplier Company Profiles
    addLog('Creating supplier verified business profiles...');
    const companyChunks = chunkArray(companiesData, CHUNK_SIZE);
    let importedCompaniesCount = 0;
    for (const chunk of companyChunks) {
        const result = await Company.insertMany(chunk, { session });
        importedCompaniesCount += result.length;
    }
    addLog(`Companies restored: ${importedCompaniesCount} records.`);

    // 4. Products Bulk Restorations (with Chunking)
    addLog(`Importing ${productsData.length} premium B2B products in chunks...`);
    
    // Ensure slugs are pre-populated on the imported products
    const slugMap = new Map();
    for (const product of productsData) {
        if (!product.slug) {
            const baseSlug = product.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            let slug = baseSlug;
            let counter = 1;
            while (slugMap.has(slug)) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            product.slug = slug;
            slugMap.set(slug, true);
        } else {
            slugMap.set(product.slug, true);
        }
    }

    const productChunks = chunkArray(productsData, CHUNK_SIZE);
    let importedProductsCount = 0;
    for (const chunk of productChunks) {
        const result = await Product.insertMany(chunk, { session });
        importedProductsCount += result.length;
    }
    addLog(`Products successfully uploaded: ${importedProductsCount} records.`);

    // 5. Orders Restoration
    addLog('Restoring demo orders history...');
    const orderChunks = chunkArray(ordersData, CHUNK_SIZE);
    let importedOrdersCount = 0;
    for (const chunk of orderChunks) {
        const result = await Order.insertMany(chunk, { session });
        importedOrdersCount += result.length;
    }
    addLog(`Orders populated: ${importedOrdersCount} records.`);

    // 6. Transactions Restoration
    addLog('Restoring wallet transaction logs...');
    const txChunks = chunkArray(transactionsData, CHUNK_SIZE);
    let importedTxCount = 0;
    for (const chunk of txChunks) {
        const result = await Transaction.insertMany(chunk, { session });
        importedTxCount += result.length;
    }
    addLog(`Transactions populated: ${importedTxCount} records.`);

    // 7. Reviews Restoration
    addLog('Seeding product reviews and ratings...');
    const reviewChunks = chunkArray(reviewsData, CHUNK_SIZE);
    let importedReviewsCount = 0;
    for (const chunk of reviewChunks) {
        const result = await Review.insertMany(chunk, { session });
        importedReviewsCount += result.length;
    }
    addLog(`Reviews populated: ${importedReviewsCount} records.`);

    // Recalculate rating and numReviews for all products to keep them in sync with seeded reviews
    addLog('Recalculating rating and numReviews for all products...');
    const allProductsList = await Product.find({}, null, { session });
    for (const prod of allProductsList) {
        const productReviews = await Review.find({ product_id: prod._id }, null, { session });
        const numReviews = productReviews.length;
        const avgRating = numReviews > 0 ? (productReviews.reduce((acc, item) => item.rating + acc, 0) / numReviews) : 0;
        
        await Product.findByIdAndUpdate(prod._id, {
            rating: avgRating,
            numReviews
        }, { session });
    }
    addLog('Product ratings and review counts successfully synchronized with database reviews.');

    // 8. Disputes Restoration
    addLog('Seeding active mediation disputes...');
    const disputeChunks = chunkArray(disputesData, CHUNK_SIZE);
    let importedDisputesCount = 0;
    for (const chunk of disputeChunks) {
        const result = await Dispute.insertMany(chunk, { session });
        importedDisputesCount += result.length;
    }
    addLog(`Disputes populated: ${importedDisputesCount} records.`);

    // 9. Syncing Buyer and Supplier dynamic address hooks
    addLog('Synchronizing default address books for buyer and supplier accounts...');
    await BillingAddress.insertMany([
        {
            user: '664c7e6b0000000000000010',
            street: '123 Business Avenue',
            apartment: 'Suite 100',
            city: 'Los Angeles',
            state: 'California',
            postalCode: '90001',
            country: 'United States',
            phone: '+1 555 123 4567',
            isDefault: true
        },
        {
            user: '664c7e6b0000000000000011',
            street: 'Building 7, High-Tech Industrial Park',
            apartment: '',
            city: 'Zhenjiang',
            state: 'Jiangsu',
            postalCode: '212000',
            country: 'China',
            phone: '+86 138 9876 5432',
            isDefault: true
        }
    ], { session });

    await ShippingAddress.insertMany([
        {
            user: '664c7e6b0000000000000010',
            fullName: 'John Buyer',
            phone: '+1 555 123 4567',
            phoneCountry: 'US',
            addressLine: '123 Business Avenue, Suite 100',
            city: 'Los Angeles',
            state: 'California',
            country: 'United States',
            postalCode: '90001',
            isDefault: true
        },
        {
            user: '664c7e6b0000000000000011',
            fullName: 'Sarah Supplier',
            phone: '+86 138 9876 5432',
            phoneCountry: 'CN',
            addressLine: 'Building 7, High-Tech Industrial Park',
            city: 'Zhenjiang',
            state: 'Jiangsu',
            country: 'China',
            postalCode: '212000',
            isDefault: true
        }
    ], { session });

    addLog('Demo Data Restored & Imported Successfully.');

    return {
        users: users.length,
        products: importedProductsCount,
        categories: importedCategoriesCount,
        orders: importedOrdersCount,
        transactions: importedTxCount,
        companies: importedCompaniesCount,
        reviews: importedReviewsCount,
        disputes: importedDisputesCount
    };
};

/**
 * Main Controller-facing function for Cleanup
 */
exports.cleanupDemoData = async (initiatedBy, triggerType) => {
    // 1. Run health readiness checks first
    const metadata = runReadinessHealthChecks();
    
    const workerId = `worker_${Date.now()}`;
    
    // Acquire Lock
    const locked = await acquireLock(workerId);
    if (!locked) {
        throw new Error('A data modification action (import or cleanup) is currently in progress. Please wait.');
    }

    const logSession = await DummyDataLog.create({
        action: 'CLEANUP',
        status: 'processing',
        initiatedBy,
        triggerType,
        importVersion: metadata.version,
        serverHostname: os.hostname(),
        memoryUsage: getMemoryTelemetry(),
        logs: [`[${new Date().toISOString()}] Worker ${workerId} acquired run lock.`]
    });

    const startTime = Date.now();

    try {
        const replica = await isReplicaSet();
        let stats;

        if (replica) {
            console.log('🔄 Running Cleanup in a secure MongoDB Transaction Session');
            const dbSession = await mongoose.startSession();
            dbSession.startTransaction();
            try {
                stats = await performCleanup(logSession, dbSession);
                await dbSession.commitTransaction();
            } catch (err) {
                await dbSession.abortTransaction();
                throw err;
            } finally {
                dbSession.endSession();
            }
        } else {
            console.log('⚠️ MongoDB standalone detected. Running Cleanup sequentially');
            stats = await performCleanup(logSession);
        }

        logSession.status = 'completed';
        logSession.stats = {
            ...logSession.stats,
            users: stats.users,
            products: stats.products,
            companies: stats.companies
        };
        logSession.durationMs = Date.now() - startTime;
        logSession.memoryUsage = getMemoryTelemetry();
        logSession.logs.push(`[${new Date().toISOString()}] Cleanup process finished successfully.`);
        await logSession.save();

        return logSession;
    } catch (err) {
        logSession.status = 'failed';
        logSession.error = err.message;
        logSession.durationMs = Date.now() - startTime;
        logSession.memoryUsage = getMemoryTelemetry();
        logSession.logs.push(`[${new Date().toISOString()}] ERROR: ${err.message}`);
        logSession.logs.push(`[${new Date().toISOString()}] Rollback/Cleanup failed. Worker released lock.`);
        await logSession.save();

        throw err;
    } finally {
        await releaseLock(workerId);
    }
};

/**
 * Main Controller-facing function for Dummy Import
 */
exports.importDummyData = async (initiatedBy, triggerType) => {
    // 1. Run health readiness checks first
    const metadata = runReadinessHealthChecks();

    const workerId = `worker_${Date.now()}`;
    
    // Acquire Lock
    const locked = await acquireLock(workerId);
    if (!locked) {
        throw new Error('A data modification action (import or cleanup) is currently in progress. Please wait.');
    }

    const logSession = await DummyDataLog.create({
        action: 'IMPORT',
        status: 'processing',
        initiatedBy,
        triggerType,
        importVersion: metadata.version,
        serverHostname: os.hostname(),
        memoryUsage: getMemoryTelemetry(),
        logs: [`[${new Date().toISOString()}] Worker ${workerId} acquired run lock.`]
    });

    const startTime = Date.now();

    try {
        const replica = await isReplicaSet();
        let stats;

        // Perform dynamic cleanup based on queried emails to eliminate hardcoding dependencies
        if (replica) {
            console.log('🔄 Running Import in a secure MongoDB Transaction Session');
            const dbSession = await mongoose.startSession();
            dbSession.startTransaction();
            try {
                // Dynamically resolve target demo accounts from JSON
                const loadJson = (filename) => JSON.parse(fs.readFileSync(path.join(__dirname, '../storage/dummy_data_import', filename), 'utf-8'));
                const usersData = loadJson('users.json');
                const userIds = usersData.map(u => u._id);
                const supplierIds = usersData.filter(u => u.roles.includes('supplier')).map(u => u._id);

                // Delete dynamics
                await User.deleteMany({ _id: { $in: userIds } }, { session: dbSession });
                await Company.deleteMany({ user_id: { $in: userIds } }, { session: dbSession });
                await Product.deleteMany({ supplier: { $in: supplierIds } }, { session: dbSession });
                await Order.deleteMany({ $or: [{ buyer_id: { $in: userIds } }, { supplier_id: { $in: supplierIds } }] }, { session: dbSession });
                await Transaction.deleteMany({ user_id: { $in: userIds } }, { session: dbSession });
                await Review.deleteMany({ buyer_id: { $in: userIds } }, { session: dbSession });
                await Dispute.deleteMany({ buyer_id: { $in: userIds } }, { session: dbSession });
                await BillingAddress.deleteMany({ user_id: { $in: userIds } }, { session: dbSession });
                await ShippingAddress.deleteMany({ user_id: { $in: userIds } }, { session: dbSession });

                stats = await performImport(logSession, dbSession);
                await dbSession.commitTransaction();
            } catch (err) {
                await dbSession.abortTransaction();
                throw err;
            } finally {
                dbSession.endSession();
            }
        } else {
            console.log('⚠️ MongoDB standalone detected. Running Import sequentially');
            const loadJson = (filename) => JSON.parse(fs.readFileSync(path.join(__dirname, '../storage/dummy_data_import', filename), 'utf-8'));
            const usersData = loadJson('users.json');
            const userIds = usersData.map(u => u._id);
            const supplierIds = usersData.filter(u => u.roles.includes('supplier')).map(u => u._id);

            await User.deleteMany({ _id: { $in: userIds } });
            await Company.deleteMany({ user_id: { $in: userIds } });
            await Product.deleteMany({ supplier: { $in: supplierIds } });
            await Order.deleteMany({ $or: [{ buyer_id: { $in: userIds } }, { supplier_id: { $in: supplierIds } }] });
            await Transaction.deleteMany({ user_id: { $in: userIds } });
            await Review.deleteMany({ buyer_id: { $in: userIds } });
            await Dispute.deleteMany({ buyer_id: { $in: userIds } });
            await BillingAddress.deleteMany({ user_id: { $in: userIds } });
            await ShippingAddress.deleteMany({ user_id: { $in: userIds } });

            stats = await performImport(logSession);
        }

        logSession.status = 'completed';
        logSession.stats = {
            ...logSession.stats,
            users: stats.users,
            products: stats.products,
            categories: stats.categories,
            orders: stats.orders,
            transactions: stats.transactions,
            companies: stats.companies,
            reviews: stats.reviews,
            disputes: stats.disputes
        };
        logSession.durationMs = Date.now() - startTime;
        logSession.memoryUsage = getMemoryTelemetry();
        logSession.logs.push(`[${new Date().toISOString()}] Import process finished successfully.`);
        await logSession.save();

        return logSession;
    } catch (err) {
        logSession.status = 'failed';
        logSession.error = err.message;
        logSession.durationMs = Date.now() - startTime;
        logSession.memoryUsage = getMemoryTelemetry();
        logSession.logs.push(`[${new Date().toISOString()}] ERROR: ${err.message}`);
        logSession.logs.push(`[${new Date().toISOString()}] Rollback triggered. Import session cancelled.`);
        await logSession.save();

        throw err;
    } finally {
        await releaseLock(workerId);
    }
};

/**
 * Controller-facing function for the dynamic Dashboard display status
 */
exports.getSystemStatus = async () => {
    let demoEmails = ['buyer@gmail.com', 'supplier@gmail.com'];
    let supplierIdCondition = '664c7e6b0000000000000011';
    try {
        const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../storage/dummy_data_import/users.json'), 'utf-8'));
        demoEmails = usersData.map(u => u.email);
        supplierIdCondition = { $in: usersData.filter(u => u.roles.includes('supplier')).map(u => u._id) };
    } catch (e) {
        console.error('Could not load users.json for status calculation.');
    }
    const totalUsers = await User.countDocuments({ email: { $in: demoEmails } });
    const totalProducts = await Product.countDocuments({ supplier: supplierIdCondition });

    const lastImport = await DummyDataLog.findOne({ action: 'IMPORT', status: 'completed' }).sort({ createdAt: -1 });
    const activeLock = await MongoLock.findOne({ key: LOCK_KEY });

    return {
        totalUsers,
        totalProducts,
        lastImportTime: lastImport ? lastImport.createdAt : null,
        isCurrentlyRunning: !!activeLock && activeLock.expiresAt > new Date(),
        activeAction: activeLock ? 'processing' : 'idle',
        activeWorker: activeLock ? activeLock.workerId : null,
        serverHostname: lastImport ? lastImport.serverHostname : os.hostname(),
        importVersion: lastImport ? lastImport.importVersion : 'v1.0.0'
    };
};

/**
 * Get operation history logs
 */
exports.getSystemLogs = async () => {
    return await DummyDataLog.find().sort({ createdAt: -1 }).limit(50).populate('initiatedBy', 'email first_name last_name');
};
