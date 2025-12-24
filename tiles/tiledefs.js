export const TILE = {
    WALL: "wall",
    GOAL: "goal",
    BOX: "box",
    PLAYER: "player",
};

export const TILE_DEFS = {
    [TILE.WALL]: {
		// blocks: [x, y, ...] -> The presence of this tile blocks the placements of x, y, ... tiles
		blocks: [TILE.WALL, TILE.GOAL, TILE.BOX, TILE.PLAYER],
		img_path: "./assets/wall.png", // Absolute path from root
		img: null, // Actual Image object for drawing, overridden during asset loading
    },
    [TILE.GOAL]: {
		blocks: [TILE.WALL, TILE.GOAL],
        img_path: "./assets/goal.png",
		img: null,
    },
    [TILE.BOX]: {
        blocks: [TILE.WALL, TILE.BOX, TILE.PLAYER],
        img_path: "./assets/box.png",
		img: null,
    },
    [TILE.PLAYER]: {
		blocks: [TILE.WALL, TILE.BOX, TILE.PLAYER],
        img_path: "./assets/player.png",
		img: null,
    },
};
