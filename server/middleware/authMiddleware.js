const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");

    // Check whether the token exists
    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. Please login again.",
            code: "TOKEN_MISSING"
        });
    }

    // Check Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Invalid authorization format. Please login again.",
            code: "INVALID_AUTH_FORMAT"
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: "Access token is missing. Please login again.",
            code: "TOKEN_MISSING"
        });
    }

    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in environment variables.");

            return res.status(500).json({
                message: "Server authentication configuration error."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        return next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Your session has expired. Please login again.",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token. Please login again.",
                code: "TOKEN_INVALID"
            });
        }

        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Authentication failed. Please login again.",
            code: "AUTH_FAILED"
        });
    }
};

module.exports = authMiddleware;