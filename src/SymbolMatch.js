/*
	match normalized drawings to symbol data
*/

function SymbolMatch(symbolProfiles) {

	const profiles = 'abcdefghijklm'.split('');
	console.log(profiles);

	function getIntersectionPoint(a, b) {
		const [[x1, y1], [x2, y2]] = a;
		const [[x3, y3], [x4, y4]] = b;
		// https://stackoverflow.com/a/60368757
		// Check if none of the lines are of length 0
		if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) return false;

		const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

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

	function sharePoints(a, b) {
		return (
			matchPoints(a[0], b[0]) ||
			matchPoints(a[0], b[1]) ||
			matchPoints(a[1], b[0]) ||
			matchPoints(a[1], b[1])
		);
	}

	function matchPoints(a, b) {
		return a[0] === b[0] && a[1] === b[1];
	}

	function normalizePoint(point, minX, minY, w, h) {
  		return [(point[0] - minX) / w, (point[1] - minY) / h];
	}

	function getShapes(drawing, unit, offset) {
		// any lines that intersect are part of a shape

		// get points on grid
		const points = drawing
			.filter(p => typeof p !== "string")
			.map(p => p.map((c) => (c - offset) / unit));

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
				let intersect = getIntersectionPoint(lines[i].points, lines[j].points);
				let share = sharePoints(lines[i].points, lines[j].points);
				if (intersect || share) lines[i].intersects.push(j);
			}
		}

		function matchShapes() {
			// check all lines to see if connections match shape
			let shapeChanged = false;
			for (let i = 0; i < lines.length; i++) {
				for (let j = 0; j < lines.length; j++) {
					if (i === j) continue; // dont test self
					// if any intersections, match shape
					if (lines[i].intersects.some((_i) => _i === j)) {
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

	function normalizeShape(shape) {
		// console.log('shape', shape);
		// get min max, x, y
		const points = shape.flatMap((l) => l.points);
		const minX = Math.min(...points.map((p) => p[0]));
		const maxX = Math.max(...points.map((p) => p[0]));
		const minY = Math.min(...points.map((p) => p[1]));
		const maxY = Math.max(...points.map((p) => p[1]));

		const w = maxX - minX;
		const h = maxY - minY;

		const normalizedShape = shape.map((l) => {
		  l.points = l.points.map((p) => normalizePoint(p, minX, minY, w, h));
		  return l;
		});
		return normalizedShape;
	}

	function samplePoints(shape) {
		const points = shape.flatMap(l => l.points.map(p => p)); // points already in shape
		// normalized grid
		for (let x = 0.1; x < 1; x += 0.1) {
			for (let i = 0; i < shape.length; i++) {
				// grid line and shape line
				const p = getIntersectionPoint([[x, 0], [x, 1],], shape[i].points);
				if (p) points.push(p);
			}
		}

		for (let y = 0.1; y < 1; y += 0.1) {
		  for (let i = 0; i < shape.length; i++) {
		    // grid line and shape line
		    const p = getIntersectionPoint([[0, y], [1, y]], shape[i].points);
		    if (p) points.push(p);
		  }
		}
		return points;
	}

	function getDistance(a, b) {
		const [x1, y1] = a;
		const [x2, y2] = b;
		let y = x2 - x1;
		let x = y2 - y1;
		return Math.sqrt(x * x + y * y);
	}

	function compareShape(points, profileLetter) {
		// get points in profile
		const profile = symbolProfiles[profileLetter].map(p => p.split(",").map(c => +c));
		// add similarity of each point (later divide by # points)
		let similarity = 0; 
		const usedPoints = [];
		// console.log(profileLetter, profile[0]);
		for (let i = 0; i < profile.length; i++) {
			if (usedPoints.length === points.length) continue;
			
			// get closest point in shape
			let distance = 2;
			let closestPointIndex;
			for (let j = 0; j < points.length; j++) {
				if (usedPoints.includes(j)) continue;
				const d = getDistance(profile[i], points[j]);
				if (d < distance) {
					distance = d;
					closestPointIndex = j;
				}
			}
			usedPoints.push(closestPointIndex);
			
			if (distance === 0) {
				// if dist is 0 its the same point
				similarity += 1;
				continue;
			}
			
			// get closeness score 0 - 1
			let far = 0;
			let corners = [[0,0], [1,0], [1,1], [0,1]];
			for (let j = 0; j < corners.length; j++) {
				const d = getDistance(profile[i], corners[j]);
				if (d > far) {
					far = d;
				}
			}
			
			// add up scores and divide by number of points
			similarity += map(distance, 0, far, 1, 0);
		}
		
		similarity = similarity / profile.length;
		
		// penalize more or fewer points
		let diff = Math.abs(points.length - profile.length);
		similarity -= map(diff, 0, points.length, 0, 1, true);
		
		return Math.max(0, similarity);
	}

	function getMatch(drawing, unit, offset) {
		const shapes = getShapes(drawing, unit, offset);
		// console.log('shapes', shapes);
		const matches = [];
		for (let i = 0; i < shapes.length; i++) {
			let normalized = normalizeShape(shapes[i]);
			let sampled = samplePoints(normalized);
			let stringy = [...new Set(sampled.map(p => p.join(",")))];
			let points = stringy.map(p => p.split(",").map(c => +c));
			for (let j = 0; j < profiles.length; j++) {
				const profile = profiles[j];
				if (profile === 'g') console.log('points', points);
				if (profile === 'g') console.log('profile', symbolProfiles[profile].map(p => p.split(",").map(c => +c)));
				const score = compareShape(points, profile);
				if (profile === 'g') console.log('score', score);
				if (score > 0.9) {
					matches.push({ profile, score });
				}
			}
		}

		if (matches.length === 0) return false;
		if (matches.length > 1) {
			console.log('multiple matches', shapes, matches);
			return matches.reduce((a, b) => a.score > b.score ? a : b).profile;
		}
		return matches[0].profile;
	}

	return { getMatch };

}