import { TILE } from "./tiledefs.js";

// TODO remove all superfluous comments
export class SokobanSolver {
    constructor(tilemap) {
        this.tilemap = tilemap;
        this.width = tilemap.width;
        this.height = tilemap.height;

        // Precompute dead squares (squares where a box can never be pushed out)
        this.deadSquares = this.computeDeadSquares();
    }

    /**
     * Checks if the puzzle is solvable
     * @returns {boolean} true if solvable, false otherwise
     */
    isSolvable() {
        const result = this.solve();
        return result.solvable;
    }

    /**
     * Solves the puzzle and returns solvability and path length
     * @returns {{solvable: boolean, pathLength: number|null}}
     *          solvable: true if puzzle can be solved
     *          pathLength: number of moves in shortest solution, or null if unsolvable
     */
    solve() {
        // Basic validation
        if (!this.tilemap.hasPlayer() ||
			this.tilemap.numBoxes() === 0 ||
			this.tilemap.numBoxes() !== this.tilemap.numGoals()) {
			return { solvable: false, pathLength: null };
		}

        // Check if any box is already on a dead square
        for (const box of this.tilemap.getTiles(TILE.BOX)) {
			if (this.deadSquares[box.x][box.y]) return { solvable: false, pathLength: null };
		}

        // BFS search
        const visited = new Set();
        const queue = [{
            playerX: this.tilemap.player.x,
            playerY: this.tilemap.player.y,
            boxes: [...this.tilemap.boxes].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x),
            depth: 0
        }];

        visited.add(this.hashState(queue[0]));

        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];

		while (queue.length > 0) {
			const state = queue.shift();

			// Check if won
			if (this.isWinState(state.boxes)) return { solvable: true, pathLength: state.depth };

			// Try all moves
			for (const { dx, dy } of directions) {
				for (const newState of this.tryMove(state, dx, dy)) {
					const hash = this.hashState(newState);
					if (!visited.has(hash)) {
						visited.add(hash);
						newState.depth = state.depth + 1;
						queue.push(newState);
					}
				}
			}
		}

        return { solvable: false, pathLength: null };
    }

    /**
     * Try to move the player in a direction, handling box pushing
     */
    tryMove(state, dx, dy) {
        const newX = state.playerX + dx;
        const newY = state.playerY + dy;

		// Move is invalid if it is out of bounds or inside a wall
		if (!this.tilemap.inBounds(newX, newY) || this.tilemap.has(TILE.WALL, newX, newY)) return [];

        // Check if there's a box
        const boxIndex = state.boxes.findIndex(b => b.x === newX && b.y === newY);

		// No box, simple move
		if (boxIndex === -1) return [{ playerX: newX, playerY: newY, boxes: state.boxes }];

        // If there's a box, try to push it
        const boxNewX = newX + dx;
        const boxNewY = newY + dy;

        // Check if box can be pushed
        if (!this.tilemap.inBounds(boxNewX, boxNewY)) return [];
        if (this.tilemap.walls[boxNewX][boxNewY]) return [];
        if (state.boxes.some(b => b.x === boxNewX && b.y === boxNewY)) return [];

        // Check if pushing box to a dead square
        if (this.deadSquares[boxNewX][boxNewY]) return [];

        // Valid push
        const newBoxes = state.boxes.map((b, i) =>
            i === boxIndex ? { x: boxNewX, y: boxNewY } : b
        ).sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

        return [{ playerX: newX, playerY: newY, boxes: newBoxes }];
    }

    /**
     * Check if all boxes are on goals
     */
    isWinState(boxes) {
        return boxes.every(b => this.tilemap.has(TILE.GOAL, b.x, b.y));
    }

    /**
     * Create a hash string for a state
     */
    hashState(state) {
        const boxStr = state.boxes.map(b => `${b.x},${b.y}`).join(';');
        return `${state.playerX},${state.playerY}|${boxStr}`;
    }

    /**
     * Compute dead squares where boxes can never be moved off
     */
    computeDeadSquares() {
        const dead = Array.from({ length: this.width }, () => Array(this.height).fill(false));

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                // Walls and goals are not dead squares
                if (this.tilemap.has(TILE.WALL, x, y) || this.tilemap.has(TILE.GOAL, x, y)) continue;

                // Check if box in this square can never reach a goal
                if (this.isDeadSquare(x, y)) dead[x][y] = true;
            }
        }

        return dead;
    }

    /**
     * Check if a square is a dead square (simple corner detection)
     */
    isDeadSquare(x, y) {
        // If it's a goal, it's not dead
        if (this.tilemap.has(TILE.GOAL, x, y)) return false;

        // Check for corner deadlocks
        const up = y === 0 || this.tilemap.has(TILE.WALL, x, y - 1);
		const down = y === this.height - 1 || this.tilemap.has(TILE.WALL, x, y + 1);
		const left = x === 0 || this.tilemap.has(TILE.WALL, x - 1, y);
		const right = x === this.width - 1 || this.tilemap.has(TILE.WALL, x + 1, y);

        // Corner cases: if blocked on two adjacent sides, it's dead
        if ((up && left) || (up && right) || (down && left) || (down && right)) {
            return true;
        }

        return false;
    }
}

/**
 * Convenience function to check if a tilemap is solvable
 * @param {Tilemap} tilemap - The tilemap to check
 * @returns {boolean} true if solvable, false otherwise
 */
export function isSolvable(tilemap) {
    const solver = new SokobanSolver(tilemap);
    return solver.isSolvable();
}

/**
 * Convenience function to solve a tilemap and get path length
 * @param {Tilemap} tilemap - The tilemap to solve
 * @returns {{solvable: boolean, pathLength: number|null}}
 */
export function solve(tilemap) {
    const solver = new SokobanSolver(tilemap);
    return solver.solve();
}