import { Tilemap } from "./tilemap.js";

// Encode a Tilemap into a compact code fit for a URL
export function toMapCode(map) {
	const width = map.width;
	const height = map.height;
	const maxIndex = width * height - 1;
	const W = base36Width(maxIndex);

	let wallBits = '';
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			wallBits += map.walls[x][y] ? '1' : '0';
		}
	}
	const wallsStr = BigInt('0b' + wallBits).toString(36);

	let goalsStr = '';
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (map.goals[x][y]) {
				goalsStr += encodeFixed36(y * width + x, W);
			}
		}
	}

	const boxesStr = map.boxes.map(b => encodeFixed36(b.y * width + b.x, W)).join('');
	const playerStr = map.player ? encodeFixed36(map.player.y * width + map.player.x, W): '';

	// Width + height both encoded as 2 digits each
	const header = encodeFixed36(width, 2) + encodeFixed36(height, 2) + W.toString(36);

	return `${header}-${wallsStr}-${boxesStr}-${goalsStr}-${playerStr}`;
}

// Wrapper that safely decodes a map code
export function fromMapCodeSafe(str) {
	try {
		const map = fromMapCode(str);
		return { ok: true, map };
	} catch (e) {
		return { ok: false, error: "Malformed map code." };
	}
}

// Decode a map code into a Tilemap
function fromMapCode(str) {
	const [header, wallsStr, boxesStr, goalsStr, playerStr] = str.split('-');

	const width  = parseInt(header.slice(0, 2), 36);
	const height = parseInt(header.slice(2, 4), 36);
	const W      = parseInt(header[4], 36);
	const map = new Tilemap(width, height);

	const wallsBits = base36ToBigInt(wallsStr).toString(2).padStart(width * height, '0');
	let i = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			map.walls[x][y] = wallsBits[i++] === '1';
		}
	}

	for (const pos of decodeFixed36(boxesStr, W)) {
		map.boxes.push({ x: pos % width, y: Math.floor(pos / width) });
	}

	for (const pos of decodeFixed36(goalsStr, W)) {
		map.goals[pos % width][Math.floor(pos / width)] = true;
	}

	if (playerStr) {
		const pos = parseInt(playerStr, 36);
		map.player = { x: pos % width, y: Math.floor(pos / width) };
	}

	return map;
}

function base36Width(maxValue) {
	return Math.ceil(Math.log(maxValue + 1) / Math.log(36));
}

function encodeFixed36(n, width) {
	return n.toString(36).padStart(width, '0');
}

function decodeFixed36(str, width) {
	const out = [];
	for (let i = 0; i < str.length; i += width) {
		out.push(parseInt(str.slice(i, i + width), 36));
	}
	return out;
}

function base36ToBigInt(str) {
	let result = 0n;
	for (const char of str) {
		result = result * 36n + BigInt(parseInt(char, 36));
	}
	return result;
}