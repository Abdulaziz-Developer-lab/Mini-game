const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

let currentScore = 0;
let reactTimer = null;
let reactStartTime = 0;

// Serverdan ma'lumotlarni yuklash
async function loadFromServer() {
    try {
        const response = await fetch('/api/game-state');
        if (!response.ok) throw new Error('Server xatosi');
        const data = await response.json();
        currentScore = data.score;
        updateUI(data);
    } catch (error) {
        console.error("Xato:", error);
    }
}

function updateUI(state) {
    if (scoreDisplay) scoreDisplay.textContent = state.score;
    if (document.getElementById('click-power')) document.getElementById('click-power').textContent = state.clickPower;
    if (upgradeBtn) {
        upgradeBtn.textContent = `Kuchaytirish (${state.upgradeCost})`;
        upgradeBtn.disabled = state.score < state.upgradeCost;
    }
    
    // Qulflarni tekshirish va ochish
    Object.keys(state.gamesUnlocked).forEach(game => {
        if (state.gamesUnlocked[game]) {
            const lockScreen = document.getElementById(`${game}-lock-screen`);
            const playScreen = document.getElementById(`${game}-play-screen`);
            
            if (lockScreen) lockScreen.classList.add('hidden');
            if (playScreen) playScreen.classList.remove('hidden');
        }
    });
}

// Clicker mexanikasi
if (clickBtn) {
    clickBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/click', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                if (scoreDisplay) scoreDisplay.textContent = data.score;
                currentScore = data.score;
                loadFromServer(); 
            }
        } catch (e) { console.error(e); }
    });
}

// Kuchaytirish mexanikasi
if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/upgrade', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                updateUI(data.state);
                currentScore = data.state.score;
            }
        } catch (e) { console.error(e); }
    });
}

// O'yin qulfini ochish
async function unlockGame(gameId, cost) {
    if (currentScore < cost) {
        alert(`Sizga ${cost} ta tanga kerak! Hozir sizda: ${currentScore} ta bor.`);
        return;
    }
    try {
        const response = await fetch('/api/unlock-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: gameId })
        });
        const data = await response.json();
        if (data.success) {
            updateUI(data.state);
            alert("O'yin ochildi! Endi o'ynashingiz mumkin.");
            if(gameId === 'react') initReactGame(); // Kim chaqqon o'yinini tayyorlash
        }
    } catch (e) { console.error(e); }
}

// ==========================================
// 1. KIM CHAQQON? (SEKUNDOMER / REACT GAME)
// ==========================================
const reactBox = document.getElementById('react-box');
const reactResult = document.getElementById('react-result');

function initReactGame() {
    if (!reactBox) return;
    reactBox.style.background = '#ef4444';
    reactBox.textContent = 'Kuting...';
    reactResult.textContent = '';
    
    const randomDelay = Math.random() * 3000 + 2000; // 2-5 soniya kutish
    
    reactTimer = setTimeout(() => {
        reactBox.style.background = '#22c55e'; // Yashil rang
        reactBox.textContent = 'BOSING!!!';
        reactStartTime = Date.now(); // Sekundomer boshlandi
    }, randomDelay);
}

if (reactBox) {
    reactBox.addEventListener('click', async () => {
        if (reactBox.style.background === 'rgb(239, 68, 68)') { // Qizil holatda bossa
            clearTimeout(reactTimer);
            reactResult.textContent = 'Erta bosdingiz! Qaytadan urining.';
            initReactGame();
        } else if (reactBox.style.background === 'rgb(34, 197, 94)') { // Yashil holatda bossa
            const endTime = Date.now();
            const reactionTime = (endTime - reactStartTime) / 1000; // Sekundni hisoblash
            reactResult.textContent = `Sizning vaqtingiz: ${reactionTime} soniya!`;
            reactBox.style.background = '#3b82f6';
            reactBox.textContent = 'Yana o\'ynash';
            
            // Mukofot berish (Masalan: 50 tanga)
            try {
                // Serverga yutuqni yuborish qismi (ixtiyoriy, hozircha lokal qo'shamiz)
                currentScore += 50;
                if (scoreDisplay) scoreDisplay.textContent = currentScore;
            } catch(e) {}
        } else {
            initReactGame();
        }
    });
}

// ==========================================
// 2. SONNI TOP O'YINI
// ==========================================
let randomNumber = Math.floor(Math.random() * 50) + 1;
function checkGuess() {
    const input = document.getElementById('guess-input');
    const msg = document.getElementById('guess-message');
    if(!input || !msg) return;
    
    const userGuess = parseInt(input.value);
    if (userGuess === randomNumber) {
        msg.textContent = "Tabriklaymiz! To'g'ri topdingiz va 30 tanga yutdingiz!";
        currentScore += 30;
        if (scoreDisplay) scoreDisplay.textContent = currentScore;
        randomNumber = Math.floor(Math.random() * 50) + 1; // Yangi son
    } else if (userGuess > randomNumber) {
        msg.textContent = "Kattaroq son yozdingiz, kichikroq o'ylang.";
    } else {
        msg.textContent = "Kichikroq son yozdingiz, kattaroq o'ylang.";
    }
}

// Leaderboardni yuklash
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Leaderboard topilmadi');
        const players = await response.json();
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = '';
            players.forEach((player, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${index + 1}</td><td>${player.name}</td><td>${player.score} 🪙</td>`;
                tbody.appendChild(row);
            });
        }
    } catch (e) { console.error(e); }
}

// Menularni almashtirish
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
    
    if (tabId === 'react-tab') {
        initReactGame(); // Tabga o'tganda o'yinni srazu start qilish
    }
}

setInterval(loadFromServer, 1000);
setInterval(loadLeaderboard, 3000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };
