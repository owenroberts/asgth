import { Counter } from '../../cool/cool.js';
import { Scene, Sprite, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

export function InstMove(gm, player) {

	const scene = new Scene();
	let xBtn, xToContinue;

	scene.setup = function() {

		scene.add(player);
		player.spawn([64 * 10, 64 * 1]);
		
		scene.addToDisplay(new TextSprite({
			countForward: true,
			msg: Strings.INST_MOVE_YOU,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: gm.anims.sprites.letters,
			wrap: 14,
		}));

		scene.addToDisplay(new TextSprite({
			countForward: true,
			msg: Strings.INST_MOVE_KEYS,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 1.5,
			letters: gm.anims.sprites.letters,
			wrap: 22,
		}));

		const keyboardArrows = new Sprite(Consts.CELL_SIZE.W * 0.5, Consts.CELL_SIZE.H * 2.5, gm.anims.sprites.keyboard_arrows); 
		scene.addToDisplay(keyboardArrows);

		xBtn = scene.addToDisplay(new TextSprite({
			msg: Strings.X_BTN,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 5.5,
			letters: gm.anims.sprites.letters_keyboard,
			isActive: false,
		}));

		xToContinue = scene.addToDisplay(new TextSprite({
			msg: Strings.CONTINUE,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W  * 1.5,
			y: Consts.CELL_SIZE.H  * 5.5,
			letters: gm.anims.sprites.letters,
			isActive: false,
		}));
	};

	// after player presses all three arrow buttons, next
	let arrowsPressed = [false, false, false]; // up, left, right
	const nextInstructionDelay = new Counter(60, () => {
		xToContinue.isActive = true;
		xBtn.isActive = true;
	});

	scene.check = function() {
		return arrowsPressed.every(a => a);
	};

	scene.onUpdate = function() {
		if (player.input['up']) arrowsPressed[0] = true;
		if (player.input['left']) arrowsPressed[1] = true;
		if (player.input['right']) arrowsPressed[2] = true;

		if (arrowsPressed.every(a => a)) {
			nextInstructionDelay.update();
		}
	};

	return scene;
}