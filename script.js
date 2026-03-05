const CANV_W = 640;
const CANV_H = 480;

const CELL_W = 10;
const CELL_H = 10;

const GRID_W = Math.floor(CANV_W / CELL_W);
const GRID_H = Math.floor(CANV_H / CELL_H);

const TARGET_FPS = 165;
const SLEEP_TIME = TARGET_FPS / 1000;

const POINT_START = [24, 24];
const POINT_END   = [36, 36];

// grid ------------------------------------------------------------------------

const TILE_WATER  = 0;
const TILE_GROUND = 1;
const TILE_WALL   = 2;

const TILE_FINAL  = 3;
const TILE_OPEN   = 4;
const TILE_CLOSED = 5;

const TILE_COLORS = ["blue", "green", "grey", "red", "#FFFF00", "#AAAA00"];
function tile_color(val) { return TILE_COLORS[val]; }

function tiles_load() {
    const tiles = Array(GRID_H).fill(0)
        .map(t => Array(GRID_W).fill(TILE_WATER));
    for (let y = 0; y < 10; ++y) {
        for (let x = 0; x < 10; ++x) {
            tiles[y][x] = TILE_GROUND;
        }
    }
    for (let y = 0; y < 10; ++y) {
        for (let x = 0; x < 10; ++x) {
            tiles[y + 10][x] = TILE_WALL;
        }
    }
    return tiles;
}

// pathfinding -----------------------------------------------------------------

const path_open = [];
const path_closed = {};
const path_final = [];

function pathfind_BFS(point_start, point_end) {
    function start() {

    }

    function step() {

    }

    function done() {
        return true;
    }

    return [start, step, done];
}

// draw ------------------------------------------------------------------------

const canvas = document.getElementById("canvas");
[canvas.width, canvas.height] = [CANV_W, CANV_H];
const ctx = canvas.getContext("2d");

function draw_line(x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function draw_rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function draw_clear(color) {
    draw_rect(0, 0, CANV_W, CANV_H, color);
}

function draw_grid(color) {
    for (let ix = 1; ix < GRID_W; ++ix) {
        const x = ix * CELL_W;
        draw_line(x, 0, x, CANV_H, color);
    }
    for (let iy = 1; iy < GRID_H; ++iy) {
        const y = iy * CELL_H;
        draw_line(0, y, CANV_W, y, color);
    }
}

function draw_tile(ix, iy, color) {
    const [x, y] = [ix * CELL_W, iy * CELL_H];
    draw_rect(x, y, CELL_W, CELL_H, color);
}

function draw_tiles(tiles) {
    for (let iy = 0; iy < GRID_H; ++iy) {
        for (let ix = 0; ix < GRID_W; ++ix) {
            const tile_val = tiles[iy][ix];
            draw_tile(ix, iy, TILE_COLORS[tile_val]);
        }
    }
}

function draw_points(points, tile_color) {
    const color = TILE_COLORS[tile_color];
    points.forEach(point => draw_tile(point[0], point[1], color));
}

function draw_path_open_closed() {
    draw_open(path_open, TILE_OPEN);
    draw_closed(path_closed, TILE_CLOSED);
}

function draw_path_final() {
    draw_final(path_final, TILE_FINAL);
}

// main ------------------------------------------------------------------------

async function main() {
    const tiles = tiles_load();
    draw_tiles(tiles)
    draw_points([POINT_START, POINT_END], TILE_FINAL);

    const [start, step, done] = pathfind_BFS(POINT_START, POINT_END);

    start();
    draw_path_open_closed();
    draw_points([POINT_START, POINT_END], TILE_FINAL);
    while (!done()) {
        step();
        draw_path_open_closed();
        draw_points([POINT_START, POINT_END], TILE_FINAL);
        await new Promise(resolve => setTimeout(resolve, SLEEP_TIME));
    }
    if (path_final.length > 0) {
        draw_path_final();
        draw_points([POINT_START, POINT_END], TILE_FINAL);
    }
}

main()
