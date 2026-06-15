const scoreDisplay = document.getElementById('score');
const upgradeBtn = document.getElementById('upgrade-btn');
const clickBtn = document.getElementById('click-btn');
const autoclickBtn = document.getElementById('autoclick-btn');

if (!localStorage.getItem('game_user_id')) {
    localStorage.setItem('game_user_id', 'user_' + Math.random().toString(36).substr(2, 9));
}
const myUserId = localStorage.getItem('game_user_id');

let currentScore = 0;

// CHUNUK ALERT O'RNIGA NEON POPUP
function showCustomAlert(title, message) {
    const alertModal = document.getElementById('alert-modal');
    if (alertModal) {
        document.getElementById('alert-title').textContent = title;
        document.getElementById('alert-message').textContent = message;
        alertModal.style.display = 'flex';
    }
}

// ALERT POPUPNI YOPISH
const modalAlertBtn = document.getElementById('modal-alert-btn');
if (modalAlertBtn) {
    modalAlertBtn.onclick = () => {
        const alertModal = document.getElementById('alert-modal');
        if (alertModal) alertModal.style.display = 'none';
    };
}

// NIKNI MODAL OYNA ORQALI MAJBURIY SO'RASH
async function checkPlayerName(state) {
    let currentLocalName = localStorage.getItem('game_username');
    
    // Agar ism yo'q bo'lsa yoki "Mehmon" bo'lsa, popup ochiladi
    if (!currentLocalName || currentLocalName === 'Mehmon' || currentLocalName.trim() === '') {
        const nameModal = document.getElementById('name-modal');
        if (nameModal) {
            nameModal.style.display = 'flex'; 
            
            document.getElementById('modal-name-btn').onclick = async () => {
                const input = document.getElementById('modal-name-input');
                let name = input ? input.value.trim() : "";
                
                if (!name || name === 'Mehmon') {
                    name = "O'yinchi_" + Math.floor(Math.random() * 900 + 100);
                }
                
                localStorage.setItem('game_username', name);
                nameModal.style.display = 'none'; 
                
                try {
                    await fetch('/api/set-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: myUserId, name: name })
                    });
                    loadLeaderboard();
                } catch (e) { console.error(e); }
            };
        }
    }
}

// SERVERDAN MA'LUMOT YUKLASH VA REFRESHNI TO'G'RILASH
async function loadFromServer() {
    try {
        const response = await fetch('/api/game-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: myUserId })
        });
        const data = await response.json();
        currentScore = data.score;
        updateUI(data);
        
        // Agar serverda hali ham Mehmon bo'lsa, uni localda ushlab turmaymiz
        if (data.username && data.username !== 'Mehmon') {
            localStorage.setItem('game_username', data.username);
        } else {
            localStorage.removeItem('game_username'); // Modal qayta ochilishi uchun
        }
        
        checkPlayerName(data);
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

    if (autoclickBtn) {
        autoclickBtn.textContent = `Avto-Robot (${state.autoclickCost})`;
        autoclickBtn.disabled = state.score < state.autoclickCost;
    }
    
    Object.keys(state.gamesUnlocked).forEach(game => {
        const lockScreen = document.getElementById(`${game}-lock-screen`);
        const playScreen = document.getElementById(`${game}-play-screen`);
        const navBtn = document.getElementById(`nav-${game}`);

        if (state.gamesUnlocked[game]) {
            if (lockScreen) lockScreen.style.display = 'none'; 
            if (playScreen) {
                playScreen.style.display = 'block';
                playScreen.classList.remove('hidden');
            }
            if (navBtn) {
                if (game === 'guess') navBtn.textContent = '🔢 Sonni Top';
                if (game === 'react') navBtn.textContent = '⚡ Kim Chaqqon?';
                if (game === 'wheel') navBtn.textContent = '🎡 Omad G\'ildiragi';
                if (game === 'crypto') navBtn.textContent = '🪙 Kripto Birja';
            }
        } else {
            if (lockScreen) lockScreen.style.display = 'block';
            if (playScreen) playScreen.style.display = 'none';
        }
    });
}

async function giveServerReward(amount) {
    try {
        const response = await fetch('/api/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: myUserId, amount: amount })
        });
        const data = await response.json();
        if (data.success) {
            currentScore = data.score;
            if (scoreDisplay) scoreDisplay.textContent = data.score;
        }
    } catch (e) { console.error(e); }
}

if (clickBtn) {
    clickBtn.onclick = async () => {
        try {
            const response = await fetch('/api/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: myUserId })
            });
            const data = await response.json();
            if (data.success) {
                currentScore = data.score;
                if (scoreDisplay) scoreDisplay.textContent = data.score;
            }
        } catch (e) { console.error(e); }
    };
}

if (upgradeBtn) {
    upgradeBtn.onclick = async () => {
        try {
            const response = await fetch('/api/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: myUserId })
            });
            const data = await response.json();
            if (data.success) {
                updateUI(data.state);
                currentScore = data.state.score;
            }
        } catch (e) { console.error(e); }
    };
}

if (autoclickBtn) {
    autoclickBtn.onclick = async () => {
        try {
            const response = await fetch('/api/autoclick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: myUserId })
            });
            const data = await response.json();
            if (data.success) {
                updateUI(data.state);
                currentScore = data.state.score;
            }
        } catch (e) { console.error(e); }
    };
}

// MINI-O'YINLARNI SOTIB OLISH
window.unlockGame = async function(gameId, cost) {
    if (currentScore < cost) {
        showCustomAlert("⚠️ Mablag' yetarli emas", `Sizga ${cost} ta tanga kerak! Hozir sizda: ${currentScore} ta bor.`);
        return;
    }
    try {
        const response = await fetch('/api/unlock-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: myUserId, gameId: gameId })
        });
        const data = await response.json();
        if (data.success) {
            updateUI(data.state);
            showCustomAlert("🎉 Tabriklaymiz!", "Yangi mini-o'yin muvaffaqiyatli ochildi! Mazza qilib o'ynang.");
            if (gameId === 'react') resetReactGame();
        }
    } catch (e) { console.error(e); }
};

// SONNI TOP MINI-O'YINI
let randomNumber = Math.floor(Math.random() * 50) + 1;
window.checkGuess = function() {
    const input = document.getElementById('guess-input');
    const msg = document.getElementById('guess-message');
    if (!input || !msg) return;
    
    const userGuess = parseInt(input.value);
    if (userGuess === randomNumber) {
        msg.innerHTML = "<span style='color: #22c55e;'>🎉 To'g'ri! +30 tanga!</span>";
        giveServerReward(30); 
        randomNumber = Math.floor(Math.random() * 50) + 1; 
        input.value = '';
    } else if (userGuess > randomNumber) {
        msg.textContent = "📉 Kichikroq son o'ylang.";
    } else {
        msg.textContent = "📈 Kattaroq son o'ylang.";
    }
};

// KIM CHAQQON MINI-O'YINI
let reactTimer = null;
let reactStartTime = 0;
function resetReactGame() {
    const reactBox = document.getElementById('react-box');
    const reactResult = document.getElementById('react-result');
    if (!reactBox) return;
    
    clearTimeout(reactTimer);
    reactBox.style.background = '#ef4444';
    reactBox.textContent = 'Kuting...';
    if (reactResult) reactResult.textContent = '';
    
    const delay = Math.random() * 3000 + 2000; 
    reactTimer = setTimeout(() => {
        reactBox.style.background = '#22c55e';
        reactBox.textContent = 'BOSING!!!';
        reactStartTime = Date.now();
    }, delay);
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'react-box') {
        const reactBox = e.target;
        const reactResult = document.getElementById('react-result');
        
        if (reactBox.style.background === 'rgb(239, 68, 68)' || reactBox.textContent === 'Kuting...') {
            clearTimeout(reactTimer);
            if (reactResult) reactResult.textContent = '❌ Erta bosdingiz! Qaytadan...';
            setTimeout(resetReactGame, 1000);
        } else if (reactBox.style.background === 'rgb(34, 197, 94)') {
            const reactionTime = (Date.now() - reactStartTime) / 1000;
            if (reactResult) reactResult.textContent = `⚡ Vaqtingiz: ${reactionTime} soniya! (+50 tanga)`;
            giveServerReward(50); 
            reactBox.style.background = '#3b82f6';
            reactBox.textContent = 'Yana o\'ynash';
        } else { resetReactGame(); }
    }
});

// OMAD G'ILDIRAGI MINI-O'YINI
window.spinWheel = function() {
    if (currentScore < 20) {
        showCustomAlert("⚠️ Diqqat", "Aylantirish uchun 20 tanga kerak!");
        return;
    }
    const wheel = document.getElementById('wheel');
    const result = document.getElementById('wheel-result');
    if (!wheel || !result) return;

    currentScore -= 20; 
    if (scoreDisplay) scoreDisplay.textContent = currentScore;

    result.textContent = "Aylanmoqda... 🎰";
    wheel.style.transform = "rotate(1080deg)";
    wheel.style.transition = "transform 2s ease-out";

    setTimeout(() => {
        wheel.style.transform = "rotate(0deg)";
        wheel.style.transition = "none";
        
        const rewards = [0, 10, 35, 50, 100];
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        
        if (randomReward > 0) {
            result.innerHTML = `<span style='color: #22c55e;'>🎁 Sizga ${randomReward} tanga tushdi!</span>`;
            giveServerReward(randomReward); 
        } else {
            result.innerHTML = "<span style='color: #ef4444;'>😢 Omad kelmadi!</span>";
        }
    }, 2000);
};

// KRIPTO BIRJA
let cryptoPrice = 100;
let myCryptoCount = 0;

setInterval(() => {
    const priceTxt = document.getElementById('crypto-price');
    if (priceTxt) {
        let change = Math.floor(Math.random() * 41) - 20; 
        cryptoPrice = Math.max(10, cryptoPrice + change);
        priceTxt.textContent = cryptoPrice;
    }
}, 3000);

window.buyCrypto = function() {
    if (currentScore >= cryptoPrice) {
        currentScore -= cryptoPrice;
        myCryptoCount++;
        if (scoreDisplay) scoreDisplay.textContent = currentScore;
        document.getElementById('my-crypto').textContent = myCryptoCount;
    } else { showCustomAlert("⚠️ Xatolik", "Tangangiz yetarli emas!"); }
};

window.sellCrypto = function() {
    if (myCryptoCount > 0) {
        myCryptoCount--;
        currentScore += cryptoPrice;
        if (scoreDisplay) scoreDisplay.textContent = currentScore;
        document.getElementById('my-crypto').textContent = myCryptoCount;
    } else { showCustomAlert("⚠️ Xatolik", "Sizda DurovCoin yo'q!"); }
};

// GLOBAL REYTING JADVALI
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/global-leaderboard');
        if (!response.ok) return;
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

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.display = 'block';
    }
    const clickedBtn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');
    if (tabId === 'react-tab') resetReactGame();
};

setInterval(loadFromServer, 1000);
setInterval(loadLeaderboard, 3000);
window.onload = () => { loadFromServer(); loadLeaderboard(); };
