import { Tilemap } from "./tilemap.js";

export class Tilecode {

	/** Encode a Tilemap into a compact code fit for a URL */
    static toMapCode(map) {
		const width = map.width;
		const height = map.height;
		const maxIndex = width * height - 1;
		const W = Tilecode.base36Width(maxIndex);

		// ----- Walls -----
		let wallBits = '';
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				wallBits += map.walls[x][y] ? '1' : '0';
			}
		}
		const wallsStr = BigInt('0b' + wallBits).toString(36);

		// ----- Goals -----
		let goalsStr = '';
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (map.goals[x][y]) {
					goalsStr += Tilecode.encodeFixed36(y * width + x, W);
				}
			}
		}

		// ----- Boxes -----
		const boxesStr = map.boxes
			.map(b => Tilecode.encodeFixed36(b.y * width + b.x, W))
			.join('');

		// ----- Player -----
		const playerStr = map.player
			? Tilecode.encodeFixed36(map.player.y * width + map.player.x, W)
			: '';

		// ----- Header (fixed-width) -----
		const header =
			Tilecode.encodeFixed36(width, 2) +
			Tilecode.encodeFixed36(height, 2) +
			W.toString(36);

		return `${header}-${wallsStr}-${boxesStr}-${goalsStr}-${playerStr}`;
	}

    /** Decode a map code into a Tilemap */
    static fromMapCode(str) {
		const [header, wallsStr, boxesStr, goalsStr, playerStr] = str.split('-');

		const width  = parseInt(header.slice(0, 2), 36);
		const height = parseInt(header.slice(2, 4), 36);
		const W      = parseInt(header[4], 36);
		const map = new Tilemap(width, height);

		// ----- Walls -----
		const wallsBits = Tilecode.base36ToBigInt(wallsStr).toString(2).padStart(width * height, '0');
		let i = 0;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				map.walls[x][y] = wallsBits[i++] === '1';
			}
		}

		// ----- Boxes -----
		for (const pos of Tilecode.decodeFixed36(boxesStr, W)) {
			map.boxes.push({ x: pos % width, y: Math.floor(pos / width) });
		}

		// ----- Goals -----
		for (const pos of Tilecode.decodeFixed36(goalsStr, W)) {
			map.goals[pos % width][Math.floor(pos / width)] = true;
		}

		// ----- Player -----
		if (playerStr) {
			const pos = parseInt(playerStr, 36);
			map.player = { x: pos % width, y: Math.floor(pos / width) };
		}

		return map;
	}

	static base36Width(maxValue) {
		return Math.ceil(Math.log(maxValue + 1) / Math.log(36));
	}

	static encodeFixed36(n, width) {
		return n.toString(36).padStart(width, '0');
	}

	static decodeFixed36(str, width) {
		const out = [];
		for (let i = 0; i < str.length; i += width) {
			out.push(parseInt(str.slice(i, i + width), 36));
		}
		return out;
	}

	static base36ToBigInt(str) {
		let result = 0n;
		for (const char of str) {
			result = result * 36n + BigInt(parseInt(char, 36));
		}
		return result;
	}
}