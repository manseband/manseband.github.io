import { loadTileAssets } from "./assets/assetloader.js";
import { Game } from "./game/game.js";
import { loadMapFromCode } from "./tiles/maploader.js";

const canvas = document.querySelector(".myCanvas");

// URL format: site.com/?level={mapCode}
const params = new URLSearchParams(window.location.search);
const mapCode = params.get("map"); // This will return String

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

	// Pass this element to the Game so it can "see" it
	const moveCounter = document.getElementById("moveCounter");

	// Instantiate the game with a clone of the map, so that the original can be used to reset it
	let game = new Game(canvas, map.clone(), shortestPath, moveCounter);

	// Setup reset button
	const resetButton = document.getElementById("resetButton");
	resetButton.onclick = () => game = game.reset(map.clone(), shortestPath, moveCounter);

	// Fade out overlay
	const overlay = document.getElementById("fadeOverlay");
	requestAnimationFrame(() => {
		overlay.classList.add("hidden");
	});
});
