import { TILE, TILE_DEFS } from "./tiledefs.js";

export class Tilemap {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.walls = Array.from({ length: width }, () => Array(height).fill(false));
        this.goals = Array.from({ length: width }, () => Array(height).fill(false));
        this.boxes = [];   // Array of {x, y}
        this.player = null; // {x, y}
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    /** Core rule engine */
    canPlace(type, x, y) {
        if (!this.inBounds(x, y)) return false;

        const rules = TILE_DEFS[type];
        if (!rules) return false;

		// Check if the tile shares a square with another tile that blocks it
        for (const blocked of rules.blocks) {
            if (this.has(blocked, x, y)) return false;
        }
        return true;
    }

	// TODO use this function more frequently where it can be used!
    has(type, x, y) {
        switch (type) {
            case TILE.WALL:   return this.walls[x][y];
            case TILE.GOAL:   return this.goals[x][y];
            case TILE.BOX:    return this.boxes.some(b => b.x === x && b.y === y);
            case TILE.PLAYER: return this.player && this.player.x === x && this.player.y === y;
        }
        return false;
    }

    addAt(type, x, y) {
        if (!this.canPlace(type, x, y)) return false;

        switch (type) {
            case TILE.WALL:   this.walls[x][y] = true; break;
            case TILE.GOAL:   this.goals[x][y] = true; break;
            case TILE.BOX:    this.boxes.push({ x, y }); break;
            case TILE.PLAYER: this.player = { x, y }; break;
        }
        return true;
    }

    removeAt(x, y) {
		// Player is highest priority removal, if it shares a square with another tile it will be removed first
        if (this.player && this.player.x === x && this.player.y === y) {
            this.player = null;
            return true;
        }

        const bi = this.boxes.findIndex(b => b.x === x && b.y === y);
        if (bi !== -1) {
            this.boxes.splice(bi, 1);
            return true;
        }

        if (this.walls[x][y]) { this.walls[x][y] = false; return true; }
        if (this.goals[x][y]) { this.goals[x][y] = false; return true; }
    }

	// Return a non-null array of all tiles of this type
	getTiles(type) {
		switch(type) {
			case TILE.WALL:
			case TILE.GOAL: {
				const layer = type === TILE.WALL ? this.walls : this.goals;
				const tiles = [];
				for (let x = 0; x < this.width; x++) {
					for (let y = 0; y < this.height; y++) {
						if (layer[x][y]) tiles.push({x, y});
					}
				}
				return tiles;
			}
			case TILE.BOX:
				return this.boxes;
			case TILE.PLAYER:
				return this.player ? [this.player] : [];
		}
		return [];
	}

	hasPlayer() {
		return this.player != null;
	}

	numBoxes() {
		return this.boxes.length;
	}

	numGoals() {
		let numGoals = 0;
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				if (this.goals[x][y]) numGoals++;
			}
		}
		return numGoals;
	}

	numBoxesOnGoals() {
		let count = 0;
		for (const box of this.boxes) {
			if (this.goals[box.x][box.y]) count++;
		}
		return count;
	}

	isTileEnclosed(startX, startY) {
		if (!this.inBounds(startX, startY)) return false;

		const w = this.width;
		const h = this.height;
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

				if (!this.inBounds(nx, ny)) continue; // Don't continue past boundary
				if (visited[nx][ny]) continue; // Already visited
				if (this.walls[nx][ny]) continue; // Walls block flood fill

				visited[nx][ny] = true;
				queue.push({ x: nx, y: ny });
			}
		}

		// Flood fill could not escape, object must be enclosed
		return true;
	}

	isEverythingEnclosed() {
		if (!this.player || !this.isTileEnclosed(this.player.x, this.player.y)) return false;

		for (const box of this.boxes) {
			if (!this.isTileEnclosed(box.x, box.y)) return false;
		}

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				if (this.goals[x][y]) {
					if (!this.isTileEnclosed(x, y)) return false;
				}
			}
		}

		return true;
	}

	/**
	 * Note: Top-left-most tile of tilemap must be wall or empty. This should be run after
	 * isPlayerEnclosed() and solver to guarantee this.
	 * @returns A new tilemap whose tile positions have been shifted to begin at (0, 0)
	 */
	normalizedCopy() {
		let minX = Infinity, minY = Infinity;
		let maxX = -Infinity, maxY = -Infinity;

		// ----- Find wall bounds -----
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				if (this.walls[x][y]) {
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x > maxX) maxX = x;
					if (y > maxY) maxY = y;
				}
			}
		}

		// Safety: no walls → return original copy
		if (minX === Infinity) {
			return this.clone();
		}

		const newWidth  = maxX - minX + 1;
		const newHeight = maxY - minY + 1;

		const out = new Tilemap(newWidth, newHeight);

		// ----- Copy walls -----
		for (let x = minX; x <= maxX; x++) {
			for (let y = minY; y <= maxY; y++) {
				if (this.walls[x][y]) {
					out.walls[x - minX][y - minY] = true;
				}
			}
		}

		// ----- Copy goals -----
		for (let x = minX; x <= maxX; x++) {
			for (let y = minY; y <= maxY; y++) {
				if (this.goals[x][y]) {
					out.goals[x - minX][y - minY] = true;
				}
			}
		}

		// ----- Copy boxes -----
		for (const b of this.boxes) {
			out.boxes.push({
				x: b.x - minX,
				y: b.y - minY
			});
		}

		// ----- Copy player -----
		if (this.player) {
			out.player = {
				x: this.player.x - minX,
				y: this.player.y - minY
			};
		}

		return out;
	}

	/** Returns a copy of the tilemap */
	clone() {
		const copy = new Tilemap(this.width, this.height);

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				copy.walls[x][y] = this.walls[x][y];
				copy.goals[x][y] = this.goals[x][y];
			}
		}

		copy.boxes = this.boxes.map(b => ({ ...b }));
		copy.player = this.player ? { ...this.player } : null;

		return copy;
	}

	/** Returns a human-readable string representation of the tilemap */
    toString() {
        let rows = [];
        for (let y = 0; y < this.height; y++) {
            let row = '';
            for (let x = 0; x < this.width; x++) {
                if (this.player && this.player.x === x && this.player.y === y) row += 'P';
                else if (this.boxes.some(b => b.x === x && b.y === y)) row += 'B';
                else if (this.walls[x][y]) row += '#';
                else if (this.goals[x][y]) row += '.';
                else row += ' ';
            }
            rows.push(row);
        }
        return rows.join('\n');
    }
}
