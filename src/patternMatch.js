import { Consts } from './Consts.js';
import { POINTS } from '../lines/src/Lines.js';

export function patternMatch(pattern, drawing) {

	// get segments of the drawing, normalize for top-left, drawing bounds

	const offset = 32;
	let points = drawing
		.filter(p => p !== POINTS.END)
		.map(p => p.map(c => (c - offset) / 64));

	// move top left to 0,0
	function normalizeTopLeft(array) {
		let left = Math.min(...array.map(p => p[0]));
		let top = Math.min(...array.map(p => p[1]));
		for (let i = 0; i < array.length; i++) {
			array[i][0] -= left;
			array[i][1] -= top;
		}
		return array;
	}

	// sort points by sum and then x
	function sortTopLeft(array) {
		array = array.sort((p1, p2) => (p1[0] + p1[1]) - (p2[0] + p2[1]));
		array = array.sort(); // default sorts first element as string (wacky javascript :D)
		return array;
	}

	points = normalizeTopLeft(points);

	// get lines from points pairs
	const lines = [];
	for (let i = 0; i < points.length; i += 2) {
		lines.push(sortTopLeft([points[i], points[i + 1]]));
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
			for (let x = x1 + 1; x < x2; x++) {
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

	// convert segments to directions
	const segments = lines.map(line => 
		[
			line[0][0], 
			line[0][1], 
			line[1][0] - line[0][0], 
			line[1][1] - line[0][1],
		]
	);
	console.log({ segments });
	
	// is pattern sorted when its made?
	pattern = normalizeTopLeft(pattern);
	pattern = sortTopLeft(pattern);

	
	console.log('pattern', JSON.stringify(pattern));
	console.log('segments', JSON.stringify(segments));
	console.log(JSON.stringify(pattern) === JSON.stringify(segments))

	return JSON.stringify(pattern) === JSON.stringify(segments);
}