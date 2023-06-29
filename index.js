const express = require("express");
var cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const fetch = require('node-fetch');

const matches = new Map();

const url = 'https://odds.p.rapidapi.com/v4/sports/soccer_usa_mls/odds?regions=eu&oddsFormat=decimal&markets=h2h&dateFormat=iso';
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': '14a06c0ec5msh472e321cca5703ep1f33fdjsn7c843c14d3a3',
        'X-RapidAPI-Host': 'odds.p.rapidapi.com'
    }
};

function retrieveMatches() {
    try {
        console.log('Retrieve matches...');
        fetch(url, options)
            .then(response => response.json())
            .then(saveMatches)
            .catch(err => console.error(err))
    } catch (error) {
        console.error(error);
    }
}

function saveMatches(body) {
    console.log('Retrieved matches: ' + body.length);
    body.forEach(match => {
        let matchId = '' + match.id;
        matches.set(matchId, match);
    });
}

var period = 60 * 60 * 1000; // X minutes
retrieveMatches();
setInterval(retrieveMatches, period);

app.get('/', (req, res) => {
    res.send("Express on Vercel with CORS");
});

app.get('/api/matches', (req, res) => {
    res.send(Array.from(matches.values()));
});

app.listen(5000, () => {
    console.log("Running on port 5000.");
});

// Export the Express API
module.exports = app;
