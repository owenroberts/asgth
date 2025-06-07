import { random, shuffle, coinFlip, Counter } from '../../cool/cool.js';
import { Sprite, Scene, GameAnim, TextSprite } from '../../lines/src/Engine.js';
import { Drawing, Layer, Style, POINTS, Animator } from '../../lines/src/Lines.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';
import { continueUI } from './continueUI.js';

export function pattern(gm) {

	const scene = new Scene();
	const animation = new GameAnim();
	const drawing = new Drawing();
	animation.drawings.push(drawing);
	animation.layers.push(new Layer());
	animation.styles.push(new Style({
		color: "#FFFFFF",
		segmentNum: 4,
		wiggleRange: 1,
		wiggleSegments: true,
	}));
	animation.setFrames(); // needs this for game anim that isn't loaded...

	// little sprite hack
	scene.addToDisplay({
		display() {
			animation.draw();
		}
	});

	// no add this to the narration
	scene.addToDisplay(new TextSprite({
		msg: Strings.INST_DRAW_PATTERN,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		x: Consts.CELL_SIZE.W * 0.5,
		y: Consts.CELL_SIZE.H * 0.5,
		letters: gm.anims.sprites.letters,
		wrap: 24,
	}));

	const { xBtn, xToContinue } = continueUI(gm);
	scene.addToDisplay(xBtn);
	scene.addToDisplay(xToContinue);
	scene.canContinue = false;

	const nextDelay = Counter(Consts.PATTERN_DELAY, () => {
		xToContinue.isActive = true;
		xBtn.isActive = true;
		scene.canContinue = true;
	});

	scene.onUpdate = function() {
		nextDelay.update();
	};

	const cols = 1;
	const rows = 1;

	scene.data = []; // save pattern for matching

	const w = Consts.CELL_SIZE.W / 2;
	const h = Consts.CELL_SIZE.H / 2;
	const corners = [
		{ x: 1, y: 1 }, // up left
		{ x: 1, y: 2 }, // down left
		{ x: 2, y: 1 }, // up right
		{ x: 2, y: 2 }, // down right
	];

	// 1.42 = .71 * 2
	const s = 1; // size of line
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

	function drawLine(cornerIndex, x, y) {

		let bX = x * w * 3 + w * 2;
		let bY = y * h * 3 + h * 4;
		let corner = corners[cornerIndex];
		let d = directions[dirIndexes[directionIndex++]];

		// no pointing inside
		if (cornerIndex === 0 && d.x > 0 && d.y > 0) return;
		if (cornerIndex === 1 && d.x < 0 && d.y > 0) return;
		if (cornerIndex === 2 && d.x > 0 && d.y < 0) return;
		if (cornerIndex === 3 && d.x < 0 && d.y < 0) return;

		// xy position and direction vector
		// normalized to top-left
		// console.log('~', JSON.stringify([
		// 	x + corner.x ,//+ (d.x < 0 ? -1 : 0),
		// 	y + corner.y ,//+ (d.y < 0 ? -1 : 0),
		// 	Math.sign(d.x) ,//* (d.x < 0 ? -1 : 1),
		// 	Math.sign(d.y) ,//* (d.y < 0 ? -1 : 1),
		// ]));
		
		const code = [
			x + corner.x, // + (d.x < 0 ? -1 : 0),
			y + corner.y, // + (d.y < 0 ? -1 : 0),
			Math.sign(d.x), // * (d.x < 0 ? -1 : 1),
			Math.sign(d.y), //  * (d.y < 0 ? -1 : 1),
		];

		console.log('~', JSON.stringify(code));


		// draw lines from left to right, then top to bottom
		if (d.x < 0) {
			code[0] -= 1;
			code[2] *= -1;
		} else if (d.y < 0) {
			code[1] -= 1;
			code[3] *= -1;
		}

		console.log('*', JSON.stringify(code));

		const codeInData = scene.data.some(d => {
			return JSON.stringify(d) === JSON.stringify(code);
		});
		if (codeInData) return;

		scene.data.push(code);

		drawing.add([bX + corner.x * w, bY + corner.y * h]);
		drawing.add([
			bX + corner.x * w + d.x * w,
			bY + corner.y * h + d.y * h,
		]);
		drawing.add(POINTS.END);
	}

	for (let x = 0; x < cols; x++) {
		for (let y = 0; y < rows; y++) {
			directionIndex = 0;
			dirIndexes = shuffle(dirIndexes);
			for (let i = 0; i < 2; i++) {
				drawLine(i, x, y);
				drawLine(i, x, y);
			}			
		}
	}

	return scene;
}