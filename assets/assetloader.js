import { TILE_DEFS } from "../tiles/tiledefs.js";

const fallbackImg = new Image();
fallbackImg.src = "./assets/error.png"; // Fallback image

export function loadTileAssets(onComplete) {
    let assetsLoaded = 0;
    const entries = Object.entries(TILE_DEFS);
    const totalAssets = entries.length;

    function onAssetResolved() {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
			console.log("All tile assets loaded!");
            onComplete();
        }
    }

    for (const [tileName, def] of entries) {
        const path = def.img_path;

        if (typeof path !== "string") {
			// Use the fallback image if the canonical path is invalid
            console.warn(`Tile ${tileName} has invalid img_path, using fallback`);
            def.img = fallbackImg;
            onAssetResolved();
            continue;
        }

        const img = new Image();
        img.src = path;
        img.onload = () => {
            def.img = img;
            onAssetResolved();
        };

        img.onerror = () => {
			// Use the fallback image if the image given by the canonical path could not be loaded
            console.warn(`Failed to load ${path} for tile ${tileName}, using fallback`);
            def.img = fallbackImg;
            onAssetResolved();
        };
    }
}

