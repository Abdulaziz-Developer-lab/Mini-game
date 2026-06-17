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
  max: 5000, // Foydalanuvchilar bloklanib qolmasligi uchun 5000 ta so'rov
  message: "Juda ko'p so'rov yuborildi, iltimos biroz kuting."
});
app.use(limiter);

// JSON va URL-encoded ma'lumotlarni qabul qilish
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik fayllarni ulash (index.html, style.css, script.js)
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

// 2. Onlayn peshqadamlar ro'yxati
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = Object.keys(playersDatabase).map(username => {
        return {
            name: username,
            score: playersDatabase[username].score
        };
    });
    leaderboard.sort((a, b) => b.score - a.score);
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

// 5. Avto Robot sotib olish (Robot)
app.post('/api/buy-robot', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    const player = playersDatabase[username];
    if (player.score >= player.autoclickCost) {
        player.score -= player.autoclickCost;
        player.autoPower += 1;
        player.autoclickCost = Math.floor(player.autoclickCost * 1.7);
        res.json({ success: true, state: player });
    } else {
        res.status(400).json({ success: false, message: "Mablag' yetarli emas!" });
    }
});

// 6. Avto Robot tangalarini yig'ib olish
app.post('/api/auto-collect', (req, res) => {
    const { username } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    const player = playersDatabase[username];
    player.score += player.autoPower; // Har soniyada robot kuchi miqdorida tanga qo'shiladi
    res.json({ success: true, score: player.score });
});


// --- MINI O'YINLAR LOGIKASI (SIZ SO'RAGAN QISM) ---

// 7. Mini o'yinni sotib olib ochish (Unlock Game)
app.post('/api/unlock-game', (req, res) => {
    const { username, gameId, cost } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    const player = playersDatabase[username];
    if (player.score >= cost) {
        player.score -= cost;
        player.gamesUnlocked[gameId] = true; // O'yin ochildi
        res.json({ success: true, state: player });
    } else {
        res.json({ success: false, message: "Tanganingiz yetarli emas! Koproq tanga bosing." });
    }
});

// 8. O'yinlarda yutgan mukofotni hisobga qo'shish (Guess, React, Wheel o'yinlari uchun)
app.post('/api/reward-player', (req, res) => {
    const { username, amount } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    const player = playersDatabase[username];
    player.score += amount; // Mukofot qo'shiladi yoki g'ildirakda yutqazsa minus bo'ladi
    
    // Hisob 0 dan pastga tushib ketmasligi uchun
    if (player.score < 0) player.score = 0; 
    
    res.json({ success: true, score: player.score });
});

// 9. Kriptovalyuta savdosi (Sotib olish / Sotish)
app.post('/api/crypto-trade', (req, res) => {
    const { username, action, price } = req.body;
    if (!username || !playersDatabase[username]) return res.status(400).json({ error: "O'yinchi topilmadi!" });

    const player = playersDatabase[username];

    if (action === 'buy') {
        if (player.score >= price) {
            player.score -= price;
            player.myCryptoCount += 1;
            res.json({ success: true, state: player });
        } else {
            res.json({ success: false, message: "Kripto sotib olishga tangangiz yetarli emas!" });
        }
    } else if (action === 'sell') {
        if (player.myCryptoCount > 0) {
            player.myCryptoCount -= 1;
            player.score += price;
            res.json({ success: true, state: player });
        } else {
            res.json({ success: false, message: "Sotish uchun sizda kriptovalyuta yo'q!" });
        }
    }
});


// Asosiy sahifani ochish
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});
