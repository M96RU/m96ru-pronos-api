const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const liquibase = require('./liquibase/liquibase');
liquibase.run();

const Client = require('pg').Client;

const client = new Client({
    host: process.env.db_host,
    port: process.env.db_port,
    database: process.env.db_schema,
    user: process.env.db_user,
    password: process.env.db_pwd,
});

client.connect();

const fetch = require('node-fetch');

const url = 'https://odds.p.rapidapi.com/v4/sports/soccer_china_superleague/odds?regions=eu&oddsFormat=decimal&markets=h2h&dateFormat=iso';
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

async function saveMatch(match) {
    let matchId = '' + match.id;
    const begin = match.commence_time;
    const home = match.home_team;
    const away = match.away_team;

    const h2hOdds = {
        h2h_1: 0,
        h2h_x: 0,
        h2h_2: 0
    }

    if (match.bookmakers && match.bookmakers.length > 0) {
        const unibet = match.bookmakers.find((bookmaker) => bookmaker.key === 'unibet_eu');
        if (unibet && unibet.markets && unibet.markets.length > 0) {
            const h2h = unibet.markets.find((market) => market.key === 'h2h');
            if (h2h && h2h.outcomes && h2h.outcomes.length > 0) {
                h2h.outcomes.forEach((outcome) => {
                    if (outcome.name === home) {
                        h2hOdds.h2h_1 = outcome.price;
                    } else if (outcome.name === away) {
                        h2hOdds.h2h_2 = outcome.price;
                    } else if (outcome.name === 'Draw') {
                        h2hOdds.h2h_x = outcome.price;
                    } else {
                        console.log(`Match ${matchId}: h2h unexpected outcome name ${outcome.name} with price ${outcome.price}`);
                    }
                });
            }
        }
    }

    if (h2hOdds.h2h_1 > 0 && h2hOdds.h2h_2 > 0 && h2hOdds.h2h_x > 0) {
        const text = 'INSERT INTO matches(id, begin, home, away, h2h_1, h2h_x, h2h_2) VALUES($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(id) DO UPDATE SET begin = $2, home = $3, away = $4, h2h_1 = $5, h2h_x = $6, h2h_2 = $7 RETURNING *';
        const values = [matchId, begin, home, away, h2hOdds.h2h_1, h2hOdds.h2h_x, h2hOdds.h2h_2];
        const res = await client.query(text, values);
        console.log(res.rows);
    }

}

var period = 60 * 60 * 1000; // X minutes
retrieveMatches();
setInterval(retrieveMatches, period);

app.get('/', (req, res) => {
    res.send("Express on Vercel with CORS");
});

app.get('/api/matches', async (req, res) => {
    let matchesQuery = 'SELECT * FROM matches ORDER BY begin ASC, id';
    const userId = req.headers['user-id'];
    if (userId) {
        matchesQuery = 'SELECT m.*, b.choice, b.price FROM matches AS m LEFT JOIN bets AS b ON m.id = b.match_id WHERE b.user_id IS NULL OR b.user_id=\'' + userId + '\' ORDER BY begin ASC, m.id';
    }
    const matches = await client.query(matchesQuery);
    res.send(Array.from(matches.rows));
});

app.post('/api/bets', async (req, res) => {
    const now = new Date();
    const userId = req.headers['user-id'];
    const matchId = req.body.match_id;
    const choice = req.body.choice;
    const price = req.body.price;

    const text = 'INSERT INTO bets(match_id, user_id, creation_date, choice, price) VALUES($1, $2, $3, $4, $5) ON CONFLICT(match_id, user_id) DO UPDATE SET choice = $4, price = $5 RETURNING *';
    const values = [matchId, userId, now, choice, price];
    const bets = await client.query(text, values);
    console.log(bets.rows);

    res.send(Array.from(bets.rows));
});

app.listen(5000, () => {
    console.log("Running on port 5000.");
});

// Export the Express API
module.exports = app;
