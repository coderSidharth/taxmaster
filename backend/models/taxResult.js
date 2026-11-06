const mongoose = require('mongoose');
const { Schema } = mongoose;

const taxResultSchema = new Schema({
    // User account associated with this calculation
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    bas: {
        type: Number,
        required: true
    },
    lta: {
        type: Number,
        required: true
    },
    hra: {
        type: Number,
        required: true
    },
    fa: {
        type: Number,
        required: true
    },
    inv: {
        type: Number,
        required: true
    },
    med: {
        type: Number,
        required: true
    },
    rent: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: Boolean,
        default: false
    },
    isRemainder: {
        type: Boolean,
        default: false
    },
    TotalTax:{
        type:String
    },
    remainderDate: {
        type: String
    },
    userNameTax: {
        type: String
    }
});

module.exports = mongoose.model('notes', taxResultSchema)