import { loadTileAssets } from "./assets/assetloader.js";
import { Editor } from "./editor/editor.js";

const canvas = document.querySelector(".myCanvas");

// Map size for the editor
const EDITOR_MAP_W = 20;
const EDITOR_MAP_H = 20;

// Load tile images first
loadTileAssets(() => {
    let editor = new Editor(canvas, EDITOR_MAP_W, EDITOR_MAP_H);

    // Setup tilebar buttons
    const buttons = document.querySelectorAll(".tilebar-button");
    buttons.forEach(btn => {
        btn.onclick = () => {
            const tile = btn.dataset.tile;
            editor.selectTile(tile);
        };
    });

	// Setup clear button
	const clearButton = document.getElementById("clearButton");
	clearButton.onclick = () => editor.clearMap();

	// Setup export button
	const exportButton = document.getElementById("exportButton");
	exportButton.onclick = () => editor.tryExport();
});
