import { shuffle, coinFlip } from '../cool/cool.js';

/**
 * pattern creator factory
 * @return {Object} { getPattern }
 */
export function createPatternMaker() {

	const corners = [
		{ x: 1, y: 1 }, // up left
		{ x: 1, y: 2 }, // down left
		{ x: 2, y: 1 }, // up right
		{ x: 2, y: 2 }, // down right
	];

	const directions = [
		{ x: 0,  y: -1 }, // up
		{ x: 1,  y: -1 }, // up right
		{ x: 1,  y: 0  }, // right
		{ x: 1,  y: 1  }, // down right
		{ x: 0,  y: 1  }, // down
		{ x: -1, y: 1  }, // down left
		{ x: -1, y: 0  }, // left
		{ x: -1, y: -1 }, // up left
	];

	let dirIndexes = Array.from({ length: directions.length }, (_, i) => i);
	let directionIndex = 0;
	let pattern = [];

	function getPoints(cornerIndex, x, y) {
		let bX = x * 3;
		let bY = y * 3;
		let corner = corners[cornerIndex];
		let d = directions[dirIndexes[directionIndex++]];

		// no pointing inside
		if (cornerIndex === 0 && d.x > 0 && d.y > 0) return;
		if (cornerIndex === 1 && d.x < 0 && d.y > 0) return;
		if (cornerIndex === 2 && d.x > 0 && d.y < 0) return;
		if (cornerIndex === 3 && d.x < 0 && d.y < 0) return;

		// console.log(cornerIndex, x, y, corner.x, corner.y, d.x, d.y);
		const points = [
			[x + corner.x, y + corner.y],
			[x + corner.x + d.x, y + corner.y + d.y],
		].sort();

		// console.log('~', JSON.stringify(points));

		const isDuplicate = pattern.some(d => {
			// console.log('in data', JSON.stringify(d))
			return JSON.stringify(d) === JSON.stringify(points);
		});
		if (isDuplicate) return;

		pattern.push(points);
	}

	/**
	 * get the pattern
	 * @param  {number} levelCount
	 * @return {Array} pattern[lines[points[xy]]]
	 */
	function getPattern(levelCount) {

		let cols = 1;
		let rows = 1;
		let cornerCount = 2;

		if (levelCount === 0) {
			// cols = 3;
		} else if (levelCount < 4) {
			cornerCount = 3;
			cols = levelCount;
		} else {
			cornerCount = 4;
			cols = levelCount - 3;
		}

		pattern = [];

		let ox = 0; // random offset
		for (let x = 0; x < cols; x++) {
			for (let y = 0; y < rows; y++) {
				directionIndex = 0;
				dirIndexes = shuffle(dirIndexes);
				for (let i = 0; i < cornerCount; i++) {
					getPoints(i, x + ox, y);
					if (levelCount < 1 || coinFlip()) {
						getPoints(i, x + ox, y);
					}
				}
				if (coinFlip() && levelCount > 0) ox++;
			}
		}

		// duplicate pattern on first level or simple pattern
		// console.log({levelCount, pattern})

		if (levelCount === 0 || pattern.length <= 3) {
			const bounds = getBounds();
			for (let i = 0, len = pattern.length; i < len; i++) {
				const copy = structuredClone(pattern[i]);
				copy[0][0] += bounds.width;
				copy[1][0] += bounds.width;
				pattern.push(copy);
			}
		}
		
		return pattern;
	}

	function getBounds() {
		let left = Math.min(...pattern.flatMap(p => p).map(p => p[0]));
		let top = Math.min(...pattern.flatMap(p => p).map(p => p[1]));
		let right = Math.max(...pattern.flatMap(p => p).map(p => p[0]));
		let bottom = Math.max(...pattern.flatMap(p => p).map(p => p[1]));
		return { 
			left, right, top, bottom,
			width: right - left + 1,
			height: bottom - top + 1,
		};
	}

	return { getPattern, getBounds };
}