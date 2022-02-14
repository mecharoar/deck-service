const {model, Schema } = require('mongoose');

const Deck = model('Deck', new Schema({
    undrawn: {
        type: Number
    }
}));

module.exports = { Deck };
