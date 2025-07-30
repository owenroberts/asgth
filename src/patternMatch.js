import { Consts } from './Consts.js';
import { Points } from '../lines/src/Lines.js';

// move top left to 0,0
function normalizeTopLeft(array) {
	let left = Math.min(...array.flatMap(p => p).map(p => p[0]));
	let top = Math.min(...array.flatMap(p => p).map(p => p[1]));
	// console.log({ left, top });
	for (let i = 0; i < array.length; i++) {
		array[i][0][0] -= left;
		array[i][0][1] -= top;
		array[i][1][0] -= left;
		array[i][1][1] -= top;
	}
	return array;
}

// sort points by sum and then x
function sortPoints(array) {
	array = array.sort((p1, p2) => (p1[0] + p1[1]) - (p2[0] + p2[1]));
	array = array.sort((a, b) => a[0] - b[0]);
	return array;
}

export function patternMatch(pattern, drawing) {

	// normalize pattern to start at 0,0
	pattern = normalizeTopLeft(pattern);
	// sort by sum, then x

	// get segments of the drawing, normalize for top-left, drawing bounds
	let points = drawing
		.filter(p => p !== Points.END)
		.map(p => p.map(c => (c - Consts.CELL_SIZE.W / 2) / Consts.CELL_SIZE.W));

	// get lines from points pairs
	let lines = [];
	for (let i = 0; i < points.length; i += 2) {
		lines.push(sortPoints([points[i], points[i + 1]]));
	}

	// break up lines into segments
	for (let i = 0; i < lines.length; i++) {
		const [x1, y1] = lines[i][0];
		const [x2, y2] = lines[i][1];
		const dx = x2 - x1;
		const dy = y2 - y1;
		const slope = Math.abs(dy) > 0 ? dx / dy : 0; // dont get fucked by Infinity

		// if slope is anything other than 1 on any line its not a match (for now)
		if (Math.abs(slope) !== 1 && slope !== 0) return false;
		
		if (dx > 1) {
			lines[i][1][0] = x1 + 1;
			lines[i][1][1] = y1 + slope; 
			for (let x = 1; x < dx; x++) {
				lines.push([[x1 + x, y1 + slope * x], [x1 + x + 1, y1 + slope * (x + 1)]])
			}	
		}
		
		else if (dy > 1) {
			lines[i][1][1] = y1 + 1;
			for (let y = y1 + 1; y < y2; y++) {
				lines.push([[x1, y1 + y], [x1, y1 + y + 1]]);
			}
		}
	}
	
	// remove duplicates
	let nodupes = [];
	for (let i = 0; i < lines.length; i++) {
		if (nodupes.some(line => JSON.stringify(line) === JSON.stringify(lines[i]))) {
			continue;
		}
		nodupes.push(lines[i]);
	}

	// console.log('no dupes', JSON.stringify(nodupes));
	nodupes = normalizeTopLeft(nodupes);
	// console.log('sortPattern', JSON.stringify(nodupes));
	// nodupes = sortPattern(nodupes);
	// console.log('sort', JSON.stringify(nodupes));


	// console.log('nodupes', nodupes);
	// console.log('pattern', pattern);
	// simple check before all the map and sort
	if (nodupes.length !== pattern.length) return false;

	let drawingString = nodupes.map(l => l.flatMap(l => l).join('')).sort().join('');
	let patternString = pattern.map(l => l.flatMap(l => l).join('')).sort().join('');

	// console.log('match', drawingString === patternString);
	return drawingString === patternString;
}