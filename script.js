const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

// Ichki yashirin va xavfsiz o'zgaruvchi
let _secureScore = 0;

// Telegram Web App muhitini tayyorlash
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand(); 
}

// O'sha "aqlli" uchun maxsus TUZOQ (Anti-Cheat) 🕵️‍♂️
// Agar u konsoldan 'currentScore = 10000' deb yozsa, srazu ushlanadi!
Object.defineProperty(window, 'currentScore', {
    get: function() { return _secureScore; },
    set: function(val) {
        _secureScore = 0; 
        alert("Aldash yo'q! 🛑 Tangalaringiz kuydi! 😂");
        if (scoreDisplay) scoreDisplay.textContent = 0;
    }
});

async function loadFromServer() {
    try {
        const response = await fetch('/game-state');
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
}

if (clickBtn) {
    clickBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/click', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                if (scoreDisplay) scoreDisplay.textContent = data.score;
                _secureScore = data.score;
                loadFromServer(); 
            }
        } catch (e) { console.error(e); }
    });
}

if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/upgrade', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                updateUI(data.state);
                _secureScore = data.state.score;
            }
        } catch (e) { console.error(e); }
    });
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
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

setInterval(loadFromServer, 2000); 
setInterval(loadLeaderboard, 5000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };

function switchTab(tabId) {
    // Agar o'yin ochilmagan bo'lsa, tabni o'zgartirishni taqiqlaymiz
    if (tabId !== 'clicker-tab' && tabId !== 'leaderboard-tab') {
        const shortName = tabId.replace('-tab', '');
        const lockScreen = document.getElementById(`${shortName}-lock-screen`);
        if (lockScreen && !lockScreen.classList.contains('hidden')) {
            alert("Bu o'yin hali qulflangan! Avval tanga evaziga oching. 🔒");
            return;
        }
    }

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
    
    const activeBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function unlockGame(gameId, cost) {
    if (_secureScore < cost) {
        alert(`Sizga kamida ${cost} ta tanga kerak! Balansingiz yetarli emas. 🪙`);
        return;
    }

    _secureScore -= cost; 
    if (scoreDisplay) scoreDisplay.textContent = _secureScore;

    document.getElementById(`${gameId}-lock-screen`).classList.add('hidden');
    document.getElementById(`${gameId}-play-screen`).classList.remove('hidden');

    const navBtn = document.getElementById(`nav-${gameId}`);
    if (navBtn) {
        navBtn.innerHTML = navBtn.innerHTML.replace('🔒', '🎮');
    }

    switchTab(`${gameId}-tab`);
}
