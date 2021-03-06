import { Universe } from "game-of-life";
import { memory } from "game-of-life/game_of_life_bg"; // Import the WebAssembly memory at the top of the file.

const CELL_SIZE = 8; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

// Construct the universe, and get its width and height.
let universe = Universe.new();
const width = universe.width();
const height = universe.height();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');

// Class for performance analysis
const fps = new class {
    constructor() {
        this.fps = document.getElementById("fps");
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    }

    render() {
        // Convert the delta time since the last frame render into a measure
        // of frames per second.
        const now = performance.now();
        const delta = now - this.lastFrameTimeStamp;
        this.lastFrameTimeStamp = now;
        const fps = 1 / delta * 1000;

        // Save only the latest 100 timings.
        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        }

        // Find the max, min, and mean of our 100 latest timings.
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let i = 0; i < this.frames.length; i++) {
            sum += this.frames[i];
            min = Math.min(this.frames[i], min);
            max = Math.max(this.frames[i], max);
        }
        let mean = sum / this.frames.length;

        // Render the statistics.
        this.fps.textContent = `
Frames per Second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
    }
};


let animationId = null;
let nrTicksPerRender = 1;
var renderLoop = () => {
    for (let i = 0; i < nrTicksPerRender; i++) {
        universe.tick();
    }
    fps.render();
    drawGrid();
    drawCells();
    animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
        ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
        ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
        ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

const getIndex = (row, column) => {
    return row * width + column;
};

const bitIsSet = (n, arr) => {
    const byte = Math.floor(n / 8);
    const mask = 1 << (n % 8);
    return (arr[byte] & mask) === mask;
};

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height / 8);

    ctx.beginPath();

    //     for (let row = 0; row < height; row++) {
    //         for (let col = 0; col < width; col++) {
    //             const idx = getIndex(row, col);

    //             ctx.fillStyle = bitIsSet(idx, cells)
    //                 ? ALIVE_COLOR
    //                 : DEAD_COLOR;

    //             ctx.fillRect(
    //                 col * (CELL_SIZE + 1) + 1,
    //                 row * (CELL_SIZE + 1) + 1,
    //                 CELL_SIZE,
    //                 CELL_SIZE
    //             );
    //         }
    //     }

    /*
    Optimization: Reduce calls to fillStyle
    */
    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (!bitIsSet(idx, cells)) {
                continue;
            }

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    // Dead cells.
    ctx.fillStyle = DEAD_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (bitIsSet(idx, cells)) {
                continue;
            }

            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
};


document.getElementById('btn').addEventListener('click', () => {
    let threshold = document.getElementById('threshold_input').value;
    universe = Universe.new("random", threshold);
    drawCells();
});

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'q':
            universe.add_glider();
            break;
        default:
            break;
    }
});

const playPauseButton = document.getElementById("play-pause");
playPauseButton.addEventListener("click", () => {
    if (animationId === null) {
        playPauseButton.textContent = "⏸";
        renderLoop();
    } else {
        playPauseButton.textContent = "▶";
        cancelAnimationFrame(animationId);
        animationId = null;
    }
});

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    if (event.ctrlKey) {
        console.log("SPAWN GLIDER PLS: (", row, ", ", col, ")");
        universe.add_glider_at(row, col);
    } else {
        // console.log("TOGGLE CELL PLS: (", row, ", ", col, ")");
        universe.toggle_cell(row, col);
    }

    drawGrid();
    drawCells();
});

const rangeWidget = document.getElementById("ticks_per_render");
rangeWidget.addEventListener("click", () => {
    nrTicksPerRender = rangeWidget.value;
});

drawGrid();
drawCells();
requestAnimationFrame(renderLoop);
