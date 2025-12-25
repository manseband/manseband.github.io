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

        if (this.goals[x][y]) { this.goals[x][y] = false; return true; }
        if (this.walls[x][y]) { this.walls[x][y] = false; return true; }
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
		return this.getTiles(TILE.GOAL).length;
	}

	numBoxesOnGoals() {
		let count = 0;
		for (const box of this.boxes) {
			if (this.has(TILE.GOAL, box.x, box.y)) count++;
		}
		return count;
	}

	/**
	 * Note: Top-left-most tile of tilemap must be wall or empty. This should be run after
	 * isPlayerEnclosed() and solver to guarantee this.
	 * @returns A new tilemap whose tile positions have been shifted to begin at (0, 0)
	 */
	normalizedCopy() {
		const allTiles = this.getTiles(TILE.WALL);
		if (!allTiles.length) return this.clone();

		const minX = Math.min(...allTiles.map(t => t.x));
		const minY = Math.min(...allTiles.map(t => t.y));
		const maxX = Math.max(...allTiles.map(t => t.x));
		const maxY = Math.max(...allTiles.map(t => t.y));

		const out = new Tilemap(maxX - minX + 1, maxY - minY + 1);

		for (const { x, y } of this.getTiles(TILE.WALL)) out.walls[x - minX][y - minY] = true;
		for (const { x, y } of this.getTiles(TILE.GOAL)) out.goals[x - minX][y - minY] = true;
		for (const { x, y } of this.getTiles(TILE.BOX)) out.boxes.push({ x: x - minX, y: y - minY });
		if (this.player) out.player = { x: this.player.x - minX, y: this.player.y - minY };

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
		const rows = [];
		for (let y = 0; y < this.height; y++) {
			let row = '';
			for (let x = 0; x < this.width; x++) {
				if (this.has(TILE.PLAYER, x, y)) row += 'P';
				else if (this.has(TILE.BOX, x, y)) row += 'B';
				else if (this.has(TILE.WALL, x, y)) row += '#';
				else if (this.has(TILE.GOAL, x, y)) row += '.';
				else row += ' ';
			}
			rows.push(row);
		}
		return rows.join('\n');
	}
}
