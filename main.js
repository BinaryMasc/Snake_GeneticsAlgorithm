const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const btnRun = document.getElementById('btn-run');
const btnNext = document.getElementById('btn-next');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');

const statGen = document.getElementById('stat-gen');
const statAlive = document.getElementById('stat-alive');
const statFitness = document.getElementById('stat-fitness');
const statGlobalFitness = document.getElementById('stat-global-fitness');

const inputPop = document.getElementById('input-pop');
const inputMut = document.getElementById('input-mut');
const inputHidden = document.getElementById('input-hidden');
const btnRestart = document.getElementById('btn-restart');
const checkOnlyBest = document.getElementById('check-only-best');

let popSize = parseInt(inputPop.value) || 100;
let mutationRate = (parseFloat(inputMut.value) || 5) / 100;
window.hiddenLayerNodes = parseInt(inputHidden.value) || 16;

let population = new Population(popSize, mutationRate);

let running = false;
let simulationSpeed = 1;

btnRun.addEventListener('click', () => {
    running = !running;
    btnRun.innerText = running ? 'Pause' : 'Run';
    if (running) {
        requestAnimationFrame(loop);
    }
});

// btnNext.addEventListener('click', () => {
//     // Force next generation
//     population.naturalSelection();
//     updateStats();
// });

speedSlider.addEventListener('input', (e) => {
    simulationSpeed = parseInt(e.target.value);
    speedVal.innerText = simulationSpeed + 'x';
});

btnRestart.addEventListener('click', () => {
    popSize = parseInt(inputPop.value);
    mutationRate = parseFloat(inputMut.value) / 100;
    window.hiddenLayerNodes = parseInt(inputHidden.value);

    population = new Population(popSize, mutationRate);
    updateStats();

    if (!running) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        population.show(ctx, checkOnlyBest.checked);
    }
});

function updateStats() {
    statGen.innerText = population.generation;
    statAlive.innerText = `${population.getAliveCount()} / ${popSize}`;
    statFitness.innerText = Math.floor(population.bestFitness);
    statGlobalFitness.innerText = Math.floor(population.globalBestFitness);
}

function drawGrid() {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function loop() {
    if (!running) return;

    // Run simulation updates
    for (let i = 0; i < simulationSpeed; i++) {
        if (!population.allDead()) {
            population.update();
        } else {
            population.naturalSelection();
        }
    }

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    population.show(ctx, checkOnlyBest.checked);

    updateStats();

    requestAnimationFrame(loop);
}

// Initial draw
drawGrid();
updateStats();
