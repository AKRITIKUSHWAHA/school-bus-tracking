const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    // 1. Check karo ki Header mein "Authorization" aur "Bearer" hai ya nahi
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Header se token nikalna (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // 2. Token ko verify karna
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. User ka data request object (req.user) mein dalna
            // Isse controller mein pata chal jayega ki kaun login hai
            req.user = {
                id: decoded.id,
                role: decoded.role
            };

            next(); // Agle function (Controller) par jao
        } catch (error) {
            console.error("Token verification failed:", error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // Agar token hi nahi mila toh
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- SABSE ZAROORI: Isse export karna mat bhulna ---
module.exports = protect;