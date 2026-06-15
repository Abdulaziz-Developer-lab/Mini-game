const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

async function loadFromServer() {
    try {
        const response = await fetch('/api/game-state');
        const data = await response.json();
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
        const response = await fetch('/api/click', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            scoreDisplay.textContent = data.score;
            loadFromServer(); 
        }
    });
}

if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
        const response = await fetch('/api/upgrade', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            updateUI(data.state);
        }
    });
}

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
    } catch (e) {}
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