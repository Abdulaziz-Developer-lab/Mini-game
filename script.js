const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const robotBtn = document.getElementById('robot-btn');
const clickBtn = document.getElementById('click-btn');

let myUsername = localStorage.getItem('arcade_username') || "";
let secretNum = Math.floor(Math.random() * 20) + 1;
let reactTimer, reactStart;
let currentCryptoPrice = 100;

window.onload = () => {
    if (myUsername) { 
        showGameScreen(); 
    } else { 
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-game-screen').classList.add('hidden');
    }
};

async function loginPlayer() {
    const input = document.getElementById('username-input').value.trim();
    if (!input) { alert("Iltimos, nik kiriting!"); return; }
    
    myUsername = input;
    localStorage.setItem('arcade_username', myUsername);
    showGameScreen();
}

async function showGameScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-game-screen').classList.remove('hidden');
    document.getElementById('display-username').textContent = myUsername;

    await loadFromServer();
    await loadLeaderboard();
    
    setInterval(loadFromServer, 1000);
    setInterval(loadLeaderboard, 3000);
    setInterval(triggerAutoCollect, 1000);
    setInterval(randomizeCrypto, 3000); 
}

async function loadFromServer() {
    if (!myUsername) return;
    try {
        const res = await fetch('/api/get-player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername })
        });
        const data = await res.json();
        updateUI(data);
    } catch (e) { console.error(e); }
}

function updateUI(state) {
    if (scoreDisplay) scoreDisplay.textContent = state.score;
    if (document.getElementById('click-power')) document.getElementById('click-power').textContent = state.clickPower;
    if (document.getElementById('auto-power')) document.getElementById('auto-power').textContent = state.autoPower;
    if (document.getElementById('my-crypto')) document.getElementById('my-crypto').textContent = state.myCryptoCount;
    
    if (upgradeBtn) {
        upgradeBtn.textContent = `Kuchaytirish (${state.upgradeCost})`;
        upgradeBtn.disabled = state.score < state.upgradeCost;
    }
    if (robotBtn) {
        robotBtn.textContent = `🤖 Avto Robot (${state.autoclickCost})`;
        robotBtn.disabled = state.score < state.autoclickCost;
    }

    toggleLockState('guess', state.gamesUnlocked.guess);
    toggleLockState('react', state.gamesUnlocked.react);
    toggleLockState('wheel', state.gamesUnlocked.wheel);
    toggleLockState('crypto', state.gamesUnlocked.crypto);
}

function toggleLockState(gameId, isUnlocked) {
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

if (clickBtn) {
    clickBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: myUsername })
            });
            const data = await res.json();
            if (data.success) scoreDisplay.textContent = data.score;
        } catch (e) { console.error(e); }
    });
}

if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: myUsername })
            });
            const data = await res.json();
            if (data.success) updateUI(data.state);
        } catch (e) { console.error(e); }
    });
}

if (robotBtn) {
    robotBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/buy-robot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: myUsername })
            });
            const data = await res.json();
            if (data.success) updateUI(data.state);
        } catch (e) { console.error(e); }
    });
}

async function triggerAutoCollect() {
    if (!myUsername) return;
    try {
        const res = await fetch('/api/auto-collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername })
        });
        const data = await res.json();
        if (data.success) scoreDisplay.textContent = data.score;
    } catch (e) { console.error(e); }
}

async function unlockGame(gameId, cost) {
    try {
        const res = await fetch('/api/unlock-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, gameId: gameId, cost: cost })
        });
        const data = await res.json();
        if (data.success) updateUI(data.state);
        else alert(data.message);
    } catch (e) { console.error(e); }
}

async function playGuessGame() {
    const val = parseInt(document.getElementById('guess-input').value);
    const resTxt = document.getElementById('guess-result');
    if (isNaN(val)) return;

    if (val === secretNum) {
        resTxt.style.color = "#22c55e";
        resTxt.textContent = "🎉 To'g'ri! Mukofot: +40 tanga!";
        secretNum = Math.floor(Math.random() * 20) + 1;
        await sendReward(40);
    } else {
        resTxt.style.color = "#ef4444";
        resTxt.textContent = val > secretNum ? "Kichikroq son o'ylang 👇" : "Kattaroq son o'ylang 👆";
    }
}

function clickReactBox() {
    const box = document.getElementById('react-box');
    const resTxt = document.getElementById('react-result');

    if (box.textContent === "Boshlash uchun bosing" || box.textContent.includes("Qayta")) {
        box.style.background = "#ef4444";
        box.textContent = "Kuting...";
        resTxt.textContent = "";
        
        reactTimer = setTimeout(() => {
            box.style.background = "#22c55e";
            box.textContent = "BOSING!!!";
            reactStart = Date.now();
        }, Math.random() * 2500 + 1500);
    } else if (box.textContent === "Kuting...") {
        clearTimeout(reactTimer);
        box.style.background = "#ef4444";
        box.textContent = "Ertaroq bosdingiz! Qayta urinish 🔄";
    } else if (box.textContent === "BOSING!!!") {
        const duration = Date.now() - reactStart;
        box.style.background = "#3b82f6";
        box.textContent = "Qayta boshlash 🔄";
        if (duration < 380) {
            resTxt.style.color = "#22c55e";
            resTxt.textContent = `⚡ Chaqqon! Tezlik: ${duration}ms. Mukofot: +50 tanga!`;
            sendReward(50);
        } else {
            resTxt.style.color = "#eab308";
            resTxt.textContent = `Tezlik: ${duration}ms. Yana harakat qiling.`;
        }
    }
}

async function spinWheel() {
    const btn = document.getElementById('spin-btn');
    const wheel = document.getElementById('wheel-element');
    const resTxt = document.getElementById('wheel-result');
    const score = parseInt(scoreDisplay.textContent);

    if (score < 30) { alert("Mablag' yetarli emas!"); return; }
    btn.disabled = true;
    await sendReward(-30);

    let randomRotation = Math.floor(Math.random() * 1440) + 1080;
    wheel.style.transform = `rotate(${randomRotation}deg)`;

    setTimeout(async () => {
        btn.disabled = false;
        const prizes = [10, 0, 60, 100, 0, 200];
        const win = prizes[Math.floor(Math.random() * prizes.length)];
        if (win > 0) {
            resTxt.style.color = "#22c55e";
            resTxt.textContent = `🎉 Omad keldi! +${win} tanga yutdingiz!`;
            await sendReward(win);
        } else {
            resTxt.style.color = "#ef4444";
            resTxt.textContent = "Afsus, bu safar bo'sh keldi. Yana bir bor?";
        }
    }, 2000);
}

function randomizeCrypto() {
    let delta = Math.floor(Math.random() * 50) - 25;
    currentCryptoPrice += delta;
    if (currentCryptoPrice < 15) currentCryptoPrice = 15;
    
    const priceEl = document.getElementById('crypto-price');
    if (priceEl) priceEl.textContent = currentCryptoPrice;
}

async function tradeCrypto(action) {
    try {
        const res = await fetch('/api/crypto-trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, action: action, price: currentCryptoPrice })
        });
        const data = await res.json();
        if (data.success) updateUI(data.state);
        else alert(data.message || "Xatolik yuz berdi!");
    } catch (e) { console.error(e); }
}

async function sendReward(amount) {
    try {
        const res = await fetch('/api/reward-player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, amount: amount })
        });
        const data = await res.json();
        if (data.success) scoreDisplay.textContent = data.score;
    } catch (e) { console.error(e); }
}

async function loadLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const list = await res.json();
        const tbody = document.getElementById('leaderboard-body');
        if (tbody) {
            tbody.innerHTML = '';
            list.forEach((player, i) => {
                const row = document.createElement('tr');
                if (player.name === myUsername) row.classList.add('current-user-row');
                row.innerHTML = `<td>${i + 1}</td><td>${player.name}</td><td>${player.score}</td>`;
                tbody.appendChild(row);
            });
        }
    } catch (e) { console.error(e); }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    const targetBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (targetBtn) targetBtn.classList.add('active');
}
