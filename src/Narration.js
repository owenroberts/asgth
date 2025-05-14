/*
	handles displaying narration
*/

import { TextSprite } from '../lines/src/Engine.js';
import { Consts } from './Consts.js';

export function Narration(sprites) {

	let sfx;
	let dialogList, goNext = false;
	// let callback = undefined;
	let isDone = true;

	let text = new TextSprite({
		x: 32,
		y: 32,
		wrap: 20,
		letters: sprites.letters,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		countForward: true,
	});

	let symbols = new TextSprite({
		x: 64 * 10,
		y: 64 * 0.5,
		wrap: 6,
		letters: sprites.symbols_big,
		track: 64,
		lead: 72,
		letterIndexString: 'abcdefghijklmnopqrstuvwxyz',
	});
	symbols.isActive = false;

	const xBtn = new TextSprite({
		msg: "x",
		x: 64 * 0.5,
		y: 64 * 5.5,
		letters: sprites.letters_keyboard,
	});

	let xContinue = new TextSprite({
		x: 64 * 1.5,
		y: 64 * 5.5,
		msg: 'continue',
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		letters: sprites.letters,
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

	return { 
		add, addSymbols, cancelSymbols, next, display, addSFX,
		isDone: () => { return isDone; },
	};
}