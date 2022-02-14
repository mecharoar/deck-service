const express = require('express');
const app = express();
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
const { connect } = require('mongoose');
const { createDeck, deleteDeck, drawCards, reshuffleDeck, getStats } = require('./service');

const port = 3001;
const host = '0.0.0.0';
const credentials = './X509-cert-6978667032009923969.pem';
const uriSsl = 'mongodb+srv://cluster0.tpnos.mongodb.net/deal_me_in?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority';
const mongooseSslOpt = {
    ssl: true,
    authMechanism: 'MONGODB-X509',
    sslKey: credentials,
    sslCert: credentials
};
connect(uriSsl, mongooseSslOpt).then(() => console.log('mongoose connected...')).catch(error => console.error(error));

app.use(logger('combined'));

app.use(methodOverride('_method'));
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/decks', createDeck);

app.delete('/decks/:id', deleteDeck);

// app.get('/decks/:id', getDeck); // not sure I need this anyway
app.get('/decks/:id/draw/:count', drawCards);
app.get('/decks/:id/reshuffle', reshuffleDeck);
app.get('/decks/:id/stats', getStats );

app.use((error, req, res, next) => {
    // more specific error handling goes here   
    console.log('error handling now...') 
    console.error(error);
    res.status(error.status || 500)//.send(error)
    res.json({
        message: error.message,
        error: error        
    });
});

app.listen(port, host);
console.log(`Running on http://${host}:${port}`);