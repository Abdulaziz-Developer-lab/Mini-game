const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

let currentScore = 0;

// Serverdan ma'lumotlarni yuklash va UI ni yangilash
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
    
    // O'yinlar ochilgan bo'lsa, qulfni ochib haqiqiy o'yinni ko'rsatish
    Object.keys(state.gamesUnlocked).forEach(game => {
        if (state.gamesUnlocked[game]) {
            const lockScreen = document.getElementById(`${game}-lock-screen`);
            const playScreen = document.getElementById(`${game}-play-screen`);
            
            if (lockScreen) lockScreen.classList.add('hidden'); // Qulf oynasini yopish
            if (playScreen) playScreen.classList.remove('hidden'); // Haqiqiy o'yinni ochish
        }
    });
}

// Clicker tugmasi bosilganda
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

// Kuchaytirish (Upgrade) tugmasi bosilganda
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

// HTML dagi sariq tugma (unlockGame) bosilganda ishlaydigan funksiya
async function unlockGame(gameId, cost) {
    if (currentScore < cost) {
        alert(`Sariq tugmani bosish uchun sizga ${cost} ta tanga kerak! Hozir sizda: ${currentScore} ta bor.`);
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
            alert("Tabriklaymiz! O'yin muvaffaqiyatli ochildi.");
        }
    } catch (e) { console.error(e); }
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

// Tablarni (Menularni) almashtirish funksiyasi
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
    
    // Bosilgan menyu tugmasini aktiv qilish
    const clickedBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');
}

setInterval(loadFromServer, 1000);
setInterval(loadLeaderboard, 3000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };
