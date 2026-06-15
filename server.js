const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let serverState = {
    score: 0,
    clickPower: 1,
    upgradeCost: 10,
    autoPower: 0,
    autoclickCost: 50,
    gamesUnlocked: { guess: false, react: false, wheel: false, crypto: false },
    myCryptoCount: 0
};

let leaderboardData = [
    { name: "Alisher_Pro", score: 2500 },
    { name: "Jasur_Clicker", score: 1850 },
    { name: "Sardor_Dev", score: 1200 },
    { name: "Siz (Sinfdoshingiz)", score: 0 }
];

app.get('/api/game-state', (req, res) => {
    res.json(serverState);
});

app.post('/api/click', (req, res) => {
    serverState.score += serverState.clickPower;
    res.json({ success: true, score: serverState.score });
});

app.post('/api/upgrade', (req, res) => {
    if (serverState.score >= serverState.upgradeCost) {
        serverState.score -= serverState.upgradeCost;
        serverState.clickPower += 1;
        serverState.upgradeCost = Math.round(serverState.upgradeCost * 1.5);
        res.json({ success: true, state: serverState });
    } else {
        res.status(400).json({ success: false, message: "Mablag' yetarli emas!" });
    }
});

// AVTO-ROBOT API YO'LAGI (SHU YERGA QO'SHILDI)
app.post('/api/autoclick', (req, res) => {
    if (serverState.score >= serverState.autoclickCost) {
        serverState.score -= serverState.autoclickCost;
        serverState.autoPower += 1; 
        serverState.autoclickCost = Math.round(serverState.autoclickCost * 1.6); 
        res.json({ success: true, state: serverState });
    } else {
        res.status(400).json({ success: false, message: "Mablag' yetarli emas!" });
    }
});

app.get('/api/leaderboard', (req, res) => {
    leaderboardData[3].score = serverState.score;
    let sortedData = [...leaderboardData].sort((a, b) => b.score - a.score);
    res.json(sortedData);
});

setInterval(() => {
    if (serverState.autoPower > 0) {
        serverState.score += serverState.autoPower;
    }
}, 1000);

app.listen(PORT, () => {
    console.log(`Server xavfsiz ishga tushdi: http://localhost:${PORT}`);
});
