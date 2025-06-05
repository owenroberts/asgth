import { Scene, Texture, TextSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';

/**
 * handles displaying narration
 * @param {Game} gm - game engine object
 */
export function narration(gm) {

	const scene = new Scene();

	let sfx;
	let dialogList, goNext = false;
	let isDone = true;

	const score = scene.addSprite(new Texture({ animation: gm.anims.sprites.score }));
	score.isActive = false;

	const text = scene.addSprite(new TextSprite({
		x: Consts.CELL_SIZE.W / 2,
		y: Consts.CELL_SIZE.H / 2,
		wrap: 20,
		letters: gm.anims.sprites.letters,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		countForward: true,
	}));

	const symbols = scene.addSprite(new TextSprite({
		x: Consts.CELL_SIZE.W * 10,
		y: Consts.CELL_SIZE.H * 0.5,
		wrap: 6,
		letters: gm.anims.sprites.symbols_big,
		track: Consts.SYMBOLS_TRACK,
		lead: Consts.SYMBOLS_LEAD,
		letterIndexString: Consts.SYMBOL_INDEX_STRING,
		isActive: false,
	}));

	const xBtn = scene.addSprite(new TextSprite({
		msg: "x",
		x: Consts.CELL_SIZE.W * 0.5,
		y: Consts.CELL_SIZE.H * 5.5,
		letters: gm.anims.sprites.letters_keyboard,
		isActive: false,
	}));

	let xContinue = scene.addSprite(new TextSprite({
		x: Consts.CELL_SIZE.W * 1.5,
		y: Consts.CELL_SIZE.H * 5.5,
		msg: Strings.CONTINUE,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		letters: gm.anims.sprites.letters,
		isActive: false,
	}));

	scene.add = function(list) {
		if (!Array.isArray(list)) list = [list];
		text.setMsg(list[0]);
		dialogList = [];
		for (let i = 1; i < list.length; i++) {
			dialogList.push(list[i]);
		}
		isDone = false;
	};

	scene.addSymbols = function(str) {
		symbols.setMsg(str);
		symbols.setBreaks(true); // break with out spaces
		symbols.isActive = true;
	};

	scene.cancelSymbols = function() {
		symbols.setMsg("");
		symbols.isActive = false;
	};

	scene.next = function() {
		if (!text.isDone()) {
			text.skip();
			sfx.play('skip_button', true);
			if (dialogList.length === 0) {
				isDone = true;
			}
		} else {
			goNext = true;
			sfx.play('next_button', true);
		}
	};

	scene.onUpdate = function() {

		if (!text.isDone()) {
			goNext = false;
			return;
		} else {
			xBtn.isActive = true;
			xContinue.isActive = true;
		}

		if (goNext) {
			xBtn.isActive = false;
			xContinue.isActive = false;
			goNext = false;
			if (dialogList.length === 0) {
				isDone = true;
				// sfx.play('level_start', true); // should sfx be here? and is it working??
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

		let scoreX = gm.width - Consts.CELL_SIZE.W * 1.25;
		let scoreY = Consts.CELL_SIZE.H * 0.25 + (Consts.CELL_SIZE.H * (gm.props.points.SPIDER + gm.props.points.ROCK - 1));
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