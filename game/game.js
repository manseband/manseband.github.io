import { CanvasBackground } from "../graphics/canvasbackground.js";
import { TILE } from "../tiles/tiledefs.js";
import { TileRenderer } from "../graphics/tilerenderer.js";

export class Game {
	constructor(canvas, map, shortestPath) {
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

		this.moveCount = 0;
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
        if (e.key === "ArrowUp") dy = -1;
        if (e.key === "ArrowDown") dy = 1;
        if (e.key === "ArrowLeft") dx = -1;
        if (e.key === "ArrowRight") dx = 1;

        const targetX = this.map.player.x + dx;
        const targetY = this.map.player.y + dy;

		// Out of bounds check (shouldn't be possible however since the furthest tile in each direction should be a wall)
		if (!this.map.inBounds(targetX, targetY));

		// Walls block movement
        if (this.map.has(TILE.WALL, targetX, targetY)) return;

		// Boxes get pushed
        if (this.map.has(TILE.BOX, targetX, targetY)) {
            const boxTargetX = this.map.player.x + 2 * dx;
            const boxTargetY = this.map.player.y + 2 * dy;

			// Can't push box into a wall or another box
            if (this.map.has(TILE.WALL, boxTargetX, boxTargetY) || this.map.has(TILE.BOX, boxTargetX, boxTargetY)) return;

			// "Remove" the box and "place" it at its next position, essentially moving it
            this.map.removeAt(targetX, targetY);
            this.map.addAt(TILE.BOX, boxTargetX, boxTargetY);
        }

        this.map.player.x = targetX;
        this.map.player.y = targetY;

		this.moveCount++;

        this.redraw();

        if (this.map.numBoxesOnGoals() === this.map.numBoxes()) {
			// Delay the pop-up until after the final state is drawn
			setTimeout(() => {
				alert(`Map beat in ${this.moveCount} moves!\nLeast possible moves = ${this.leastMoves}.`);

				window.removeEventListener("keydown", this.handleInput); // Stop listening for input
			}, 0);
        }
	}

	redraw() {
        this.background.drawToCanvas();
        this.renderer.drawMap(this.map);
    }

	reset(map, shortestPath) {
        this.destroy();
        return new Game(this.canvas, map, shortestPath);
    }

	destroy() {
        window.removeEventListener("keydown", this.handleInput);
        window.removeEventListener("resize", this.handleResize);
    }
}