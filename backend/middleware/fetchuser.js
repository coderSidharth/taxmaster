const jwt = require("jsonwebtoken");
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || "Raushanislege!@####nd";

const fetchuser = (req, res, next) => {
    // Read JWT auth-token from request header
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch (e) {
        res.status(401).send({ error: "Invalid or expired token" });
    }
};

module.exports = fetchuser;