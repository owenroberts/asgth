// scene or what?
import { random, shuffle } from '../../cool/cool.js';
import { Sprite, Scene, GameAnim } from '../../lines/src/Engine.js';
import { Drawing, Layer, Style, POINTS, Animator } from '../../lines/src/Lines.js';
import { Consts } from '../Consts.js';

export function pattern(gm) {

	const scene = new Scene();
	const animation = new GameAnim();
	const drawing = new Drawing();
	animation.drawings.push(drawing);
	animation.layers.push(new Layer());
	animation.styles.push(new Style({
		color: "#FFFFFF",
		// segmentNum: 10,
		// wiggleRange: 8,
		// wiggleSegments: true,
	}));
	animation.setFrames(); // needs this for game anim that isn't loaded...

	// little sprite hack
	scene.addToDisplay({
		display() {
			animation.draw();
		}
	});

	let cols = 3;
	let rows = 1;

	const { W, H } = Consts.CELL_SIZE;
	const w = W / 4;
	const h = H / 4;
	const corners = [
		{ x: w * 3, y: h * 3 },
		{ x: w * 5, y: h * 3 },
		{ x: w * 3, y: h * 5 },
		{ x: w * 5, y: h * 5 },
	];

	// 1.42 = .71 * 2
	let directions = [
		{ x: w * 0,     y: h * -2    }, // up
		{ x: w * 1.42,  y: h * -1.42 }, // up right
		{ x: w * 2,     y: h * 0     }, // right
		{ x: w * 1.42,  y: h * 1.42  }, // down right
		{ x: w * 0,     y: h * 2     }, // down
		{ x: w * -1.42, y: h * 1.42  }, // down left
		{ x: w * -2,    y: h * 0     }, // left
		{ x: w * -1.42, y: h * -1.42 }, // up left
	];

	let dirIndex = 0;

	function drawLine(index, x, y) {
		let corner = corners[index];
		let d = directions[dirIndex++];

		// no pointing inside
		if (index === 0 && d.x > 0 && d.y > 0) return;
		if (index === 1 && d.x < 0 && d.y > 0) return;
		if (index === 2 && d.x > 0 && d.y < 0) return;
		if (index === 3 && d.x < 0 && d.y < 0) return;

		drawing.add([x + corner.x, y + corner.y]);
		drawing.add([
			x + corner.x + d.x,
			y + corner.y + d.y,
		]);
		drawing.add(POINTS.END);
	}

	for (let x = 0; x < cols; x++) {
		for (let y = 0; y < rows; y++) {
			dirIndex = 0;
			directions = shuffle(directions);
			for (let i = 0; i < corners.length; i++) {
				drawLine(i, x * W + W, y * H + H);
				drawLine(i, x * W + W, y * H + H);
			}			
		}
	}

	return scene;


}