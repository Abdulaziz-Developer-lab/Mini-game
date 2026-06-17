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

// O'yinchi ma'lumotlarini olish yoki yaratish (O'z holida qoladi)
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
}); // <--- Mana bu yerda get-player funksiyasi tugadi!

// --- PESHQADAMLAR RO'YXATINI OLISH (MUTLAQO ALOHIDA FUNKSIYA) ---
app.get('/api/leaderboard', (req, res) => {
    // 1. Bazadagi barcha o'yinchilarni massiv shakliga keltiramiz
    const leaderboard = Object.keys(playersDatabase).map(username => {
        return {
            username: username,
            score: playersDatabase[username].score
        };
    });

    // 2. Tangalar soni bo'yicha eng ko'pdan kamiga qarab tartiblaymiz
    leaderboard.sort((a, b) => b.score - a.score);

    // 3. Faqat eng kuchli 10 ta o'yinchini frontend'ga yuboramiz
    const topPlayers = leaderboard.slice(0, 10);

    res.json(topPlayers);
});
