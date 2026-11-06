const express = require("express");
const router = express.Router();
const User = require('../models/users.js');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || "Raushanislege!@####nd";
const fetchuser = require("../middleware/fetchuser");


// Route 1: Register a new user — POST /api/auth/createUser
router.post("/createUser", [
    body('email', "Enter a valid email address").isEmail(),
    body('name', "Name must be at least 3 characters").isLength({ min: 3 }),
    body('password', "Password must be at least 5 characters").isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const checkuser = await User.findOne({ email: req.body.email });
        if (checkuser) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const secPassword = await bcrypt.hash(req.body.password, salt);

        const user = await User.create({
            name: req.body.name,
            password: secPassword,
            email: req.body.email
        });

        const data = { user: { id: user.id } };
        const authToken = jwt.sign(data, JWT_SECRET);

        res.json({ success: true, authToken });
    } catch (e) {
        console.error(e);
        res.status(500).send("Some error occurred");
    }
});

// Route 2: Authenticate user & issue JWT — POST /api/auth/login
router.post("/login", [
    body('email', "Enter a valid email address").isEmail(),
    body('password', "Password cannot be blank").exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid credentials. Please check and try again." });
        }

        const comparePassword = await bcrypt.compare(password, user.password);
        if (!comparePassword) {
            return res.status(400).json({ success: false, error: "Invalid credentials. Please check and try again." });
        }

        const data = { user: { id: user.id } };
        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({ success: true, authToken });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
});

// Route 3: Get logged-in user profile — POST /api/auth/getuser (login required)
router.post("/getuser", fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.send(user);
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
});


module.exports = router