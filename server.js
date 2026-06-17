const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// --- MA'LUMOTLAR BAZASI (Vaqtinchalik xotira) ---
const playersDatabase = {};

// --- HIMOYANI QO'SHISH ---
app.use(helmet({ contentSecurityPolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 100 // har bir IP dan 100 ta so'rov
});
app.use(limiter);

// JSON va URL-encoded ma'lumotlarni qabul qilish
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik fayllarni ulash (index.html, style.css larni Render o'qiy olishi uchun)
app.use(express.static(__dirname));

// --- SIZNING FUNKSIYALARINGIZ ---

// O'yinchi ma'lumotlarini olish yoki yaratish
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
    
    res.json({ success: true });
});

// Asosiy sahifani ochish
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- SERVERNI ISHGA TUSHIRISH (RENDER UCHUN) ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});
