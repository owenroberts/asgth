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

	let sfx;
	let dialogList = []
	let goNext = false;
	let isDone = true;

	const score = scene.addSprite(new Texture({ 
		animation: gm.anims.sprites.score,
		isActive: false, 
	}));

	const text = scene.addSprite(new TextSprite({
		x: Consts.CELL_SIZE.W2, // * Consts.TEXT_MARGIN.W,
		y: Consts.CELL_SIZE.H2, //  * Consts.TEXT_MARGIN.H,
		wrap: 20,
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
		console.log('next', dialogList, text.isDone())
		if (text.isDone()) {
			goNext = true;
			sfx.play('next_button', true);
		} else {
			text.skip();
			sfx.play('skip_button', true);
			if (dialogList.length === 0) {
				isDone = true;
			}
		}
	};

	scene.onUpdate = function() {

		// console.log(text.isDone(), xBtn.isActive, xToContinue.isActive);

		if (!text.isDone()) {
			goNext = false;
			xBtn.isActive = false;
			xToContinue.isActive = false;
			return;
		} else {
			xBtn.isActive = true;
			xToContinue.isActive = true;
		}

		if (goNext) {
			goNext = false;
			
			xBtn.isActive = false;
			xToContinue.isActive = false;
			
			if (dialogList.length === 0) {
				isDone = true;
			} else {
				text.setMsg(dialogList.shift());
			}
		}
	};

	scene.addSFX = function(_sfx) {
		sfx = _sfx;
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