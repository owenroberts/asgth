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

	const w = Consts.CELL_SIZE.W / 2;
	const h = Consts.CELL_SIZE.H / 2;
	const sX = w * 2; // consts?
	const sY = h * 4; 

	// pattern[lines[points[xy]]]
	// [[[x1, y1], [x2, y2]]]
	for (let i = 0; i < gm.props.pattern.length; i++) {
		drawing.add([
			sX + gm.props.pattern[i][0][0] * w, 
			sY + gm.props.pattern[i][0][1] * h,
		]);
		drawing.add([
			sX + gm.props.pattern[i][1][0] * w, 
			sY + gm.props.pattern[i][1][1] * h,
		]);
		drawing.add(POINTS.END);
	}

	return scene;
}