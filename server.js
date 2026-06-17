const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Server xotirasida o'yin holati (Boshlang'ich tanga: 0)
let serverState = {
    score: 0,
    clickPower: 1,
    upgradeCost: 10,
    autoPower: 0,
    autoclickCost: 50,
    gamesUnlocked: { guess: false, react: false, wheel: false, crypto: false }
};

let leaderboardData = [
    { name: "Alisher_Pro", score: 2500 },
    { name: "Jasur_Clicker", score: 1850 },
    { name: "Sardor_Dev", score: 1200 },
    { name: "Siz", score: 0 }
];

// O'yin holatini olish
app.get('/api/game-state', (req, res) => {
    res.json(serverState);
});

// Click qilish API
app.post('/api/click', (req, res) => {
    serverState.score += serverState.clickPower;
    res.json({ success: true, score: serverState.score });
});

// Kuchaytirish (Upgrade) API
app.post('/api/upgrade', (req, res) => {
    if (serverState.score >= serverState.upgradeCost) {
        serverState.score -= serverState.upgradeCost;
        serverState.clickPower += 1;
        serverState.upgradeCost = Math.round(serverState.upgradeCost * 1.6);
        res.json({ success: true, state: serverState });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

// O'yin qulflarini ochish API
app.post('/api/unlock-game', (req, res) => {
    const { gameId, cost } = req.body;
    if (serverState.score >= cost) {
        serverState.score -= cost;
        serverState.gamesUnlocked[gameId] = true;
        res.json({ success: true, state: serverState });
    } else {
        res.status(400).json({ success: false, message: "Tangalaringiz yetarli emas!" });
    }
});

// Reyting (Leaderboard) API
app.get('/api/leaderboard', (req, res) => {
    leaderboardData[3].score = serverState.score; // Foydalanuvchi balandligini yangilash
    let sortedData = [...leaderboardData].sort((a, b) => b.score - a.score);
    res.json(sortedData);
});

app.listen(PORT, () => {
    console.log(`Server xavfsiz ishga tushdi: http://localhost:${PORT}`);
});
