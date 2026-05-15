const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            return next();
        } catch (error) {
            console.error('Auth protect error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const softProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Ignore token error, proceed as guest
        }
    }
    next();
};

const authorizeRoles = (...rolesToAuthorize) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, no user found' });
        }
        // Handle both new array format and old string format for backward compatibility
        const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []); 
        
        // Every authenticated user (supplier, admin) can implicitly act as a buyer
        const effectiveRoles = [...userRoles];
        if (!effectiveRoles.includes('buyer')) {
            effectiveRoles.push('buyer');
        }

        const isAuthorized = rolesToAuthorize.some(role => effectiveRoles.includes(role));

        if (!isAuthorized) {
            return res.status(403).json({
                message: `User roles '${userRoles.join(', ')}' are not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles, softProtect };
