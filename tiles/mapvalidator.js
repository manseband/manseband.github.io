import { TILE, TILE_DEFS } from "./tiledefs.js";
import { solve } from "./solver.js";


/**
 * Validate a Sokoban map
 * @param {Tilemap} map
 * @returns {object} { ok: boolean, error?: string, shortestPath?: number }
 */
export function validateMap(map) {
	if (!map.hasPlayer())
		return { ok: false, error: "Player missing!" };

	if (map.numBoxes() < 1)
		return { ok: false, error: "No boxes!" };

	if (map.numBoxes() > map.numGoals())
		return { ok: false, error: "More boxes than goals!" };

	if (!isEverythingEnclosed(map))
		return { ok: false, error: "Map is not enclosed by walls!" };

	const conflictCheck = checkConflictingTiles(map);
	if (!conflictCheck.ok) return conflictCheck;

	const result = solve(map);
	if (!result.solvable)
		return { ok: false, error: "This puzzle has no solution." };

	return { ok: true, shortestPath: result.pathLength };
}

function checkConflictingTiles(map) {
	const types = Object.values(TILE);

	for (const type of types) {
		const tiles = map.getTiles(type);
		const blocks = TILE_DEFS[type].blocks;

		for (const { x, y } of tiles) {
			// Iterate over all blocking types other than itself
			// Since types are defined to block themselves, map.has(itself, x, y) will return True
			for (const blockedType of blocks.filter(t => t !== type)) {
				if (map.has(blockedType, x, y)) {
					return { ok: false, error: "Map has conflicting tile placements."};
				}
			}
		}
	}

	// Since boxes are stored as a list of positions, there may be duplicates (two boxes with the same coordinates)
	const seenBoxes = new Set();
	for (const { x, y } of map.getTiles(TILE.BOX)) {
		const key = `${x},${y}`;
		if (seenBoxes.has(key)) {
			return { ok: false, error: "Map has conflicting tile placements." };
		}
		seenBoxes.add(key);
	}

	return { ok: true };
}

function isEverythingEnclosed(map) {
	if (!map.player || !isTileEnclosed(map, map.player.x, map.player.y)) return false;

	for (const box of map.boxes) {
		if (!isTileEnclosed(map, box.x, box.y)) return false;
	}

	for (let x = 0; x < map.width; x++) {
		for (let y = 0; y < map.height; y++) {
			if (map.goals[x][y]) {
				if (!isTileEnclosed(map, x, y)) return false;
			}
		}
	}

	return true;
}

function isTileEnclosed(map, startX, startY) {
	if (!map.inBounds(startX, startY)) return false;

	const w = map.width;
	const h = map.height;
	const visited = Array.from({ length: w }, () => Array(h).fill(false)); // Memoization
	// BFS queue
	const queue = [{ x: startX, y: startY }];
	visited[startX][startY] = true;

	const dirs = [
		{ dx: 0, dy: -1 }, // up
		{ dx: 0, dy: 1 }, // down
		{ dx: -1, dy: 0 }, // left
		{ dx: 1, dy: 0 }, // right
	];

	while (queue.length > 0) {
		const { x, y } = queue.shift();

		// If we can reach a boundary without crossing a wall, it's NOT enclosed
		if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return false;

		for (const { dx, dy } of dirs) {
			const nx = x + dx;
			const ny = y + dy;

			if (!map.inBounds(nx, ny)) continue; // Don't continue past boundary
			if (visited[nx][ny]) continue; // Already visited
			if (map.walls[nx][ny]) continue; // Walls block flood fill

			visited[nx][ny] = true;
			queue.push({ x: nx, y: ny });
		}
	}

	// Flood fill could not escape, object must be enclosed
	return true;
}
