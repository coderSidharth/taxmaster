const { Router } = require("express");
const express = require("express");
const app = express();
const router = express.Router();
const taxResult = require('../models/taxResult') //schema part
const fetchuser = require("../middleware/fetchuser"); //from this middleware we will receieving user
const remainderSchema = require("../models/remainder")
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const { scheduleReminder } = require('../utils/mailer');



//Route 1 : this end point POST "/api/notes/addnote" . Here we will add user tax details
router.post("/addDetails", fetchuser, [
    body('bas', "Enter a valid bas").isNumeric(),
    body('lta', "Enter a valid lta").isNumeric(),
    body('hra', "Enter a valid hra").isNumeric(),
    body('fa', "Enter a valid fa").isNumeric(),
    body('inv', "Enter a valid inv").isNumeric(),
    body('med', "Enter a valid med").isNumeric()
], async (req, res) => {
    //if there are errors then return bad requests and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { bas, lta, hra, fa, inv, med, rent, finalTax } = req.body; //taking user filled data

        const tax = new taxResult({
            bas, lta, hra, fa, inv, med, user: req.user.id, rent, TotalTax: finalTax //adding user filled data in database. 4 filled will be added
        })
        const savedNote = await tax.save();   //saving to database
        res.json(savedNote);
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Some error occured");
    }
})


//getting all the tax details for the particular use
router.get("/get_all_tax", fetchuser, async (req, res) => {
    // //if there are errors then return bad requests and the errors
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }

    try {
        const { userId } = req.body; //taking user filled data
        const taxes = await taxResult.find({ user: req.user.id });
        res.json(taxes);
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Some error occured");
    }
})

router.put("/update_tax/:id", fetchuser, async (req, res) => {
    // //if there are errors then return bad requests and the errors
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }

    try {
        const { userId } = req.body; //taking user filled data
        const userExist = await taxResult.find({ user: req.user.id });
        const ifTax = await taxResult.findById(req.params.id); //this will check user url id exists or not
        if (!ifTax) {
            return res.status(404).send("Not Found");
        }
        if (ifTax.user.toString() != req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        const taxUpdated = await taxResult.findByIdAndUpdate(req.params.id, { $set: { status: true } }, { new: true });
        res.json(taxUpdated);
    }
    catch (e) {
        console.log(e);
        res.status(500).send("Some error occured");
    }
})



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