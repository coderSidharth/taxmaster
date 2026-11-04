require('dotenv').config();
const connectToMongo = require('./db');
const mongoose = require('mongoose');
const express = require("express");
var cors = require('cors');
const { reschedulePendingReminders } = require('./utils/mailer');
const app = express();

const port = 7000;
connectToMongo(); //just printing wether connected to database or not

// Once the database is connected, re-create any reminder jobs that were saved
// but not yet sent (node-schedule keeps jobs in memory and loses them on restart).
mongoose.connection.once('open', () => {
    reschedulePendingReminders();
});

app.use(cors());
app.use(express.json()); //middleware. compulsory

//Available Routes //if we go on /api/auth this point then we will get the info which providing in ./routes/auth.js location
// same for notes part
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/taxUser', require('./routes/taxUser.js'));


app.get("/", (req, res) => {
    res.send("Hello to main page");
})


app.listen(port, () => {
    console.log("Listeninig to 7000 port......");
})

