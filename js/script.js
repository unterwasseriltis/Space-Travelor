// === KONFIGURATION & DATEN ===
let currentLocation = 'Erde';
let startTime = null;
let timerInterval = null;
let countdownInterval = null;
let resources = {
    hydrogen: 0,
    helium: 0,
    lithium: 0,
    beryllium: 0,
    boron: 0,
    carbon: 0,
    nitrogen: 0,
    oxygen: 0,
    fluorine: 0,
    neon: 0,
    sodium: 0,
    magnesium: 0,
    aluminium: 0,
    silicon: 0
};

// Ressourcen-Sammel-Konfiguration
const resourceConfigs = {
    hydrogen: { distance: 100000, amount: 5 },
    helium: { distance: 130769, amount: 4 },
    lithium: { distance: 161538, amount: 3 },
    beryllium: { distance: 192308, amount: 3 },
    boron: { distance: 223077, amount: 2 },
    carbon: { distance: 253846, amount: 2 },
    nitrogen: { distance: 284615, amount: 2 },
    oxygen: { distance: 315385, amount: 2 },
    fluorine: { distance: 346154, amount: 1 },
    neon: { distance: 376923, amount: 1 },
    sodium: { distance: 407692, amount: 1 },
    magnesium: { distance: 438462, amount: 1 },
    aluminium: { distance: 469231, amount: 1 },
    silicon: { distance: 500000, amount: 1 }
};

// 2D-Koordinaten (AU)
const celestialBodies = {
    'Erde':     { x: 1.000, y:  0.000 },
    'Mond':     { x: 1.0027, y: 0.0025 },
    'Venus':    { x: 0.723, y: -0.350 },
    'Mars':     { x: 1.524, y:  0.850 },
    'Phobos':   { x: 1.524, y:  0.850 },  // Gleiche Koords wie Mars
    'Deimos':   { x: 1.524, y:  0.850 },  // Gleiche Koords wie Mars
    'Merkur':   { x: 0.387, y:  0.220 },
    'Jupiter':  { x: 5.203, y:  2.100 },
    'Io':       { x: 5.204, y:  2.101 },  // Nahe bei Jupiter
    'Europa':   { x: 5.205, y:  2.102 },
    'Ganymed':  { x: 5.206, y:  2.103 },
    'Kallisto': { x: 5.207, y:  2.104 },
    'Saturn':   { x: 9.582, y: -3.200 },
    'Titan':    { x: 9.583, y: -3.201 },  // Nahe bei Saturn
    'Thea':     { x: 9.584, y: -3.202 },  // Annahme: Theia
    'Iapetus':  { x: 9.585, y: -3.203 },
    'Dione':    { x: 9.586, y: -3.204 },
    'Tethys':   { x: 9.587, y: -3.205 },
    'Uranus':   { x: 19.191, y: 4.500 }
};

const distanceMatrix = {};
const KM_PER_AU = 149597870.7;   // exakter Wert

function buildDistanceMatrix() {
    Object.keys(celestialBodies).forEach(from => {
        distanceMatrix[from] = {};
        Object.keys(celestialBodies).forEach(to => {
            if (from === to) { distanceMatrix[from][to] = 0; return; }
            const dx = celestialBodies[to].x - celestialBodies[from].x;
            const dy = celestialBodies[to].y - celestialBodies[from].y;
            distanceMatrix[from][to] = Math.hypot(dx, dy);
        });
    });
}

function calculateTravelTime(target) {
    const distAU = distanceMatrix[currentLocation]?.[target] || 0;
    let minutes = Math.round((distAU / 1.0) * 16);
    return Math.max(1, minutes);
}

function getCurrentCoordinates() {
    const pos = celestialBodies[currentLocation];
    return `X: ${pos.x.toFixed(3)} AU | Y: ${pos.y.toFixed(3)} AU`;
}

// === TIMER ===
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        document.getElementById('timer').textContent = `Missionszeit: ${h}:${m}:${s}`;
    }, 1000);
}

// === DROPDOWN ===
function populateDestinationSelect() {
    const select = document.getElementById('destination-select');
    select.innerHTML = '<option value="">-- Ziel auswählen --</option>';

    Object.keys(celestialBodies).forEach(body => {
        if (body !== currentLocation) {
            const option = document.createElement('option');
            option.value = body;
            option.textContent = body;
            select.appendChild(option);
        }
    });
}

// === SLOTS & INVENTAR (Platzhalter) ===
function createShipSlots() {
    const panel = document.getElementById('ship-slots');
    panel.innerHTML = '<h2>Raumschiff-Ausrüstung</h2>';
    const cont = document.createElement('div'); cont.className = 'ship-slots-container';
    panel.appendChild(cont);
    for (let i = 0; i < 14; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.innerHTML = `<span>Slot ${i+1}</span>`;
        cont.appendChild(slot);
    }
}

function createInventory() {
    const panel = document.getElementById('inventory');
    panel.innerHTML = '<h2>Inventar</h2>';
    const cont = document.createElement('div'); cont.className = 'inventory-container';
    panel.appendChild(cont);
    for (let i = 0; i < 4; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `<span>Item ${i+1}</span>`;
        cont.appendChild(item);
    }
}

// === EFFEKTVOLLER ÜBERGANG + RESSOURCEN ===
function startNewGame() {
    const menu = document.getElementById('menu-screen');
    const game = document.getElementById('game-screen');

    menu.style.transition = 'opacity 0.8s ease';
    menu.style.opacity = '0';

    setTimeout(() => {
        menu.classList.add('hidden');
        game.classList.remove('hidden');
        setTimeout(() => game.classList.add('visible'), 50);   // schöner Fade-In
    }, 800);

    startTimer();
    populateDestinationSelect();
    createShipSlots();
    createInventory();

    // Ressourcen zurücksetzen
    for (let res in resources) {
        resources[res] = 0;
    }
    updateResources();
}

// === RESSOURCEN ANZEIGE ===
function updateResources() {
    for (let res in resources) {
        document.getElementById(res).textContent = Math.floor(resources[res]);
    }
}

// === REISE MIT KOORDINATEN + WASSERSTOFF-AUFLADUNG ===
function startTravel(target) {
    if (!target) { alert("Bitte wählen Sie ein Ziel aus."); return; }

    const totalMinutes = calculateTravelTime(target);
    const distAU = distanceMatrix[currentLocation][target];
    const totalKM = distAU * KM_PER_AU;

    const info = document.getElementById('travel-info');
    info.classList.remove('hidden');

    const btn = document.getElementById('accelerate-btn');
    btn.disabled = true;
    btn.textContent = "Reise läuft...";

    let remainingSeconds = totalMinutes * 60;
    let resourcesAdded = {};
    for (let res in resources) {
        resourcesAdded[res] = 0;
    }

    info.innerHTML = `Reise zu <strong>${target}</strong> gestartet.<br>
                      Noch <span id="countdown-timer">${totalMinutes}:00</span> Minuten`;

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        remainingSeconds--;

        // Countdown
        const minLeft = Math.floor(remainingSeconds / 60);
        const secLeft = remainingSeconds % 60;
        document.getElementById('countdown-timer').textContent = `${minLeft}:${secLeft < 10 ? '0' : ''}${secLeft}`;

        // Ressourcen kontinuierlich sammeln
        const progress = (totalMinutes * 60 - remainingSeconds) / (totalMinutes * 60);
        for (let res in resourceConfigs) {
            const config = resourceConfigs[res];
            const currentAdded = Math.floor((totalKM / config.distance) * config.amount * progress);
            if (currentAdded > resourcesAdded[res]) {
                resources[res] += (currentAdded - resourcesAdded[res]);
                resourcesAdded[res] = currentAdded;
                updateResources();
            }
        }

        // Koordinaten während Reise aktualisieren (interpoliert)
        const currentX = (celestialBodies[currentLocation].x * (1 - progress) + celestialBodies[target].x * progress).toFixed(3);
        const currentY = (celestialBodies[currentLocation].y * (1 - progress) + celestialBodies[target].y * progress).toFixed(3);
        document.getElementById('current-coordinates').textContent = `Koordinaten: X: ${currentX} AU | Y: ${currentY} AU`;

        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            currentLocation = target;

            document.getElementById('location').textContent = `Standort: ${currentLocation}`;
            document.getElementById('current-coordinates').textContent = `Koordinaten: ${getCurrentCoordinates()}`;

            info.classList.add('hidden');
            btn.disabled = false;
            btn.textContent = "Beschleunigen";

            populateDestinationSelect();
            // Ankunft-Modal anzeigen
            document.getElementById('arrival-message').textContent = `Sie sind erfolgreich auf ${target} angekommen!`;
            document.getElementById('arrival-modal').classList.remove('hidden');
        }
    }, 2000);
}

// === INITIALISIERUNG ===
function init() {
    buildDistanceMatrix();

    document.getElementById('new-game').addEventListener('click', startNewGame);

    document.getElementById('accelerate-btn').addEventListener('click', () => {
        const target = document.getElementById('destination-select').value;
        startTravel(target);
    });

    document.getElementById('arrival-close').addEventListener('click', () => {
        document.getElementById('arrival-modal').classList.add('hidden');
    });
}

window.onload = init;