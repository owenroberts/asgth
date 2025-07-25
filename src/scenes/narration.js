import { Scene, Texture, TextSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';
import { continueUI } from './continueUI.js';

/**
 * handles displaying narration
 * @param {Game} gm - game engine object
 */
export function narration(gm) {

	const scene = new Scene();

	let dialogList = []
	let isDone = true;

	const score = scene.add(new Texture({ 
		animation: gm.anims.sprites.score,
		isActive: false, 
	}));

	const text = scene.add(new TextSprite({
		x: Consts.CELL_SIZE.W2, // * Consts.TEXT_MARGIN.W,
		y: Consts.CELL_SIZE.H2, //  * Consts.TEXT_MARGIN.H,
		wrap: 24,
		letters: gm.anims.sprites.letters,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		countForward: true,
	}));

	const { xBtn, xToContinue } = continueUI(gm);
	scene.add(xBtn);
	scene.add(xToContinue);

	scene.add = function(list) {
		if (!Array.isArray(list)) list = [list];
		text.setMsg(list[0]);
		dialogList = [];
		for (let i = 1; i < list.length; i++) {
			dialogList.push(list[i]);
		}
		isDone = false;
	};

	scene.next = function() {
		if (text.isDone()) {
			gm.sfx.play('next_button', { randomRate: true });
			if (dialogList.length > 0) {
				text.setMsg(dialogList.shift());
			} else {
				isDone = true;
			}
		} else {
			text.skip();
			gm.sfx.play('skip_button', { randomRate: true });
			if (dialogList.length === 0) {
				isDone = true;
			}
		}
	};

	scene.update = function() {
		if (!text.isDone()) {
			xBtn.isActive = false;
			xToContinue.isActive = false;
			return;
		} else {
			xBtn.isActive = true;
			xToContinue.isActive = true;

			if (dialogList.length === 0) {
				isDone = true;
			} 
		}
	};

	scene.setScore = function() {
		score.isActive = true;

		let scoreX = gm.width - Consts.CELL_SIZE.W * 1;
		let scoreY = Consts.CELL_SIZE.H * (gm.props.points.SPIDER + gm.props.points.ROCK - 1);

		let point = gm.props.lastPointWinner === 'SPIDER' ? 1 : 0;
		score.addLocation(scoreX, scoreY,  point);
	};

	scene.hideScore = function() {
		score.isActive = false;
	};

	scene.isDone = function() {
		return isDone;
	};

	return scene;
}