const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// HAR BIR AKKAUNT UCHUN ALOHIDA XOTIRA BAZASI
let userScores = {};

function getUserState(userId) {
    if (!userScores[userId]) {
        userScores[userId] = {
            score: 0,
            clickPower: 1,
            upgradeCost: 10,
            autoPower: 0,
            autoclickCost: 50,
            gamesUnlocked: { guess: false, react: false, wheel: false, crypto: false }
        };
    }
    return userScores[userId];
}

let leaderboardData = [
    { name: "Alisher_Pro", score: 2500 },
    { name: "Jasur_Clicker", score: 1850 },
    { name: "Sardor_Dev", score: 1200 }
];

app.post('/api/game-state', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID kerak!" });
    res.json(getUserState(userId));
});

app.post('/api/click', (req, res) => {
    const { userId } = req.body;
    let state = getUserState(userId);
    state.score += state.clickPower;
    res.json({ success: true, score: state.score });
});

app.post('/api/upgrade', (req, res) => {
    const { userId } = req.body;
    let state = getUserState(userId);
    if (state.score >= state.upgradeCost) {
        state.score -= state.upgradeCost;
        state.clickPower += 1;
        state.upgradeCost = Math.round(state.upgradeCost * 1.5);
        res.json({ success: true, state: state });
    } else {
        res.status(400).json({ success: false, message: "Mablag' yetarli emas!" });
    }
});

app.post('/api/autoclick', (req, res) => {
    const { userId } = req.body;
    let state = getUserState(userId);
    if (state.score >= state.autoclickCost) {
        state.score -= state.autoclickCost;
        state.autoPower += 1; 
        state.autoclickCost = Math.round(state.autoclickCost * 1.6); 
        res.json({ success: true, state: state });
    } else {
        res.status(400).json({ success: false, message: "Mablag' yetarli emas!" });
    }
});

app.post('/api/unlock-game', (req, res) => {
    const { userId, gameId } = req.body;
    let state = getUserState(userId);
    let cost = 100;
    if (gameId === 'react') cost = 300;
    if (gameId === 'wheel') cost = 500;
    if (gameId === 'crypto') cost = 1000;

    if (state.score >= cost) {
        state.score -= cost;
        state.gamesUnlocked[gameId] = true;
        res.json({ success: true, state: state });
    } else {
        res.status(400).json({ success: false, message: "Tangalar yetarli emas!" });
    }
});

app.post('/api/reward', (req, res) => {
    const { userId, amount } = req.body;
    let state = getUserState(userId);
    if (amount && amount > 0) {
        state.score += amount;
        res.json({ success: true, score: state.score });
    } else {
        res.status(400).json({ success: false });
    }
});

app.post('/api/leaderboard', (req, res) => {
    const { userId } = req.body;
    let state = getUserState(userId);
    
    let currentLeaderboard = [...leaderboardData];
    currentLeaderboard.push({ name: "Siz (Sinfdoshingiz)", score: state.score });
    
    let sortedData = currentLeaderboard.sort((a, b) => b.score - a.score);
    res.json(sortedData);
});

// Avto-robot har bir foydalanuvchiga alohida ishlaydi
setInterval(() => {
    Object.keys(userScores).forEach(userId => {
        if (userScores[userId].autoPower > 0) {
            userScores[userId].score += userScores[userId].autoPower;
        }
    });
}, 1000);

app.listen(PORT, () => {
    console.log(`Server xavfsiz ishga tushdi: http://localhost:${PORT}`);
});
