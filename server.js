const express = require('express');
const path = require('path');
const app = Math.create ? null : express(); // Expressni oddiy chaqirish
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Haqiqiy o'yinchilar bazasi
let playersDatabase = {};

// O'yinchi holatini olish yoki yangi ochish
app.post('/api/get-player', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Nik kiritilmadi!" });

    if (!playersDatabase[username]) {
        playersDatabase[username] = {
            score: 0,
            clickPower: 1,
            upgradeCost: 10,
            gamesUnlocked: { guess: false, react: false, wheel: false, crypto: false }
        };
    }
    res.json(playersDatabase[username]);
});

// Click qilish API
app.post('/api/click', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "Xato o'yinchi!" });

    playersDatabase[username].score += playersDatabase[username].clickPower;
    res.json({ success: true, score: playersDatabase[username].score });
});

// Kuchaytirish (Upgrade) API
app.post('/api/upgrade', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "Xato o'yinchi!" });

    let player = playersDatabase[username];
    if (player.score >= player.upgradeCost) {
        player.score -= player.upgradeCost;
        player.clickPower += 1;
        player.upgradeCost = Math.round(player.upgradeCost * 1.5);
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Mablag' yetarli emas!" });
    }
});

// 🔓 MINI O'YINLARNI SOTIB OLISH API (MANA SHU JOYI ISHLAMAYOTGAN EDI)
app.post('/api/unlock-game', (req, res) => {
    const { username, gameId, cost } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "Xato o'yinchi!" });

    let player = playersDatabase[username];
    if (player.score >= cost) {
        player.score -= cost;
        player.gamesUnlocked[gameId] = true; // O'yinni ochish
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Tangalaringiz yetarli emas!" });
    }
});

// Haqiqiy Leaderboard
app.get('/api/leaderboard', (req, res) => {
    let sortedLeaderboard = Object.keys(playersDatabase).map(username => {
        return { name: username, score: playersDatabase[username].score };
    }).sort((a, b) => b.score - a.score);
    res.json(sortedLeaderboard);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
