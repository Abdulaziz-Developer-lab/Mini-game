const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- HIMOYA KODLARI ---
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 daqiqa
    max: 100, // Har bir IP uchun maksimal 100 ta so'rov
    message: "Juda ko'p so'rov yubordingiz, biroz kuting."
});
app.use('/api/', limiter);
// ----------------------

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
    // ... qolgan kodlaringiz
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});
