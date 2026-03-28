// === KONFIGURATION & DATEN ===
let currentLocation = 'Erde';
let startTime = null;
let timerInterval = null;
let countdownInterval = null;
let mapInterval = null;

// Periodensystem-Elemente (H bis Si)
const elements = {
  hydrogen: { symbol: 'H', name: 'Wasserstoff', rarity: 1.0 },      // Häufigkeit: 100%
  helium: { symbol: 'He', name: 'Helium', rarity: 0.85 },            // Häufigkeit: 85%
  lithium: { symbol: 'Li', name: 'Lithium', rarity: 0.70 },          // Häufigkeit: 70%
  beryllium: { symbol: 'Be', name: 'Beryllium', rarity: 0.60 },      // Häufigkeit: 60%
  boron: { symbol: 'B', name: 'Bor', rarity: 0.50 },                 // Häufigkeit: 50%
  carbon: { symbol: 'C', name: 'Kohlenstoff', rarity: 0.42 },      // Häufigkeit: 42%
  nitrogen: { symbol: 'N', name: 'Stickstoff', rarity: 0.35 },      // Häufigkeit: 35%
  oxygen: { symbol: 'O', name: 'Sauerstoff', rarity: 0.28 },        // Häufigkeit: 28%
  fluorine: { symbol: 'F', name: 'Fluor', rarity: 0.22 },           // Häufigkeit: 22%
  neon: { symbol: 'Ne', name: 'Neon', rarity: 0.17 },               // Häufigkeit: 17%
  sodium: { symbol: 'Na', name: 'Natrium', rarity: 0.13 },           // Häufigkeit: 13%
  magnesium: { symbol: 'Mg', name: 'Magnesium', rarity: 0.10 },     // Häufigkeit: 10%
  aluminium: { symbol: 'Al', name: 'Aluminium', rarity: 0.07 },     // Häufigkeit: 7%
  silicon: { symbol: 'Si', name: 'Silizium', rarity: 0.05 }        // Häufigkeit: 5%
};

// Element-Mengen
const elementAmounts = {
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

// 2D-Koordinaten (AU)
const celestialBodies = {
    'Erde':     { x: 1.000, y:  0.000 },
    'Mond':     { x: 1.0027, y: 0.0025 },
    'Venus':    { x: 0.723, y: -0.350 },
    'Mars':     { x: 1.524, y:  0.850 },
    'Merkur':   { x: 0.387, y:  0.220 },
    'Jupiter':  { x: 5.203, y:  2.100 },
    'Saturn':   { x: 9.582, y: -3.200 },
    'Uranus':   { x: 19.191, y: 4.500 }
};

const distanceMatrix = {};
const KM_PER_AU = 149597870.7;

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

// === 2D KARTE ===
const canvas = document.getElementById('solar-map');
const ctx = canvas.getContext('2d');
const mapScale = 12;

function drawSolarMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Sonne
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Planeten
    Object.keys(celestialBodies).forEach(name => {
        const body = celestialBodies[name];
        const x = centerX + body.x * mapScale;
        const y = centerY + body.y * mapScale;

        let color = '#66ffcc';
        if (name === 'Erde' || name === 'Mond') color = '#3388ff';
        else if (name === 'Mars') color = '#ff4444';
        else if (name === 'Venus') color = '#ffaa33';
        else if (name === 'Merkur') color = '#aaaaaa';
        else if (name === 'Jupiter') color = '#ffbb00';
        else if (name === 'Saturn') color = '#ffdd88';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px Arial';
        ctx.fillText(name, x + 9, y + 4);
    });

    // Raumschiff als gelbes Kreuz
    const ship = celestialBodies[currentLocation];
    const shipX = centerX + ship.x * mapScale;
    const shipY = centerY + ship.y * mapScale;

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(shipX - 12, shipY);
    ctx.lineTo(shipX + 12, shipY);
    ctx.moveTo(shipX, shipY - 12);
    ctx.lineTo(shipX, shipY + 12);
    ctx.stroke();

    // Leuchtender Kreis
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shipX, shipY, 16, 0, Math.PI * 2);
    ctx.stroke();
}

function startMapUpdate() {
    if (mapInterval) clearInterval(mapInterval);
    mapInterval = setInterval(drawSolarMap, 800);
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

// === SLOTS & INVENTAR ===
function createShipSlots() {
    const panel = document.getElementById('ship-slots');
    panel.innerHTML = '<h2>Raumschiff-Ausrüstung</h2>';
    const cont = document.createElement('div'); cont.className = 'ship-slots-container';
    panel.appendChild(cont);
    for (let i = 0; i < 6; i++) {
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
    for (let i = 0; i < 9; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `<span>Item ${i+1}</span>`;
        cont.appendChild(item);
    }
}

function updateResources() {
  Object.keys(elementAmounts).forEach(key => {
    const element = document.getElementById(key);
    if (element) {
      element.textContent = Math.floor(elementAmounts[key]);
    }
  });
}

// === REISE ===
function startTravel(target) {
  if (!target) {
    alert("Bitte wählen Sie ein Ziel aus.");
    return;
  }

  const totalMinutes = calculateTravelTime(target);
  const distAU = distanceMatrix[currentLocation][target];
  const totalKM = distAU * KM_PER_AU;

  const info = document.getElementById('travel-info');
  info.classList.remove('hidden');

  const btn = document.getElementById('accelerate-btn');
  btn.disabled = true;
  btn.textContent = "Reise läuft...";

  let remainingSeconds = totalMinutes * 60;

  // Speichert bereits hinzugefügte Mengen für jedes Element
  const elementAdded = {};
  Object.keys(elements).forEach(key => {
    elementAdded[key] = 0;
  });

  info.innerHTML = `Reise zu <strong>${target}</strong> gestartet.<br> Noch <span id="countdown-timer">${totalMinutes}:00</span> Minuten`;

  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    remainingSeconds--;
    const minLeft = Math.floor(remainingSeconds / 60);
    const secLeft = remainingSeconds % 60;
    document.getElementById('countdown-timer').textContent = `${minLeft}:${secLeft < 10 ? '0' : ''}${secLeft}`;

    // Elemente sammeln basierend auf Seltenheit
    const progress = (totalMinutes * 60 - remainingSeconds) / (totalMinutes * 60);
    const baseAmount = (totalKM / 50000) * 3;

    Object.keys(elements).forEach(key => {
      const element = elements[key];
      const currentAdded = Math.floor(baseAmount * progress * element.rarity);
      if (currentAdded > elementAdded[key]) {
        elementAmounts[key] += (currentAdded - elementAdded[key]);
        elementAdded[key] = currentAdded;
      }
    });

    updateResources();

    // Koordinaten aktualisieren
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
      drawSolarMap();
      alert(`✅ Sie sind erfolgreich auf ${target} angekommen!`);
    }
  }, 1000);
}

// === INITIALISIERUNG ===
function startNewGame() {
    document.getElementById('menu-screen').classList.add('hidden');
    const gameScreen = document.getElementById('game-screen');
    gameScreen.classList.remove('hidden');
    setTimeout(() => gameScreen.classList.add('visible'), 50);

    startTimer();
    populateDestinationSelect();
    createShipSlots();
    createInventory();

    drawSolarMap();
    startMapUpdate();

  // Alle Elemente zurücksetzen
  Object.keys(elementAmounts).forEach(key => {
    elementAmounts[key] = 0;
  });
    updateResources();
}

function init() {
    buildDistanceMatrix();

    document.getElementById('new-game').addEventListener('click', startNewGame);

    document.getElementById('accelerate-btn').addEventListener('click', () => {
        const target = document.getElementById('destination-select').value;
        startTravel(target);
    });
}

window.onload = init;