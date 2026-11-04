const express = require("express");
const router = express.Router();
const taxResult = require('../models/taxResult');
const fetchuser = require("../middleware/fetchuser");
const remainderSchema = require("../models/remainder");
const { body, validationResult } = require('express-validator');
const { scheduleReminder } = require('../utils/mailer');
const { calculateTax } = require('../utils/taxCalculator');



//Route 1 : this end point POST "/api/notes/addnote" . Here we will add user tax details.
//Only Basic is required; every other component defaults to 0 when left blank.
router.post("/addDetails", fetchuser, [
    body('bas', "Enter a valid basic amount").isNumeric()
], async (req, res) => {
    //if there are errors then return bad requests and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { bas, lta, hra, fa, inv, med, rent, finalTax } = req.body; //taking user filled data
        const toNum = (v) => Number(v) || 0; //blank / missing / invalid -> 0

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
        const savedNote = await tax.save();   //saving to database
        res.json(savedNote);
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Some error occured");
    }
})


// Getting all tax details for the logged-in user
router.get("/get_all_tax", fetchuser, async (req, res) => {
    try {
        const taxes = await taxResult.find({ user: req.user.id });
        res.json(taxes);
    } catch (e) {
        console.error(e);
        res.status(500).send("Some error occured");
    }
});

// Mark tax as paid
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
        res.status(500).send("Some error occured");
    }
});



router.post("/setRemainder", fetchuser, async (req, res) => {
    try {
        const { email, id, date } = req.body; //taking user filled data
        if (!email || !id || !date) {
            return res.status(400).json({ error: "email, id and date are required" });
        }

        const ifTax = await taxResult.findById(id); //make sure the record exists and belongs to the user
        if (!ifTax) {
            return res.status(404).send("Not Found");
        }
        if (ifTax.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        const setData = new remainderSchema({
            email, taxId: id, userId: req.user.id, date
        })

        await taxResult.findByIdAndUpdate(id, { $set: { remainderDate: date, userNameTax: email } }, { new: true });
        const savedRemainder = await setData.save();   //saving to database

        // Schedule the reminder email on the chosen date (handled in utils/mailer.js).
        const scheduledFor = scheduleReminder({
            remainderId: savedRemainder._id, taxId: id, email, date
        });

        res.json({ ...savedRemainder.toObject(), scheduledFor });
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Some error occured");
    }
})


//delete a tax record of the logged in user
router.delete("/delete_tax/:id", fetchuser, async (req, res) => {
    try {
        const ifTax = await taxResult.findById(req.params.id); //this will check whether the record exists
        if (!ifTax) {
            return res.status(404).send("Not Found");
        }
        if (ifTax.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        const deleted = await taxResult.findByIdAndDelete(req.params.id);
        res.json({ success: true, deleted });
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Some error occured");
    }
})


module.exports = router