import { TILE, TILE_DEFS } from "../tiles/tiledefs.js";

export class TileRenderer {

	// TODO change this from tiles to pixels, maybe a ratio of game length to min padding length
	static MIN_PADDING_TILES = 2;

    constructor(ctx, mapWidth, mapHeight, canvasWidth, canvasHeight) {
        this.ctx = ctx;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        const pad = TileRenderer.MIN_PADDING_TILES;

        const tileFromHeight = canvasHeight / (mapHeight + pad * 2);
        const tileFromWidth = canvasWidth / (mapWidth + pad * 2);

        this.tileSize = Math.min(tileFromHeight, tileFromWidth);

        const mapPxW = mapWidth * this.tileSize;
        const mapPxH = mapHeight * this.tileSize;

        this.offsetX = Math.floor((canvasWidth - mapPxW) / 2);
        this.offsetY = Math.floor((canvasHeight - mapPxH) / 2);

        this.worldWidth  = canvasWidth;
        this.worldHeight = canvasHeight;
    }

    tileToWorld(x, y) {
        return {
            x: this.offsetX + x * this.tileSize,
            y: this.offsetY + y * this.tileSize
        };
    }

	worldToTile(worldX, worldY) {
        return {
            x: Math.floor((worldX - this.offsetX) / this.tileSize),
            y: Math.floor((worldY - this.offsetY) / this.tileSize)
        };
    }

    drawTile(type, x, y, opacity = 1) {
		// Get the associated image with the tile from tile defs
        const def = TILE_DEFS[type];
        if (!def?.img) return;

        const { x: worldX, y: worldY } = this.tileToWorld(x, y);

        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.drawImage(def.img, worldX, worldY, this.tileSize, this.tileSize);
        this.ctx.restore();
    }

    drawMap(map) {
		// Loop through all TILE types and draw them (drawing order dictated by order of appearance in tiledefs/TILE)
		// TODO if a box is on a goal, draw using a different sprite to show this!
        for (const type of Object.values(TILE)) {
            for (const tile of map.getTiles(type)) {
                this.drawTile(type, tile.x, tile.y);
            }
        }
    }
}
