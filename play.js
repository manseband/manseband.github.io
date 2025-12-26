import { loadTileAssets } from "./assets/assetloader.js";
import { Game } from "./game/game.js";
import { loadMapFromCode } from "./tiles/maploader.js";

const canvas = document.querySelector(".myCanvas");

// URL format: site.com/?level={mapCode}
const params = new URLSearchParams(window.location.search);
const mapCode = params.get("map"); // This will return String

// Pre-made map codes:
// 0d0c2-ey7pkmnohyprry0ov5ok6qr5lpjby8-1k0s101o-181a2b2d-19  <- Heart
// 0e0c2-2s2l5zhrys75hkyb3p9xf6gm2uihyexo8-37363e3f-3a3c4045-3p <- Gormless freak
// 07082-9a91bzh5f3y-0o0u120w-0f0j171b-0v
// 07082-9a91bzh5f3y-0o0u120w-0f0j171b-0a <- Same as above more different player start
// 07072-5h8ovztj3z-0v0w0h0u-080m1014-0p <- Penicular
// 07092-1w6f0msx7s7zw-0n1118-0q0w0x-0u
// 08082-xc9ckssmqiik-0z0y0j-0k0t10-0r
// 080b2-12nrmkd45wu9g7jwhq-0k1w10-0z171f-24
// 080b2-9jvpglncz6yw3cgn2-0k1w10-0z171f-24 <- Above but more moves
// 080b2-9jvpgloiklae9znem-0k1w10-171f1i-24 <- Above but even more moves
// 08092-qvnoxnmfytg1tq-0y0q0s0t-16171e1f-0a <- David W. Skinner

if (!mapCode) {
    alert("No map code provided!");
	throw new Error("Missing map code.");
}

loadTileAssets(() => {
	let map;
	let shortestPath;

	// Load map safely and pass it to the Game constructor
	// This error handling must be done here as well in the case that the user directly accesses a map through the URL
	try {
		const result = loadMapFromCode(mapCode);
		map = result.map;
		shortestPath = result.shortestPath;
	} catch (err) {
		alert(err.message);
		console.error(err);
		return;
	}

	// Instantiate the game with a clone of the map, so that the original can be used to reset it
	let game = new Game(canvas, map.clone(), shortestPath);

	// Setup reset button
	const resetButton = document.getElementById("resetButton");
	resetButton.onclick = () => game = game.reset(map.clone(), shortestPath);

	// Fade out overlay
	const overlay = document.getElementById("fadeOverlay");
	requestAnimationFrame(() => {
		overlay.classList.add("hidden");
	});
});
