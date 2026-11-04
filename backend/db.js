const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

const mongoUrl = process.env.dbCredential || 'mongodb://127.0.0.1:27017/taxmaster';
// console.log(mongoUrl)

const connectToMongo = () => {
    mongoose.connect(mongoUrl)
        .then(() => {
            console.log("Connected to Mongo successfully......");
        })
        .catch((err) => {
            console.error("Failed to connect to Mongo:", err);
        });
}

module.exports = connectToMongo;