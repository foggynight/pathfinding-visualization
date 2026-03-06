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

// Vec2 ------------------------------------------------------------------------

function Vec2_eq(v1, v2) { return (v1[0] == v2[0]) && (v1[1] == v2[1]); }

// grid ------------------------------------------------------------------------

const TILE_WATER  = 0;
const TILE_GROUND = 1;
const TILE_WALL   = 2;

const TILE_POINT  = 3;
const TILE_OPEN   = 4;
const TILE_CLOSED = 5;
const TILE_FINAL  = 6;

const TILE_COLORS = ["blue", "green", "grey", "red", "#FFFF00", "#AAAA00", "white"];
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

class Node {
	constructor(pos, parent = null) {
		this.pos = pos;
		this.parent = parent;
	}
}

const path_open = [];
let path_closed;
const path_final = [];

function visit_unclosed_neighbors(tile, tile_end) {
	function visit(x, y) {
		const node = new Node([x, y], tile);
		path_open.push(node);
		path_closed[y][x] = true;
		if (Vec2_eq([x, y], tile_end)) {
			create_final_path(node);
			return true;
		}
		return false;
	}
	const [tx, ty] = tile.pos;
	if (tx > 0 && !path_closed[ty][tx-1])          { if (visit(tx - 1, ty)) return; }
	if (tx < GRID_W - 1 && !path_closed[ty][tx+1]) { if (visit(tx + 1, ty)) return; }
	if (ty > 0 && !path_closed[ty-1][tx])          { if (visit(tx, ty - 1)) return; }
	if (ty < GRID_H - 1 && !path_closed[ty+1][tx]) { if (visit(tx, ty + 1)) return; }
}

function create_final_path(tile) {
	while (tile !== null) {
		path_final.push(tile);
		tile = tile.parent;
	}
	path_final.reverse();
}

function pathfind_BFS(tile_start, tile_end) {
    function start() {
		path_open.length = 0;
		path_closed = Array(GRID_H).fill(0)
			.map(_ => Array(GRID_W).fill(false));
		path_final.length = 0;

		if (Vec2_eq(tile_start, tile_end)) {
			path_final.push(new Node(tile_start, null));
			return;
		}

		path_open.push(new Node(tile_start, null));
		const [ps_x, ps_y] = tile_start;
		path_closed[ps_y][ps_x] = true;
    }

    function step() {
		const head = path_open.shift();
		visit_unclosed_neighbors(head, tile_end);
    }

    function done() {
		return path_final.length > 0;
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

function draw_tile(ix, iy, tile_val) {
	const color = tile_color(tile_val);
    const [x, y] = [ix * CELL_W, iy * CELL_H];
    draw_rect(x, y, CELL_W, CELL_H, color);
}

function draw_tiles(tiles) {
    for (let iy = 0; iy < GRID_H; ++iy) {
        for (let ix = 0; ix < GRID_W; ++ix) {
            draw_tile(ix, iy, tiles[iy][ix]);
        }
    }
}

function draw_tile_arr(points, tile_val) {
    points.forEach(point => draw_tile(point[0], point[1], tile_val));
}

function draw_path_open_closed() {
	for (let iy = 0; iy < GRID_H; ++iy) {
		for (let ix = 0; ix < GRID_W; ++ix) {
			if (path_closed[iy][ix]) {
				draw_tile(ix, iy, TILE_CLOSED);
			}
		}
	}
	path_open.forEach(tile => {
		const [x, y] = tile.pos;
		draw_tile(x, y, TILE_OPEN)
	});
}

function draw_path_final() {
	path_final.forEach(tile => {
		const [x, y] = tile.pos;
		draw_tile(x, y, TILE_FINAL)
	});
}

// main ------------------------------------------------------------------------

const start_end = [POINT_START, POINT_END];

async function main() {
    const tiles = tiles_load();
    draw_tiles(tiles)
    draw_tile_arr(start_end, TILE_POINT);

    const [start, step, done] = pathfind_BFS(POINT_START, POINT_END);

    start();
    draw_path_open_closed();
    draw_tile_arr(start_end, TILE_POINT);
    while (!done()) {
        step();
		draw_tiles(tiles);
        draw_path_open_closed();
        draw_tile_arr(start_end, TILE_POINT);
        await new Promise(resolve => setTimeout(resolve, SLEEP_TIME));
    }
    if (path_final.length > 0) {
        draw_path_final();
        draw_tile_arr(start_end, TILE_POINT);
    }
}

main()
