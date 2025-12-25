import { fromMapCodeSafe } from "../tiles/tilecode.js";
import { validateMap } from "../tiles/mapvalidator.js";

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
	const levelCode = levelInput.value.trim();
	if (!levelCode) {
		alert("Please enter a level code.");
		return;
	}

	const decoded = fromMapCodeSafe(levelCode);
    if (!decoded.ok) {
		alert(decoded.error);
        return;
    }

	const validation = validateMap(decoded.map); // I get shortest path from here, can pass to game!
    if (!validation.ok) {
		alert(validation.error);
		// alert("Map is invalid.");
        return;
    }

	window.location.href = `play.html?level=${encodeURIComponent(levelCode)}`;
};

// Optional: press Enter to load
levelInput.addEventListener("keydown", e => {
  	if (e.key === "Enter") loadBtn.onclick();
});
