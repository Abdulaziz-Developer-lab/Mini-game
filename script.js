const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

let currentScore = 0;
let gamesUnlocked = { guess: false, react: false, wheel: false, crypto: false };

async function loadFromServer() {
    try {
        const response = await fetch('/api/game-state');
        if (!response.ok) throw new Error('Server xatosi');
        const data = await response.json();
        currentScore = data.score;
        gamesUnlocked = data.gamesUnlocked;
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
    
    // Qaysi o'yin ochilgan bo'lsa, qulf ekranini yashirish logikasi
    Object.keys(state.gamesUnlocked).forEach(game => {
        if (state.gamesUnlocked[game]) {
            const lockScreen = document.getElementById(`${game}-lock`);
            if (lockScreen) lockScreen.style.display = 'none'; // qulf oynasini berkitadi
            const gameScreen = document.getElementById(`${game}-actual-game`);
            if (gameScreen) gameScreen.style.display = 'block'; // haqiqiy o'yinni ko'rsatadi
        }
    });
}

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

// O'yin sotib olish sariq tugmasi bosilganda ishlaydi
async function buyGame(gameId) {
    if (currentScore < 100) {
        alert("Sariq tugmani bosish uchun kamida 100 ta tanganiz bo'lishi kerak!");
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
            alert("Tabriklaymiz! O'yin ochildi.");
        }
    } catch (e) { console.error(e); }
}

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

setInterval(loadFromServer, 1000);
setInterval(loadLeaderboard, 3000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
}

function unlockGame(gameId) {
    if (!gameId) return;
    
    let cleanId = gameId.replace('-tab', '');
    switchTab(cleanId + '-tab');
}
