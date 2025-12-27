import { CanvasBackground } from "../graphics/canvasbackground.js";
import { TILE } from "../tiles/tiledefs.js";
import { TileRenderer } from "../graphics/tilerenderer.js";

export class Game {
	constructor(canvas, map, shortestPath, moveCounter) {
		this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.resizeCanvas();

        this.map = map;

		this.renderer = new TileRenderer(this.ctx, this.map.width, this.map.height, this.canvas.width, this.canvas.height);

		this.background = new CanvasBackground(this.canvas, this.renderer, this.map, {
			checksPerTileInside: 4,
            checksPerTileOutside: 8,
            color1: "#919fafff",
            color2: "#626b78ff"
        });

		this.moveCounter = moveCounter;
		this.moveCount = 0;
		this.updateMoveCounter();
		this.leastMoves = shortestPath;

		this.handleInput = this.handleInput.bind(this);
        this.handleResize = this.handleResize.bind(this);

        window.addEventListener("keydown", this.handleInput);
        window.addEventListener("resize", this.handleResize);

        this.redraw();
	}

	// Maximize the canvas
	resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

	handleResize() {
        this.resizeCanvas();

        this.renderer = new TileRenderer(this.ctx, this.map.width, this.map.height, this.canvas.width, this.canvas.height);
        this.background.renderer = this.renderer;
        this.background.resizeBackground(this.canvas.width, this.canvas.height);

        this.redraw();
    }

	handleInput(e) {
        if (!this.map.player) return;

        let dx = 0, dy = 0;
   		switch (e.key) {
			case "ArrowUp":    dy = -1; break;
			case "ArrowDown":  dy =  1; break;
			case "ArrowLeft":  dx = -1; break;
			case "ArrowRight": dx =  1; break;
			default:
				return; // Ignore all other keys
		}

		e.preventDefault();

		if (this.tryMove(dx, dy)) {
			this.moveCount++;
			this.updateMoveCounter();
        	this.redraw();

			if (this.map.numBoxesOnGoals() === this.map.numBoxes()) {
			// Delay the pop-up until after the final state is drawn
			setTimeout(() => {
				let message = `Map beat in ${this.moveCount} moves.`;
				if (this.moveCount === this.leastMoves) {
					message += "\nYou made the least possible moves!";
				} else {
					message += `\nLeast possible moves = ${this.leastMoves}!`;
				}
				alert(message);
				window.removeEventListener("keydown", this.handleInput); // Stop listening for input
			}, 0);
        }
		}
	}

	tryMove(dx, dy) {
		const targetX = this.map.player.x + dx;
        const targetY = this.map.player.y + dy;

		// Out of bounds check (shouldn't be possible however since the furthest tile in each direction should be a wall)
		if (!this.map.inBounds(targetX, targetY)) return false;

		// Walls block movement
        if (this.map.has(TILE.WALL, targetX, targetY)) return false;

		// Boxes get pushed
        if (this.map.has(TILE.BOX, targetX, targetY)) {
            const boxTargetX = this.map.player.x + 2 * dx;
            const boxTargetY = this.map.player.y + 2 * dy;

			if (!this.map.inBounds(boxTargetX, boxTargetY)) return false;

			// Can't push box into a wall or another box
            if (this.map.has(TILE.WALL, boxTargetX, boxTargetY) || this.map.has(TILE.BOX, boxTargetX, boxTargetY)) return false;

			// "Remove" the box and "place" it at its next position, essentially moving it
            this.map.removeAt(targetX, targetY);
            this.map.addAt(TILE.BOX, boxTargetX, boxTargetY);
        }

        this.map.player.x = targetX;
        this.map.player.y = targetY;

		return true;
	}

	updateMoveCounter() {
		if (!this.moveCounter) return;
		this.moveCounter.textContent = `${this.moveCount}`;
	}

	redraw() {
        this.background.drawToCanvas();
        this.renderer.drawMap(this.map);
    }

	reset(map, shortestPath) {
        this.destroy();
        return new Game(this.canvas, map, shortestPath, moveCounter);
    }

	destroy() {
        window.removeEventListener("keydown", this.handleInput);
        window.removeEventListener("resize", this.handleResize);
    }
}