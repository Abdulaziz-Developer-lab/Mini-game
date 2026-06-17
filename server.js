const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// --- MA'LUMOTLAR BAZASI (Vaqtinchalik xotira) ---
const playersDatabase = {};

// --- HIMOYANI QO'SHISH (Middleware) ---
app.use(helmet({ contentSecurityPolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 5000, // Limitni 100 tadan 5000 taga ko'paytirdik!
  message: "Juda ko'p so'rov yuborildi, iltimos biroz kuting."
});
app.use(limiter);

// JSON va URL-encoded ma'lumotlarni qabul qilish
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik fayllarni ulash (index.html, style.css, script.js larni o'qishi uchun)
app.use(express.static(__dirname));


// --- API FUNKSIYALARI ---

// 1. O'yinchi ma'lumotlarini olish yoki yaratish
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

// 2. ONLAYN PESHQADAMLAR RO'YXATINI OLISH
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = Object.keys(playersDatabase).map(username => {
        return {
            name: username, // script.js dagi player.name ga moslashtirildi
            score: playersDatabase[username].score
        };
    });

    // Tangasi eng ko'pdan kamiga qarab tartiblash
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Eng kuchli 10 ta o'yinchini frontend'ga berish
    const topPlayers = leaderboard.slice(0, 10);
    res.json(topPlayers);
});

// 3. Tanga bosish (Click)
app.post('/api/click', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    playersDatabase[username].score += playersDatabase[username].clickPower;
    res.json({ success: true, score: playersDatabase[username].score });
});

// 4. Kuchaytirish (Upgrade)
app.post('/api/upgrade', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });
    
    const player = playersDatabase[username];
    if (player.score >= player.upgradeCost) {
        player.score -= player.upgradeCost;
        player.clickPower += 1;
        player.upgradeCost = Math.floor(player.upgradeCost * 1.5);
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Mablag' yetarli emas!" });
    }
});

// Asosiy sahifani ochish (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// --- SERVERNI ISHGA TUSHIRISH (RENDER UCHUN) ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});
