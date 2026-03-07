const CANV_W = 640;
const CANV_H = 480;

const CELL_W = 10;
const CELL_H = 10;

const GRID_W = Math.floor(CANV_W / CELL_W);
const GRID_H = Math.floor(CANV_H / CELL_H);

const TARGET_FPS = 165;
const SLEEP_TIME = TARGET_FPS / 1000;

// util ------------------------------------------------------------------------

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function Vec2_eq(v1, v2) { return (v1[0] == v2[0]) && (v1[1] == v2[1]); }

const canv_to_tile = (cx, cy) => [
	Math.floor(cx * GRID_W / CANV_W),
	Math.floor(cy * GRID_H / CANV_H),
];

// tile ------------------------------------------------------------------------

const TILE_WATER  = 0;
const TILE_GROUND = 1;
const TILE_WALL   = 2;
const TILE_POINT  = 3;
const TILE_OPEN   = 4;
const TILE_CLOSED = 5;
const TILE_FINAL  = 6;
const TILE_HOVER = 7;

const TILE_COLORS = [
	"blue",
	"green",
	"grey",
	"red",
	"#FFFF00",
	"#AAAA00",
	"white",
	"purple",
];
function tile_color(val) { return TILE_COLORS[val]; }

function char_to_tile(char) {
	return Number(char);
}

function tiles_load(world) {
    const tiles = Array(GRID_H).fill(0)
        .map(t => Array(GRID_W).fill(0));
	for (const wi in world) {
		const chars = world[wi].split(/\s+|(.)/)
			.filter(c => c !== undefined && c.length > 0);
		for (const ci in chars) {
			tiles[wi][ci] = char_to_tile(chars[ci]);
		}
	}
    return tiles;
}

// pathfinding -----------------------------------------------------------------

let tiles = tiles_load(world_test);

let path_open = [];
let path_closed = Array(GRID_H).fill(0)
	.map(_ => Array(GRID_W).fill(false));
let path_final = [];

const point_start = [0, 0];
const point_end   = [0, 0];

class Node {
	constructor(pos, parent = null) {
		this.pos = pos;
		this.parent = parent;
	}
}

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
	for (const [x, y] of [[tx-1,ty], [tx+1,ty], [tx,ty-1], [tx,ty+1]]) {
		if (path_closed[y][x]) continue;
		if (tiles[y][x] !== TILE_GROUND) continue;
		if (visit(x, y)) return;
	}
}

function create_final_path(tile) {
	while (tile !== null) {
		path_final.push(tile);
		tile = tile.parent;
	}
	path_final.reverse();
}

function default_start(tile_start, tile_end) {
	return () => {
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
}

function default_done() {
	return path_open.length === 0 || path_final.length > 0;
}

function pathfind_BFS(tile_start, tile_end) {
    function step() {
		const head = path_open.shift();
		visit_unclosed_neighbors(head, tile_end);
    }
    return [
		default_start(tile_start, tile_end),
		step,
		default_done,
	];
}

function pathfind_DFS(tile_start, tile_end) {
    function step() {
		const head = path_open.pop();
		visit_unclosed_neighbors(head, tile_end);
    }
    return [
		default_start(tile_start, tile_end),
		step,
		default_done,
	];
}

// draw ------------------------------------------------------------------------

const canvas = document.getElementById("canvas");
[canvas.width, canvas.height] = [CANV_W, CANV_H];
const ctx = canvas.getContext("2d");

let mouse_in_canv = false;

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
		draw_tile(x, y, TILE_OPEN);
	});
}

function draw_path_final() {
	path_final.forEach(tile => {
		const [x, y] = tile.pos;
		draw_tile(x, y, TILE_FINAL);
	});
}

function draw_running(tiles, start_end) {
	draw_tiles(tiles);
	draw_path_open_closed();
	draw_path_final();
	draw_tile_arr(start_end, TILE_POINT);
}

function draw_hover(canvas_pos) {
	if (!mouse_in_canv) return;
	const [tx, ty] = canv_to_tile(...canvas_pos);
	draw_tile(tx, ty, TILE_HOVER);
}

// main ------------------------------------------------------------------------

const start_end = [point_start, point_end];
let mouse_pos = [CANV_W / 2, CANV_H / 2];

function str_to_algorithm(str) {
	switch (str) {
		case "BFS": return pathfind_BFS;
		case "DFS": return pathfind_DFS;
		default:
			console.log("ERROR: invalid algorithm option");
			return null;
	}
}

let pathfind_func = str_to_algorithm(
	document.getElementById("select_algorithm").value
);

let running = false;
let run_die = false;
async function run() {
	running = true;
	const [start, step, done] = pathfind_func(point_start, point_end);

	path_open = [];
	path_closed = [];
	path_final = [];

	start();
	draw_running(tiles, start_end);
	draw_hover(mouse_pos);
	while (!run_die && !done()) {
		step();
		draw_running(tiles, start_end);
		draw_hover(mouse_pos);
		await sleep(SLEEP_TIME);
	}

	if (path_final.length > 0) {
		draw_running(tiles, start_end);
		draw_hover(mouse_pos);
	}

	if (run_die) run_die = false;
	running = false;
}

function main() {
	draw_tiles(tiles);
	draw_tile_arr(start_end, TILE_POINT);
	draw_hover(mouse_pos);
}
main()

// DOM -------------------------------------------------------------------------

function onchange_algorithm(value) {
	pathfind_func = str_to_algorithm(
		document.getElementById("select_algorithm").value
	);
}

function get_mouse_pos(canvas, evt) {
	const rect = canvas.getBoundingClientRect();
	return [evt.clientX - rect.left, evt.clientY - rect.top];
}
canvas.addEventListener("mousemove", evt => {
	mouse_pos = get_mouse_pos(canvas, evt);
	draw_running(tiles, start_end);
	draw_hover(mouse_pos);
});
canvas.addEventListener("mouseenter", _ => { mouse_in_canv = true; });
canvas.addEventListener("mouseleave", _ => { mouse_in_canv = false; });

let click_toggle = false;
function onclick_canvas(_) {
	if (running) return;
	const [mtx, mty] = canv_to_tile(...mouse_pos);
	if (!click_toggle) {
		point_start[0] = mtx;
		point_start[1] = mty;
	} else {
		point_end[0] = mtx;
		point_end[1] = mty;
	}
	click_toggle = !click_toggle;
}
canvas.addEventListener("click", onclick_canvas);

async function onclick_run() {
	if (running) run_die = true;
	while (run_die) await sleep(8 * SLEEP_TIME);
	run();
}
