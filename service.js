const { Deck } = require('./Deck');
const axios = require('axios');
const { Types: { ObjectId } } = require('mongoose');

const suits = ['heart', 'spade', 'club', 'diamond'];
const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const drawableParams = { drawn: false, discarded: false };
const drawnParams = { drawn: true, discarded: false };
const discardedParams = { discarded: true };

async function getRemaining(id) {
    let { data } = await axios.get('http://localhost:3000/cards',
        { params: { deckId: id, ...drawableParams } });
    return data;
}
async function getDiscarded(id) {
    let { data } = await axios.get('http://localhost:3000/cards',
        { params: { deckId: id, ...discardedParams } });
    return data;
}

async function createDeck(req, res, next) {
    try {
        let newDeck = await Deck.create({ undrawn: 52 });
        let cards = values.map(val => {
            return suits.map(suit => { 
                return {
                    suit: suit,
                    value: val,
                    deckId: newDeck.id
            }; })
        }).flat();

        let { data } = await axios.post('http://localhost:3000/cards', cards);

        res.send({ ...newDeck._doc, cards: data });
    } catch (err) {
        next(err);
    }
}

async function deleteDeck(req, res, next) {
    try {
        if(!req.params.id) res.status(400).send('Deck Id must be provided');
        let { data } = await axios.delete('http://localhost:3000/cards', { params: { deckId: req.params.id } });
        let result = await Deck.findByIdAndDelete(req.params.id);
        res.send({...result._doc, cards: data});
    } catch (err) {
        next(err);
    }
}

async function drawCards(req, res, next) {
    try {
        if(!req.params.id) res.status(400).send('Deck Id must be provided');
        if(!req.params.count) res.status(400).send('Drawn count must be provided');
        let count = req.params.count;
        let drawn = [];
        
        // let { data } = await axios.get('http://localhost:3000/cards',
        //     { params: { deckId: req.params.id, ...drawableParams } });
        let remaining = await getRemaining(req.params.id);

        // intentionally allowing empty array to be forwarded instead of throwing error.
        // not sure if I want to force shuffle discarded cards here, or from the calling service.
        if(remaining.length > 0) {        
            while (count > 0 & drawn.length != remaining.length) {
                let index = Math.floor(Math.random() * remaining.length);
                if(drawn.findIndex(card => card._id === remaining[index]._id) === -1) {
                    drawn.push({ ...remaining[index], ...drawnParams});
                    count--;
                }
            }

            // set drawn to true
            let params = drawn.reduce((acc, card, idx) => { 
                return { ...acc, [`_id[${idx}]`]: card._id };
            }, {});
            await axios.put('http://localhost:3000/cards',
                { ...drawnParams }, { params });
        }
        res.send(drawn);
    } catch (err) {
        next(err);
    }    
}

async function reshuffleDeck(req, res, next) {
    try {
        let { data } = await axios.put('http://localhost:3000/cards',
            { ...drawableParams }, { params: { ...discardedParams, deckId: req.params.id } });
        res.send(data);
    } catch (err) {
        next(err);
    }   
}

async function getStats(req, res, next) {
    try {
        let remaining = await getRemaining(req.params.id);
        let discarded = await getDiscarded(req.params.id);
        let stats = {
            cardsInDeck: remaining.length,
            cardsDiscarded: discarded.length,
            cardsInPlay: 52 - (remaining.length + discarded.length)
        }
        res.send(stats);
    } catch (err) {
        next(err);
    }   
}

module.exports = { createDeck, deleteDeck, drawCards, reshuffleDeck, getStats };
