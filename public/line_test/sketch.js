/*
	testing line intersections
*/

const drawing = [
	[50, 50],
	[100, 100],
	"end"
];

function setup() {
	createCanvas(500, 500);
	background(220);

	beginShape();
	for (let i = 0; i < drawing.length; i++) {
		if (typeof drawing[i] === 'string') {
			endShape();
			if (i < drawing.length - 2) beginShape();
		} else {
			vertex(...drawing[i]);
		}
	}

	sampleLine([drawing[0], drawing[1]]);
}

function sampleLine(l1ne) {
	
}