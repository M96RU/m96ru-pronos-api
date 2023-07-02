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
    const now = new Date();
    console.log(`${now}: Retrieved ${body.length} matches`);
    body.forEach(match => {
        saveMatch(match);
    });
}

function saveMatch(match) {
    let matchId = '' + match.id;

    const matchWithOdds = {
        id : matchId,
        begin: match.commence_time,
        home: match.home_team,
        away: match.away_team,
        h2h: false
    }

    if (match.bookmakers && match.bookmakers.length > 0) {
        const unibet = match.bookmakers.find((bookmaker) => bookmaker.key == 'unibet_eu');
        if (unibet && unibet.markets && unibet.markets.length > 0) {
            const h2h = unibet.markets.find((market) => market.key == 'h2h');
            if (h2h && h2h.outcomes && h2h.outcomes.length > 0) {
                h2h.outcomes.forEach((outcome) => {
                   if (outcome.name == matchWithOdds.home) {
                       matchWithOdds.h2h = true;
                       matchWithOdds.h2h_1 = outcome.price;
                   } else if (outcome.name == matchWithOdds.away) {
                       matchWithOdds.h2h = true;
                       matchWithOdds.h2h_2 = outcome.price;
                   } else if (outcome.name == 'Draw') {
                       matchWithOdds.h2h = true;
                       matchWithOdds.h2h_X = outcome.price;
                   } else {
                       console.log(`Match ${matchId}: h2h unexpected outcome name ${outcome.name} with price ${outcome.price}`);
                   }
                });
                matchWithOdds.h2h = matchWithOdds.h2h_1 && matchWithOdds.h2h_2 && matchWithOdds.h2h_X;
            }
        }
    }

    console.log(matchWithOdds);
    matches.set(matchId, matchWithOdds);
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
