const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');

let myUsername = localStorage.getItem('arcade_username') || "";

// Sahifa yuklanganda ekranlar holatini tekshirish
window.onload = () => {
    if (myUsername) { 
        showGameScreen(); 
    } else { 
        // Agar nik yo'q bo'lsa, kirish ekranini ko'rsatish, o'yinni yashirish
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-game-screen').classList.add('hidden');
    }
};

// Kirish tugmasi bosilganda ishlaydigan funksiya
async function loginPlayer() {
    const inputField = document.getElementById('username-input');
    const input = inputField ? inputField.value.trim() : "";
    
    if (!input) { 
        alert("Iltimos, nik yozing!"); 
        return; 
    }
    
    myUsername = input;
    localStorage.setItem('arcade_username', myUsername);
    showGameScreen();
}

async function showGameScreen() {
    // Ekranlarni almashtirish
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-game-screen').classList.remove('hidden');
    document.getElementById('display-username').textContent = myUsername;

    await loadFromServer();
    await loadLeaderboard();
    
    // Serverdan ma'lumotlarni yangilab turish
    setInterval(loadFromServer, 1500);
    setInterval(loadLeaderboard, 3000);
}

async function loadFromServer() {
    if (!myUsername) return;
    try {
        const response = await fetch('/api/get-player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername })
        });
        const data = await response.json();
        updateUI(data);
    } catch (error) { console.error("Xato:", error); }
}

function updateUI(state) {
    if (scoreDisplay) scoreDisplay.textContent = state.score;
    if (document.getElementById('click-power')) document.getElementById('click-power').textContent = state.clickPower;
    if (upgradeBtn) {
        upgradeBtn.textContent = `Kuchaytirish (${state.upgradeCost})`;
        upgradeBtn.disabled = state.score < state.upgradeCost;
    }

    // Mini o'yinlar holati
    checkAndToggleLock('guess', state.gamesUnlocked.guess);
    checkAndToggleLock('react', state.gamesUnlocked.react);
    checkAndToggleLock('wheel', state.gamesUnlocked.wheel);
    checkAndToggleLock('crypto', state.gamesUnlocked.crypto);
}

function checkAndToggleLock(gameId, isUnlocked) {
    const lockScreen = document.getElementById(`${gameId}-lock-screen`);
    const playScreen = document.getElementById(`${gameId}-play-screen`);
    const navBtn = document.getElementById(`nav-${gameId}`);

    if (isUnlocked) {
        if (lockScreen) lockScreen.classList.add('hidden');
        if (playScreen) playScreen.classList.remove('hidden');
        if (navBtn) navBtn.innerHTML = navBtn.innerHTML.replace('🔒', '🎮');
    }
}

if (clickBtn) {
    clickBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: myUsername })
            });
            const data = await response.json();
            if (data.success) { if (scoreDisplay) scoreDisplay.textContent = data.score; }
        } catch (e) { console.error(e); }
    });
}

if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: myUsername })
            });
            const data = await response.json();
            if (data.success) { updateUI(data.state); }
        } catch (e) { console.error(e); }
    });
}

async function unlockGame(gameId, cost) {
    try {
        const response = await fetch('/api/unlock-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, gameId: gameId, cost: cost })
        });
        const data = await response.json();
        if (data.success) {
            alert("O'yin muvaffaqiyatli ochildi! 🎉");
            updateUI(data.state);
        } else {
            alert(data.message);
        }
    } catch (e) { console.error(e); }
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
                if (player.name === myUsername) row.classList.add('current-user-row');
                row.innerHTML = `<td>${index + 1}</td><td>${player.name}</td><td>${player.score}</td>`;
                tbody.appendChild(row);
            });
        }
    } catch (e) { console.error(e); }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    const activeBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
}
