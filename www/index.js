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

let animationId = null;
var renderLoop = () => {
    universe.tick();

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

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = bitIsSet(idx, cells)
                ? ALIVE_COLOR
                : DEAD_COLOR;

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


document.getElementById('btn').addEventListener('click', (clicked_button) => {
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
playPauseButton.addEventListener("click", event => {
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
    console.log("TOGGLE CELL PLS");
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    universe.toggle_cell(row, col);

    drawGrid();
    drawCells();
});

drawGrid();
drawCells();
requestAnimationFrame(renderLoop);
