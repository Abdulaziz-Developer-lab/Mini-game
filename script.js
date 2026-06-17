const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

let _secureScore = 0;

// Telegram Web App'ni to'g'ri kengaytirish
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// 🕵️‍♂️ MAQTANCHOQ XAKER UCHUN MAXSUS ANTI-CHEAT (TUZOQ)
// Agar u konsoldan 'currentScore = 10000' deb yozsa, srazu ushlanadi!
Object.defineProperty(window, 'currentScore', {
    get: function() { return _secureScore; },
    set: function(val) {
        _secureScore = 0;
        alert("Aldash yo'q! 🛑 Tangalaringiz kuydi! 😂");
        if (scoreDisplay) scoreDisplay.textContent = 0;
    }
});

// Serverdan o'yin holatini yuklash
async function loadFromServer() {
    try {
        const response = await fetch('/api/game-state');
        if (!response.ok) throw new Error('Server xatosi');
        const data = await response.json();
        _secureScore = data.score;
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

    // Qulflangan bo'limlarni tekshirish
    toggleGameScreens('guess', state.gamesUnlocked.guess);
    toggleGameScreens('react', state.gamesUnlocked.react);
    toggleGameScreens('wheel', state.gamesUnlocked.wheel);
    toggleGameScreens('crypto', state.gamesUnlocked.crypto);
}

function toggleGameScreens(gameId, isUnlocked) {
    const lockScreen = document.getElementById(`${gameId}-lock-screen`);
    const playScreen = document.getElementById(`${gameId}-play-screen`);
    const navBtn = document.getElementById(`nav-${gameId}`);

    if (isUnlocked) {
        if (lockScreen) lockScreen.classList.add('hidden');
        if (playScreen) playScreen.classList.remove('hidden');
        if (navBtn) navBtn.innerHTML = navBtn.innerHTML.replace('🔒', '🎮');
    } else {
        if (lockScreen) lockScreen.classList.remove('hidden');
        if (playScreen) playScreen.classList.add('hidden');
    }
}

// Click qilish hodisasi
if (clickBtn) {
    clickBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/click', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                _secureScore = data.score;
                if (scoreDisplay) scoreDisplay.textContent = data.score;
            }
        } catch (e) { console.error(e); }
    });
}

// Upgrade sotib olish hodisasi
if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/upgrade', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                _secureScore = data.state.score;
                updateUI(data.state);
            }
        } catch (e) { console.error(e); }
    });
}

// Serverda o'yin qulfini ochish (Tanga yechiladi)
async function unlockGame(gameId, cost) {
    if (_secureScore < cost) {
        alert(`Sizga ${cost} ta tanga kerak! Balansingiz yetarli emas. 🪙`);
        return;
    }
    try {
        const response = await fetch('/api/unlock-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, cost })
        });
        const data = await response.json();
        if (data.success) {
            _secureScore = data.state.score;
            updateUI(data.state);
            alert("O'yin muvaffaqiyatli ochildi! 🎉");
        }
    } catch (e) { console.error(e); }
}

// Bo'limlarni almashtirish (Tab switch)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
    
    const activeBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// Leaderboardni yuklash
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
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

// Taymerlar (Har soniyada holatni yangilab turish)
setInterval(loadFromServer, 1500);
setInterval(loadLeaderboard, 4000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };
