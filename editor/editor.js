import { CanvasBackground } from "../graphics/canvasbackground.js";
import { TILE } from "../tiles/tiledefs.js";
import { Tilemap } from "../tiles/tilemap.js";
import { Tilecode } from "../tiles/tilecode.js";
import { TileRenderer } from "../graphics/tilerenderer.js";
import { solve } from "../solver/solver.js";

export class Editor {
    constructor(canvas, mapWidth, mapHeight) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
		this.resizeCanvas();

        this.map = new Tilemap(mapWidth, mapHeight);

        this.renderer = new TileRenderer(this.ctx, mapWidth, mapHeight, this.canvas.width, this.canvas.height);

        this.background = new CanvasBackground(this.canvas, this.renderer, this.map, {
            checksPerTileInside: 4,
            checksPerTileOutside: 8,
            color1: "lightgrey",
            color2: "white"
        });

        // State
        this.currentTileType = TILE.WALL; // Default = TILE.WALL
        this.hoveredTile = null;
        this.isPainting = false;
        this.paintMode = "draw"; // "draw" / "erase"

        // Bind event handlers
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleResize = this.handleResize.bind(this);

        this.canvas.addEventListener("mousedown", this.handleMouseDown);
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        window.addEventListener("mouseup", this.handleMouseUp); // User may initiate mouse input inside canvas but release outside, hence window
        window.addEventListener("resize", this.handleResize);

        this.redraw();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.handleMouseDown);
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
        window.removeEventListener("mouseup", this.handleMouseUp);
        window.removeEventListener("resize", this.handleResize);
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

    handleMouseDown(e) {
        const {x, y} = this.getTileCoords(e);

		// Clear ghost tile
        this.hoveredTile = null;
        this.redraw();

        if (e.button === 0) { // Left mouse = draw
            this.isPainting = true;
            this.paintMode = "draw";
            if (this.map.addAt(this.currentTileType, x, y)) this.redraw();
        } else if (e.button === 2) { // RIght mouse = erase
            this.isPainting = true;
            this.paintMode = "erase";
            if (this.map.removeAt(x, y)) this.redraw();
        }
    }

    handleMouseMove(e) {
        const {x, y} = this.getTileCoords(e);

        if (this.isPainting) {
			// Only redraw if these tilemap operations are successful
            if (this.paintMode === "draw" && this.map.addAt(this.currentTileType, x, y)) this.redraw();
            else if (this.paintMode === "erase" && this.map.removeAt(x, y)) this.redraw();
        } else {
            this.tryDrawGhostTile(x, y);
        }
    }

    handleMouseUp() {
        this.isPainting = false;
    }

    getTileCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return this.renderer.worldToTile(e.clientX - rect.left, e.clientY - rect.top);
    }

    tryDrawGhostTile(x, y) {
        let newHover = null;

		// Check if the hovered tile is in bounds and leads to a valid placement
        if (this.map.inBounds(x, y) && this.map.canPlace(this.currentTileType, x, y)) {
            newHover = { x, y };
        }

		// If the hovered tile hasn't changed, don't bother redrawing it
        const changed =
            (this.hoveredTile === null && newHover !== null) ||
            (this.hoveredTile !== null && newHover === null) ||
            (this.hoveredTile && newHover && (this.hoveredTile.x !== newHover.x || this.hoveredTile.y !== newHover.y));

        if (!changed) return;
        this.hoveredTile = newHover;
        this.redraw();
    }

    redraw() {
        this.background.drawToCanvas();
        this.renderer.drawMap(this.map);

        if (this.hoveredTile) {
			// Draw ghost tile
            this.renderer.drawTile(this.currentTileType, this.hoveredTile.x, this.hoveredTile.y, 0.4);
        }
    }

    selectTile(type) {
        this.currentTileType = type;
    }

    tryExport() {
        if (this.isMapValid()) {
            const packed = this.map.normalizedCopy();
            // console.log(packed.toString());
            alert(`Your exported map code: ${Tilecode.toMapCode(packed)}`);
        }
    }

    isMapValid() {
        if (!this.map.hasPlayer()) {
            alert("Player missing!");
            return false;
        }
        if (this.map.numBoxes() < 1) {
            alert("No boxes!");
            return false;
        }
        if (this.map.numBoxes() > this.map.numGoals()) {
            alert("More boxes than goals!");
            return false;
        }
        if (!this.map.isEverythingEnclosed()) {
            alert("Your player, boxes and/or goals are not fully enclosed by walls!");
            return false;
        }
        const result = solve(this.map);
        if (!result.solvable) {
            alert("This puzzle has no solution.");
            return false;
        }
        alert(`Shortest winning path found with length ${result.pathLength}.`);
        return true;
    }
}
