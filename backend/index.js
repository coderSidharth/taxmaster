const buffer = require('buffer');
if (!buffer.SlowBuffer) {
    buffer.SlowBuffer = buffer.Buffer;
}
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const connectToMongo = require('./db');
const mongoose = require('mongoose');
const express = require("express");
var cors = require('cors');
const { reschedulePendingReminders } = require('./utils/mailer');
const app = express();

const port = process.env.PORT || 5001;
connectToMongo();
mongoose.connection.once('open', () => {
    reschedulePendingReminders();
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/taxUser', require('./routes/taxUser.js'));


app.get("/", (req, res) => {
    res.send("Hello to main page");
})


app.listen(port, () => {
    console.log(`Listeninig to ${port} port......`);
})

