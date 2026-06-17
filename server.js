const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

let playersDatabase = {};

app.post('/api/get-player', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Nik kiritilmadi!" });

    if (!playersDatabase[username]) {
        playersDatabase[username] = {
            score: 0,
            clickPower: 1,
            upgradeCost: 10,
            autoPower: 0,
            autoclickCost: 50,
            gamesUnlocked: { guess: false, react: false, wheel: false, crypto: false }
        };
    }
    res.json(playersDatabase[username]);
});

app.post('/api/click', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    playersDatabase[username].score += playersDatabase[username].clickPower;
    res.json({ success: true, score: playersDatabase[username].score });
});

app.post('/api/upgrade', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    if (player.score >= player.upgradeCost) {
        player.score -= player.upgradeCost;
        player.clickPower += 1;
        player.upgradeCost = Math.round(player.upgradeCost * 1.5);
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

app.post('/api/buy-robot', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    if (player.score >= player.autoclickCost) {
        player.score -= player.autoclickCost;
        player.autoPower += 1;
        player.autoclickCost = Math.round(player.autoclickCost * 1.7);
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

app.post('/api/auto-collect', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    if (player.autoPower > 0) { player.score += player.autoPower; }
    res.json({ success: true, score: player.score });
});

app.post('/api/unlock-game', (req, res) => {
    const { username, gameId, cost } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    
    // cost manfiy kelsa mini o'yin yutug'ini qo'shadi, musbat kelsa sotib oladi
    if (cost < 0 || player.score >= cost) {
        player.score -= cost;
        if (gameId !== 'dummy') { player.gamesUnlocked[gameId] = true; }
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

app.get('/api/leaderboard', (req, res) => {
    let sortedData = Object.keys(playersDatabase).map(username => {
        return { name: username, score: playersDatabase[username].score };
    }).sort((a, b) => b.score - a.score);
    res.json(sortedData);
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
