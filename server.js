const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// --- HIMOYANI QO'SHISH ---
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 100 // har bir IP dan 100 ta so'rov
});
app.use(limiter);

// JSON va URL-encoded ma'lumotlarni qabul qilish (bular juda muhim!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SIZNING FUNKSIYALARINGIZ ---

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
    
    // Qolgan kodingiz shu yerda bo'ladi...
    res.json({ success: true });
});

// --- SERVERNI ISHGA TUSHIRISH (RENDER UCHUN) ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});
