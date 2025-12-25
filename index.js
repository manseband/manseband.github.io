import { loadMapFromCode } from "./tiles/maploader.js";

const playBtn = document.getElementById("playBtn");
const buildBtn = document.getElementById("buildBtn");
const playInput = document.getElementById("playInput");
const loadBtn = document.getElementById("loadBtn");
const levelInput = document.getElementById("levelInput");

playBtn.onclick = () => {
  	playInput.classList.toggle("hidden");
  	levelInput.focus();
};

buildBtn.onclick = () => {
  	window.location.href = "edit.html";
};

loadBtn.onclick = () => {
	const mapCode = levelInput.value.trim(); // Trim whitespace
	if (!mapCode) {
		alert("Please enter a map code.");
		return;
	}

	// Try to load the map, but don't save it yet - this will be done on the next page (this is purely for early error handling)
	try {
		loadMapFromCode(mapCode);
	} catch (err) {
		alert(err.message);
		return;
	}

	window.location.href = `play.html?map=${encodeURIComponent(mapCode)}`;
};

// Optional: press Enter to load
levelInput.addEventListener("keydown", e => {
  	if (e.key === "Enter") loadBtn.onclick();
});
