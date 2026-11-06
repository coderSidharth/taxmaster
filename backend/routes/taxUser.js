const express = require("express");
const router = express.Router();
const taxResult = require('../models/taxResult');
const fetchuser = require("../middleware/fetchuser");
const remainderSchema = require("../models/remainder");
const { body, validationResult } = require('express-validator');
const { scheduleReminder } = require('../utils/mailer');
const { calculateTax } = require('../utils/taxCalculator');



// Route 1: Save tax calculation details — POST /api/taxUser/addDetails (requires auth)
// Only Basic is strictly required; remaining components default to 0 when left blank.
router.post("/addDetails", fetchuser, [
    body('bas', "Enter a valid basic amount").isNumeric()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { bas, lta, hra, fa, inv, med, rent, finalTax } = req.body;
        const toNum = (v) => Number(v) || 0;

        const computed = calculateTax({
            bas: toNum(bas),
            lta: toNum(lta),
            hra: toNum(hra),
            fa: toNum(fa),
            inv: toNum(inv),
            med: toNum(med),
            rent: toNum(rent),
        });

        const taxToSave = finalTax != null ? String(finalTax) : String(computed.totalTaxPayable);

        const tax = new taxResult({
            bas: toNum(bas),
            lta: toNum(lta),
            hra: toNum(hra),
            fa: toNum(fa),
            inv: toNum(inv),
            med: toNum(med),
            rent: toNum(rent),
            user: req.user.id,
            TotalTax: taxToSave
        });
        const savedNote = await tax.save();
        res.json(savedNote);
    } catch (e) {
        console.error(e);
        res.status(500).send("Some error occurred");
    }
});

// Route 2: Get all saved tax calculations for the logged-in user — GET /api/taxUser/get_all_tax
router.get("/get_all_tax", fetchuser, async (req, res) => {
    try {
        const taxes = await taxResult.find({ user: req.user.id });
        res.json(taxes);
    } catch (e) {
        console.error(e);
        res.status(500).send("Some error occurred");
    }
});

// Route 3: Mark tax as paid — PUT /api/taxUser/update_tax/:id
router.put("/update_tax/:id", fetchuser, async (req, res) => {
    try {
        const ifTax = await taxResult.findById(req.params.id);
        if (!ifTax) {
            return res.status(404).send("Not Found");
        }
        if (ifTax.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        const taxUpdated = await taxResult.findByIdAndUpdate(req.params.id, { $set: { status: true } }, { new: true });
        res.json(taxUpdated);
    } catch (e) {
        console.error(e);
        res.status(500).send("Some error occurred");
    }
});

// Route 4: Schedule an email reminder — POST /api/taxUser/setRemainder
router.post("/setRemainder", fetchuser, async (req, res) => {
    try {
        const { email, id, date } = req.body;
        if (!email || !id || !date) {
            return res.status(400).json({ error: "email, id and date are required" });
        }

        const ifTax = await taxResult.findById(id);
        if (!ifTax) {
            return res.status(404).send("Not Found");
        }
        if (ifTax.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        const setData = new remainderSchema({
            email, taxId: id, userId: req.user.id, date
        });

        await taxResult.findByIdAndUpdate(id, { $set: { remainderDate: date, userNameTax: email } }, { new: true });
        const savedRemainder = await setData.save();

        const scheduledFor = scheduleReminder({
            remainderId: savedRemainder._id, taxId: id, email, date
        });

        res.json({ ...savedRemainder.toObject(), scheduledFor });
    } catch (e) {
        console.error(e);
        res.status(500).send("Some error occurred");
    }
});

// Route 5: Delete a tax record — DELETE /api/taxUser/delete_tax/:id
router.delete("/delete_tax/:id", fetchuser, async (req, res) => {
    try {
        const ifTax = await taxResult.findById(req.params.id);
        if (!ifTax) {
            return res.status(404).send("Not Found");
        }
        if (ifTax.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        const deleted = await taxResult.findByIdAndDelete(req.params.id);
        res.json({ success: true, deleted });
    } catch (e) {
        console.error(e);
        res.status(500).send("Some error occurred");
    }
});


module.exports = router