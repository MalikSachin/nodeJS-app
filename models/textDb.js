const mongoose = require('mongoose');

const TextDb = mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('TextDb', TextDb);