import { loadTileAssets } from "./assets/assetloader.js";
import { Game } from "./game/game.js";

const canvas = document.querySelector(".myCanvas");

// URL format: site.com/?level=<tilemap code>
const params = new URLSearchParams(window.location.search);
const levelCode = params.get("level"); // This will return String

// Pre-made level codes:
// 0d0c2-ey7pkmnohyprry0ov5ok6qr5lpjby8-1k0s101o-181a2b2d-19
// 0e0c2-2s2l5zhrys75hkyb3p9xf6gm2uihyexo8-37363e3f-3a3c4045-3p

if (!levelCode) {
    alert("No level code provided!");
	throw new Error("Missing level code");
}

loadTileAssets(() => {
    try {
        let game = new Game(canvas, levelCode);

		// Fade out overlay
		const overlay = document.getElementById("fadeOverlay");
        requestAnimationFrame(() => {
            overlay.classList.add("hidden");
        });

		// Setup reset button
		const resetButton = document.getElementById("resetButton");
		resetButton.onclick = () => game = game.reset(levelCode);
    } catch (err) {
        alert("Malformed level code");
		console.error(err);
    }
});
