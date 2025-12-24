export class CanvasBackground {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {TileRenderer} renderer
     * @param {Tilemap} map
     * @param {object} options
     *        options.checksPerTileInside = number of checks per tile inside map
     *        options.checksPerTileOutside = number of checks per tile outside map
     *        options.color1 = first checker color
     *        options.color2 = second checker color
     */
    constructor(canvas, renderer, map, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.renderer = renderer;
        this.map = map;

        this.checksPerTileInside = options.checksPerTileInside || 4;
        this.checksPerTileOutside = options.checksPerTileOutside || 8;
        this.color1 = options.color1 || "lightgrey";
        this.color2 = options.color2 || "white";

		// Background canvas is static and only needs to be recalculated when the window updates
        this.bgCanvas = document.createElement("canvas");
        this.bgCtx = this.bgCanvas.getContext("2d");
        this.resizeBackground(canvas.width, canvas.height);

		this.canvas.addEventListener("contextmenu", e => e.preventDefault()); // Disable context menu
    }

    resizeBackground(width, height) {
        this.bgCanvas.width = width;
        this.bgCanvas.height = height;
        this.update();
    }

	update() {
		const tile = this.renderer.tileSize;
		const startX = this.renderer.offsetX;
		const startY = this.renderer.offsetY;

		const insideCheck  = tile / this.checksPerTileInside;
		const outsideCheck = tile / this.checksPerTileOutside;

		this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

		// Outside game area
		const worldChecksX = Math.ceil(this.renderer.worldWidth  / outsideCheck);
		const worldChecksY = Math.ceil(this.renderer.worldHeight / outsideCheck);

		for (let cy = 0; cy < worldChecksY; cy++) {
			for (let cx = 0; cx < worldChecksX; cx++) {

				const px = cx * outsideCheck;
				const py = cy * outsideCheck;

				this.bgCtx.fillStyle = (cx + cy) % 2 === 0 ? this.color1 : this.color2;
				this.bgCtx.fillRect(px, py, outsideCheck, outsideCheck);
			}
		}

		// Inside game area (drawn on top)
		for (let ty = 0; ty < this.map.height; ty++) {
			for (let tx = 0; tx < this.map.width; tx++) {

				for (let sy = 0; sy < this.checksPerTileInside; sy++) {
					for (let sx = 0; sx < this.checksPerTileInside; sx++) {

						const checkX = tx * this.checksPerTileInside + sx;
						const checkY = ty * this.checksPerTileInside + sy;

						const px = startX + tx * tile + sx * insideCheck;
						const py = startY + ty * tile + sy * insideCheck;

						this.bgCtx.fillStyle = (checkX + checkY) % 2 === 0 ? this.color1 : this.color2;
						this.bgCtx.fillRect(px, py, insideCheck, insideCheck);
					}
				}
			}
		}
	}

    drawToCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.bgCanvas, 0, 0);
    }
}
