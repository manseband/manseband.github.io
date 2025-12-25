import { loadTileAssets } from "./assets/assetloader.js";
import { Game } from "./game/game.js";

const canvas = document.querySelector(".myCanvas");

// URL format: site.com/?level=<tilemap code>
const params = new URLSearchParams(window.location.search);
const levelCode = params.get("level"); // This will return String

// Pre-made level codes:
// 0d0c2-ey7pkmnohyprry0ov5ok6qr5lpjby8-1k0s101o-181a2b2d-19  <- Heart
// 0e0c2-2s2l5zhrys75hkyb3p9xf6gm2uihyexo8-37363e3f-3a3c4045-3p <- Gormless freak
// 07082-9a91bzh5f3y-0o0u120w-0f0j171b-0v
// 07082-9a91bzh5f3y-0o0u120w-0f0j171b-0a <- Same as above more different player start
// 07072-5h8ovztj3z-0v0w0h0u-080m1014-0p <- Penicular
// 07092-1w6f0msx7s7zw-0n1118-0q0w0x-0u
// 08082-xc9ckssmqiik-0z0y0j-0k0t10-0r

if (!levelCode) {
    alert("No level code provided!");
	throw new Error("Missing level code");
}

// TODO problem: can still inject invalid levels directly into the play.html page URL!
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
        alert("Malformed level code.");
		console.error(err);
    }
});
