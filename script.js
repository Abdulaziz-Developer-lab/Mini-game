const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

let currentScore = 0;

async function loadFromServer() {
    try {
        const response = await fetch('/api/game-state'); // server.js ga moslab to'g'rilandi
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
            const response = await fetch('/api/click', { method: 'POST' }); // server.js ga moslandi
            const data = await response.json();
            if (data.success) {
                currentScore = data.score;
                if (scoreDisplay) scoreDisplay.textContent = data.score;
            }
        } catch (e) { console.error(e); }
    });
}

if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/upgrade', { method: 'POST' }); // server.js ga moslandi
            const data = await response.json();
            if (data.success) {
                currentScore = data.state.score;
                updateUI(data.state);
            }
        } catch (e) { console.error(e); }
    });
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard'); // server.js ga moslandi
        if (!response.ok) throw new Error('Leaderboard xatosi');
        const players = await response.json();
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = '';
            players.forEach((player, index) => {
                const row = document.createElement('tr');
                if(player.name.includes("Siz")) row.classList.add('current-user-row');
                row.innerHTML = `<td>${index + 1}</td><td>${player.name}</td><td>${player.score}</td>`;
                tbody.appendChild(row);
            });
        }
    } catch (e) { console.error(e); }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
    
    const activeBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function unlockGame(gameId) {
    if (gameId.includes('guess')) {
        switchTab('guess-tab');
    } else if (gameId.includes('react')) {
        switchTab('react-tab');
    } else if (gameId.includes('wheel')) {
        switchTab('wheel-tab');
    } else if (gameId.includes('crypto')) {
        switchTab('crypto-tab');
    }
}

setInterval(loadFromServer, 1000);
setInterval(loadLeaderboard, 3000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };
