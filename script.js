const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

let currentScore = 0;

async function loadFromServer() {
    try {
        const response = await fetch('/game-state');
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
}

if (clickBtn) {
    clickBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/click', { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                if (scoreDisplay) scoreDisplay.textContent = data.score;
                currentScore = data.score;
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
                currentScore = data.state.score;
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

setInterval(loadFromServer, 1000);
setInterval(loadLeaderboard, 3000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
}

// UNIVERSAL FUNKSIYA: Tugma 'unlockGame' yoki 'switchTab' deb chaqirilganda ham ishlayveradi
function unlockGame(gameId) {
    if (!gameId) return;
    
    // Agar to'g'ridan-to'g'ri ID kelgan bo'lsa (masalan: 'guess-tab')
    if (gameId.set || gameId.includes('-tab')) {
        switchTab(gameId);
    } 
    // Agar qisqa nom kelgan bo'lsa (masalan: 'guess')
    else {
        switchTab(gameId + '-tab');
    }
}
