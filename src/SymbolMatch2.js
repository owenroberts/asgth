/*
	match all connected point directions
	7 0 1
	6 x 2
	5 4 3
*/

import { POINTS } from '../lines/src/Lines.js';

export function SymbolMatch2(symbolProfiles) {

	const vectorMap = {
		"0-1": 0,
		"1-1": 1,
		"10": 2,
		"11": 3,
		"01": 4,
		"-11": 5,
		"-10": 6,
		"-1-1": 7,
	};

	function linesIntersect(a, b) {
		// https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
		const [[x1, y1], [x2, y2]] = a;
		const [[x3, y3], [x4, y4]] = b;

		var det, gamma, lambda;
		det = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1);
		if (det === 0) return false;
		lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y2)) / det;
		gamma = ((y1 - y2) * (x4 - x1) + (x3 - x1) * (y4 - y2)) / det;
		return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
		// comment 2 -> lines nearly intersecting, like meeting at point8
		// return -0.01 < lambda && lambda < 1.01 && -0.01 < gamma && gamma < 1.01;
	}

	function matchPoints(a, b) {
		return a[0] === b[0] && a[1] === b[1];
	}

	function linesSharePoints(a, b) {
		return (
			matchPoints(a[0], b[0]) ||
			matchPoints(a[0], b[1]) ||
			matchPoints(a[1], b[0]) ||
			matchPoints(a[1], b[1])
		);
	}

	function getShapes(drawing, unit, offset=0) {
		if (!unit) return console.warn('No unit provided for shapes.');
		// any lines that intersect are part of a shape

		// get points on grid
		const points = drawing
			.filter((p) => p !== POINTS.END)
			.map((p) => p.map((c) => (c - offset) / unit));

		const lines = [];
		let shapeCount = 0;
		for (let i = 0; i < points.length; i += 2) {
			lines.push({
				points: [points[i], points[i + 1]],
				intersects: [],
				shape: ++shapeCount,
			});
		}

		// shape is all lines that intersect
		// map lines that intersect
		for (let i = 0; i < lines.length; i++) {
			for (let j = 0; j < lines.length; j++) {
				if (i === j) continue; // dont test self
				// let intersect = linesIntersect(lines[i].points, lines[j].points);
				let intersect = getIntersectionPoint(lines[i].points, lines[j].points);
				let share = linesSharePoints(lines[i].points, lines[j].points);
				if (intersect || share) {
					lines[i].intersects.push({
						index: j,
						point: intersect,
					});
				}
			}
		}

		function matchShapes() {
			// check all lines to see if connections match shape
			let shapeChanged = false;
			for (let i = 0; i < lines.length; i++) {
				for (let j = 0; j < lines.length; j++) {
					if (i === j) continue; // dont test self
					// if any intersections, match shape
					if (lines[i].intersects.map((is) => is.index).some((_i) => _i === j)) {
						if (lines[i].shape !== lines[j].shape) {
							lines[j].shape = lines[i].shape;
							// if something changed run the whole check again
							let shapeChanged = true;
						}
					}
				}
			}
			if (shapeChanged) matchShapes();
		}
		matchShapes();

		let shapes = [];
		for (let i = 0; i < lines.length; i++) {
			if (!shapes[lines[i].shape]) shapes[lines[i].shape] = [];
			shapes[lines[i].shape].push(lines[i]);
		}
		shapes = shapes.filter(s => s);
		return shapes;
	}

	function getIntersectionPoint(a, b) {
		const [[x1, y1], [x2, y2]] = a;
		const [[x3, y3], [x4, y4]] = b;
		// https://stackoverflow.com/a/60368757
		// Check if none of the lines are of length 0
		if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) return false;

		let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

		// Lines are parallel
		if (denominator === 0) return false;

		let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
		let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

		// is the intersection along the segments
		if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return false;

		// Return a object with the x and y coordinates of the intersection
		let x = Math.round((x1 + ua * (x2 - x1)) * 1000) / 1000;
		let y = Math.round((y1 + ua * (y2 - y1)) * 1000) / 1000;
		return [x, y];
	}

	function matchSymbol(shape, profile) {
		const directs = getDirections(shape);
		// console.log(profile, directs);
		return (
			profile.every(r => directs.includes(r)) &&
			directs.every(r => profile.includes(r))
		);
	}

	function getDirections(shape) {
		const dict = {}; // map points to directions....
		for (let i = 0; i < shape.length; i++) {
			let { points, intersects } = shape[i];

			const p1 = points[0].join(",");
			const p2 = points[1].join(",");
			if (!dict[p1]) dict[p1] = new Set();
			if (!dict[p2]) dict[p2] = new Set();

			dict[p1].add(getDir(points[0], points[1]));
			dict[p2].add(getDir(points[1], points[0]));

			for (let j = 0; j < intersects.length; j++) {
				for (let k = 0; k < points.length; k++) {
					if (matchPoints(intersects[j].point, points[k])) continue;
					if (!intersects[j].point) continue; // not intersection, share points
					const p1 = intersects[j].point.join(",");
					const p2 = points[k].join(",");
					if (!dict[p1]) dict[p1] = new Set();
					dict[p1].add(getDir(intersects[j].point, points[k]));
					dict[p2].add(getDir(points[k], intersects[j].point));
				}
			}
		}
		return Object.keys(dict).map((k) => Array.from(dict[k]).sort().join(""));
	}

	function getDir(s, e) {
		return vectorMap[`${Math.sign(+e[0] - +s[0])}${Math.sign(+e[1] - +s[1])}`];
	}
	
	function getMatch(drawing, unit, offset) {
		const shapes = getShapes(drawing, unit, offset);
		// console.log('shapes', shapes);
		const matches = [];
		for (let i = 0; i < shapes.length; i++) {
			// matches[i] = [];
			for (const k in symbolProfiles) {
				// console.log(i, shapes[i], k, symbolProfiles[k]);
				const isMatch = matchSymbol(shapes[i], symbolProfiles[k]);
				if (isMatch) matches.push(k);
			}
		}
		return matches;
	}

	return { getMatch };

}
