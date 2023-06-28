const express = require("express");
var cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const cache = require('map-expire');

const duration = 10 * 60 * 1000; // 10 minutes

app.get('/', (req, res) => {
    res.send("Express on Vercel with CORS");
});

app.get('/api/pronos/:id', (req, res) => {
    const matchId = '' + req.params.id;
    const match = cache.get(matchId);
    res.send(match);
});

app.post('/api/pronos', function (req, res) {
    req.body.id = '' + req.body.id;
    cache.set(req.body.id, req.body, duration);
    res.send(req.body);
})

app.listen(5000, () => {
    console.log("Running on port 5000.");
});
// Export the Express API
module.exports = app;
