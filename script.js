const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const robotBtn = document.getElementById('robot-btn');
const clickBtn = document.getElementById('click-btn');

let myUsername = localStorage.getItem('arcade_username') || "";

// Mini o'yin ichki o'zgaruvchilari
let secretNumber = Math.floor(Math.random() * 20) + 1;
let reactTimeout, reactStartTime;
let cryptoPrice = 100;
let myCryptoCount = 0;

window.onload = () => {
    if (myUsername) { 
        showGameScreen(); 
    } else { 
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-game-screen').classList.add('hidden');
    }
};

async function loginPlayer() {
    const inputField = document.getElementById('username-input');
    const input = inputField ? inputField.value.trim() : "";
    
    if (!input) { 
        alert("Iltimos, o'yinchi nikini kiriting!"); 
        return; 
    }
    
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
    
    setInterval(loadFromServer, 1500);
    setInterval(loadLeaderboard, 3000);
    setInterval(autoCollectCoins, 1000);
    setInterval(updateCryptoPrice, 3000); // Kripto narxini o'zgartirib turish
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
    if (document.getElementById('auto-power')) document.getElementById('auto-power').textContent = state.autoPower;
    
    if (upgradeBtn) {
        upgradeBtn.textContent = `Kuchaytirish (${state.upgradeCost})`;
        upgradeBtn.disabled = state.score < state.upgradeCost;
    }

    if (robotBtn) {
        robotBtn.textContent = `🤖 Avto Robot (${state.autoclickCost})`;
        robotBtn.disabled = state.score < state.autoclickCost;
    }

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

if (robotBtn) {
    robotBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/buy-robot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: myUsername })
            });
            const data = await response.json();
            if (data.success) { updateUI(data.state); }
        } catch (e) { console.error(e); }
    });
}

async function autoCollectCoins() {
    if (!myUsername) return;
    try {
        const response = await fetch('/api/auto-collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername })
        });
        const data = await response.json();
        if (data.success && scoreDisplay) {
            scoreDisplay.textContent = data.score;
        }
    } catch (e) { console.error(e); }
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
            updateUI(data.state);
        } else {
            alert(data.message);
        }
    } catch (e) { console.error(e); }
}

// 🕹️ 1-O'YIN: SONNI TOP MANTIQI
async function playGuessGame() {
    const input = parseInt(document.getElementById('guess-input').value);
    const result = document.getElementById('guess-result');
    if (!input) return;

    if (input === secretNumber) {
        result.style.color = '#22c55e';
        result.textContent = "🎉 To'g'ri! Sizga 50 ta tanga mukofot berildi!";
        secretNumber = Math.floor(Math.random() * 20) + 1; // yangi son
        await rewardPlayer(50);
    } else if (input > secretNumber) {
        result.style.color = '#ef4444';
        result.textContent = "Kattaroq son yozdingiz, kichikroq urinib ko'ring.";
    } else {
        result.style.color = '#ef4444';
        result.textContent = "Kichikroq son yozdingiz, kattaroq urinib ko'ring.";
    }
}

// 🕹️ 2-O'YIN: KIM CHAQQON MANTIQI
function clickReactBox() {
    const box = document.getElementById('react-box');
    const result = document.getElementById('react-result');

    if (box.textContent === "Boshlash uchun bosing" || box.textContent.includes("Yana")) {
        box.style.background = "#ef4444";
        box.textContent = "Kuting...";
        result.textContent = "";
        
        const randomDelay = Math.random() * 3000 + 2000; // 2-5 soniya kutiladi
        reactTimeout = setTimeout(() => {
            box.style.background = "#22c55e";
            box.textContent = "BOSING!!!";
            reactStartTime = Date.now();
        }, randomDelay);
    } else if (box.textContent === "Kuting...") {
        clearTimeout(reactTimeout);
        box.style.background = "#ef4444";
        box.textContent = "Ertaroq bosdingiz! Qayta boshlang.";
    } else if (box.textContent === "BOSING!!!") {
        const reactTime = Date.now() - reactStartTime;
        box.style.background = "#3b82f6";
        box.textContent = "Yana o'ynash 🔄";
        
        if (reactTime < 400) {
            result.style.color = '#22c55e';
            result.textContent = `Super chaqqon! Tezlik: ${reactTime}ms. +40 tanga!`;
            rewardPlayer(40);
        } else {
            result.style.color = '#eab308';
            result.textContent = `Yomon emas. Tezlik: ${reactTime}ms. Urinib ko'ring.`;
        }
    }
}

// 🕹️ 3-O'YIN: OMAD G'ILDIRAGI MANTIQI
async function spinWheel() {
    const score = parseInt(scoreDisplay.textContent);
    const result = document.getElementById('wheel-result');
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');

    if (score < 20) { alert("Aylantirish uchun 20 tanga kerak!"); return; }
    
    spinBtn.disabled = true;
    await rewardPlayer(-20); // 20 tanga yechiladi

    // Tasodifiy aylanish effekti
    let randomDeg = Math.floor(Math.random() * 1800) + 720;
    wheel.style.transform = `rotate(${randomDeg}deg)`;

    setTimeout(async () => {
        spinBtn.disabled = false;
        const rewards = [0, 10, 30, 50, 100];
        const win = rewards[Math.floor(Math.random() * rewards.length)];
        
        if (win > 0) {
            result.style.color = '#22c55e';
            result.textContent = `🎉 Tabriklaymiz! Siz ${win} tanga yutib oldingiz!`;
            await rewardPlayer(win);
        } else {
            result.style.color = '#ef4444';
            result.textContent = "Bu safar omad kelmadi, yana urinib ko'ring!";
        }
    }, 2000);
}

// 🕹️ 4-O'YIN: KRIPTO BIRJA MANTIQI
function updateCryptoPrice() {
    let change = Math.floor(Math.random() * 40) - 20; // -20 dan +20 gacha o'zgaradi
    cryptoPrice += change;
    if (cryptoPrice < 10) cryptoPrice = 10; // eng pastki narx
    
    const priceTxt = document.getElementById('crypto-price');
    if (priceTxt) priceTxt.textContent = cryptoPrice;
}

async function buyCrypto() {
    const score = parseInt(scoreDisplay.textContent);
    if (score >= cryptoPrice) {
        await rewardPlayer(-cryptoPrice);
        myCryptoCount++;
        document.getElementById('my-crypto').textContent = myCryptoCount;
    } else {
        alert("Tanganiz yetarli emas!");
    }
}

async function sellCrypto() {
    if (myCryptoCount > 0) {
        myCryptoCount--;
        document.getElementById('my-crypto').textContent = myCryptoCount;
        await rewardPlayer(cryptoPrice);
    } else {
        alert("Sizda sotish uchun kripto yo'q!");
    }
}

// O'yinchiga balans qo'shish yoki ayirish uchun yordamchi API mantiq
async function rewardPlayer(amount) {
    if (!myUsername) return;
    try {
        await fetch('/api/unlock-game', { // sotib olish API orqali qiymatni o'zgartiramiz
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: myUsername, gameId: 'dummy', cost: -amount })
        });
        await loadFromServer();
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
