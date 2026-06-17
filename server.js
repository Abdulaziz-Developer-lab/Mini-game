const express = require('express');
const path = require('path');
const helmet = require('helmet');
const app = express();
app.use(helmet());
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

let playersDatabase = {};

// O'yinchini olish yoki yaratish
app.post('/api/get-player', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Nik kiritilmadi!" });

    if (!playersDatabase[username]) {
        playersDatabase[username] = {
            score: 0,
            clickPower: 1,
            upgradeCost: 50,
            autoPower: 0,
            autoclickCost: 250,
            gamesUnlocked: { guess: false, react: false, wheel: false, crypto: false },
            myCryptoCount: 0
        };
    }
    res.json(playersDatabase[username]);
});

// Tanga bosish
app.post('/api/click', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    playersDatabase[username].score += playersDatabase[username].clickPower;
    res.json({ success: true, score: playersDatabase[username].score });
});

// Kuchaytirish (Upgrade)
app.post('/api/upgrade', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    if (player.score >= player.upgradeCost) {
        player.score -= player.upgradeCost;
        player.clickPower += 1;
        player.upgradeCost = Math.round(player.upgradeCost * 1.6);
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

// Robot sotib olish
app.post('/api/buy-robot', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    if (player.score >= player.autoclickCost) {
        player.score -= player.autoclickCost;
        player.autoPower += 1;
        player.autoclickCost = Math.round(player.autoclickCost * 1.8);
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

// Avto-tanga yig'ish
app.post('/api/auto-collect', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    if (player.autoPower > 0) { player.score += player.autoPower; }
    res.json({ success: true, score: player.score });
});

// O'yinni ochish
app.post('/api/unlock-game', (req, res) => {
    const { username, gameId, cost } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    let player = playersDatabase[username];
    if (player.score >= cost) {
        player.score -= cost;
        player.gamesUnlocked[gameId] = true;
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

// Mukofot berish
app.post('/api/reward-player', (req, res) => {
    const { username, amount } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    playersDatabase[username].score += amount;
    if (playersDatabase[username].score < 0) playersDatabase[username].score = 0;
    res.json({ success: true, score: playersDatabase[username].score });
});

// Kripto savdosi
app.post('/api/crypto-trade', (req, res) => {
    const { username, action, price } = req.body;
    let player = playersDatabase[username];
    if (!player) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    if (action === 'buy' && player.score >= price) {
        player.score -= price;
        player.myCryptoCount += 1;
        return res.json({ success: true, state: player });
    } else if (action === 'sell' && player.myCryptoCount > 0) {
        player.score += price;
        player.myCryptoCount -= 1;
        return res.json({ success: true, state: player });
    }
    res.status(400).json({ success: false, message: "Mablag' yoki mahsulot yetarli emas!" });
});

// Reyting
app.get('/api/leaderboard', (req, res) => {
    let sorted = Object.keys(playersDatabase).map(user => {
        return { name: user, score: playersDatabase[user].score };
    }).sort((a, b) => b.score - a.score);
    res.json(sorted);
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.listen(PORT, () => console.log(`Server porti: ${PORT}`));
