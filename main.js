const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nnCanvas = document.getElementById('nnCanvas');
const nnCtx = nnCanvas.getContext('2d');

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
const selectCrossover = document.getElementById('select-crossover');
const btnRestart = document.getElementById('btn-restart');
const checkOnlyBest = document.getElementById('check-only-best');

let popSize = parseInt(inputPop.value) || 100;
let mutationRate = (parseFloat(inputMut.value) || 5) / 100;
window.hiddenLayerNodes = parseInt(inputHidden.value) || 16;
window.crossoverType = selectCrossover ? selectCrossover.value : 'weight';

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
    window.crossoverType = selectCrossover ? selectCrossover.value : 'weight';

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

let it_count = 0;
function loop() {
    if (!running) return;
    it_count++;
    // Run simulation updates
    for (let i = 0; i < simulationSpeed; i++) {
        if (!population.allDead()) {
            population.update();
        } else {
            population.naturalSelection();
        }
    }

    // Skip rendering frames for better performance
    if (simulationSpeed > 3 && it_count % 3 != 0) {
        requestAnimationFrame(loop);
        return;
    }

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    population.show(ctx, checkOnlyBest.checked);

    updateStats();

    let bestAlive = population.getBestAliveSnake();
    if (bestAlive && bestAlive.brain) {
        drawNetwork(bestAlive.brain, nnCtx);
    }

    requestAnimationFrame(loop);
}

// Initial draw
drawGrid();
updateStats();

function drawNetwork(brain, ctx) {
    ctx.clearRect(0, 0, nnCanvas.width, nnCanvas.height);
    if (!brain) return;

    let inputs = brain.lastInputs || [];
    let hidden = brain.lastHidden || [];
    let hidden2 = brain.lastHidden2 || [];
    let outputs = brain.lastOutputs || [];

    let inputNodes = brain.inputNodes;
    let hiddenNodes = brain.hiddenNodes;
    let outputNodes = brain.outputNodes;

    let w = nnCanvas.width;
    let h = nnCanvas.height;

    let nodeRadius = 3;

    let xInput = w * 0.15;
    let xHidden1 = w * 0.38;
    let xHidden2 = w * 0.62;
    let xOutput = w * 0.85;

    function getY(index, total) {
        let spacing = (h * 0.9) / Math.max(total, 1);
        let offset = (h - (spacing * (total - 1))) / 2;
        return offset + (index * spacing);
    }

    for (let i = 0; i < hiddenNodes; i++) {
        for (let j = 0; j < inputNodes; j++) {
            let weight = brain.weights_ih.data[i][j];
            if (Math.abs(weight) > 0.5) {
                ctx.beginPath();
                ctx.moveTo(xInput, getY(j, inputNodes));
                ctx.lineTo(xHidden1, getY(i, hiddenNodes));
                ctx.lineWidth = Math.abs(weight);
                ctx.strokeStyle = weight > 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)';
                ctx.stroke();
            }
        }
    }

    for (let i = 0; i < hiddenNodes; i++) {
        for (let j = 0; j < hiddenNodes; j++) {
            let weight = brain.weights_hh.data[i][j];
            if (Math.abs(weight) > 0.5) {
                ctx.beginPath();
                ctx.moveTo(xHidden1, getY(j, hiddenNodes));
                ctx.lineTo(xHidden2, getY(i, hiddenNodes));
                ctx.lineWidth = Math.abs(weight);
                ctx.strokeStyle = weight > 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)';
                ctx.stroke();
            }
        }
    }

    for (let i = 0; i < outputNodes; i++) {
        for (let j = 0; j < hiddenNodes; j++) {
            let weight = brain.weights_ho.data[i][j];
            if (Math.abs(weight) > 0.5) {
                ctx.beginPath();
                ctx.moveTo(xHidden2, getY(j, hiddenNodes));
                ctx.lineTo(xOutput, getY(i, outputNodes));
                ctx.lineWidth = Math.abs(weight);
                ctx.strokeStyle = weight > 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)';
                ctx.stroke();
            }
        }
    }

    function drawNodeLayer(x, count, activations) {
        for (let i = 0; i < count; i++) {
            let val = (activations[i] !== undefined) ? activations[i] : 0;
            let brightness = Math.floor(val * 255);
            ctx.beginPath();
            ctx.arc(x, getY(i, count), nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawNodeLayer(xInput, inputNodes, inputs);
    drawNodeLayer(xHidden1, hiddenNodes, hidden);
    drawNodeLayer(xHidden2, hiddenNodes, hidden2);
    drawNodeLayer(xOutput, outputNodes, outputs);
}
