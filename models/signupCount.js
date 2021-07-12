const mongoose = require('mongoose');

const UsercountSchema = mongoose.Schema({
    count: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('UserCount', UsercountSchema);