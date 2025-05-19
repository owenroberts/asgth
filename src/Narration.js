import { Texture, TextSprite } from '../lines/src/Engine.js';
import { Consts } from './Consts.js';
import { Strings } from './Strings.js';

/**
 * handles displaying narration
 * @param {Game} gm - game engine object
 */
export function Narration(gm) {

	let sfx;
	let dialogList, goNext = false;
	let isDone = true;

	const scoreDisplay = new Texture({ animation: gm.anims.sprites.score });
	scoreDisplay.isActive = false;

	const text = new TextSprite({
		x: Consts.CELL_SIZE.W / 2,
		y: Consts.CELL_SIZE.H / 2,
		wrap: 20,
		letters: gm.anims.sprites.letters,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		countForward: true,
	});

	const symbols = new TextSprite({
		x: Consts.CELL_SIZE.W * 10,
		y: Consts.CELL_SIZE.H * 0.5,
		wrap: 6,
		letters: gm.anims.sprites.symbols_big,
		track: Consts.SYMBOLS_TRACK,
		lead: Consts.SYMBOLS_LEAD,
		letterIndexString: Consts.SYMBOL_INDEX_STRING,
	});
	symbols.isActive = false;

	const xBtn = new TextSprite({
		msg: "x",
		x: Consts.CELL_SIZE.W * 0.5,
		y: Consts.CELL_SIZE.H * 5.5,
		letters: gm.anims.sprites.letters_keyboard,
	});

	let xContinue = new TextSprite({
		x: Consts.CELL_SIZE.W * 1.5,
		y: Consts.CELL_SIZE.H * 5.5,
		msg: Strings.CONTINUE,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		letters: gm.anims.sprites.letters,
	});

	function add(list) {
		if (!Array.isArray(list)) list = [list];
		text.setMsg(list[0]);
		dialogList = [];
		for (let i = 1; i < list.length; i++) {
			dialogList.push(list[i]);
		}
		isDone = false;
		// symbols.y = text.breaks.length * 64 + 64 + 32;
	}

	function addSymbols(str) {
		symbols.setMsg(str);
		symbols.setBreaks(true); // break with out spaces
		symbols.isActive = true;
		// symbols.y = text.breaks.length * 64 + 64 + 32;
	}

	function cancelSymbols() {
		symbols.setMsg("");
		symbols.isActive = false;
	}

	function next() {
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
	}

	function display() {
		let lineIsDone = text.display();
		if (symbols.isActive) symbols.display();
		if (scoreDisplay.isActive) scoreDisplay.display();

		if (!lineIsDone) {
			goNext = false;
			return;
		}

		xBtn.display();
		xContinue.display();

		if (goNext) {
			goNext = false;
			if (dialogList.length === 0) {
				isDone = true;
				// sfx.play('level_start', true); // should sfx be here? and is it working??
			} else {
				text.setMsg(dialogList.shift());
			}
		}
	}

	function addSFX(_sfx) {
		sfx = _sfx;
	}

	function setScore() {
		scoreDisplay.isActive = true;

		let scoreX = gm.width - Consts.CELL_SIZE.W * 1.25;
		let scoreY = Consts.CELL_SIZE.H * 0.25 + (Consts.CELL_SIZE.H * (gm.props.points.SPIDER + gm.props.points.ROCK - 1));
		let point = gm.props.lastPointWinner === 'SPIDER' ? 1 : 0;
		scoreDisplay.addLocation(scoreX, scoreY,  point);
	}

	function hideScore() {
		scoreDisplay.isActive = false;
	}

	return { 
		add, addSymbols, cancelSymbols, next, display, addSFX,
		setScore, hideScore,
		isDone: () => { return isDone; },
	};
}