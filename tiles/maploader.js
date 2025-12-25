import { fromMapCodeSafe } from "./tilecode.js";
import { validateMap } from "./mapvalidator.js";

export function loadMapFromCode(levelCode) {
    const decoded = fromMapCodeSafe(levelCode);
    if (!decoded.ok) {
        throw new Error(decoded.error);
    }

    const validation = validateMap(decoded.map);
    if (!validation.ok) {
        throw new Error("Invalid map code."); // validation error replaced with generic error message
    }

	// map is decoded + validated
	return {map: decoded.map, shortestPath: validation.shortestPath };
}
