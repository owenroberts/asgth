/*
	handles displaying narration
*/

import { TextSprite } from '../lines/src/GameEngine.js';
import { cellSize, lettersTrack, lettersLead } from './Utils.js';

export function Narration(gme, onFinshed) {

	const { sprites } = gme.anims;
	let sfx;

	let text = new TextSprite({
		x: 32,
		y: 32,
		wrap: 23,
		letters: sprites.letters,
		track: lettersTrack,
		lead: lettersLead,
		countForward: true,
	});

	let symbols = new TextSprite({
		x: 64,// gme.width - (64 * 3),
		y: 32,
		wrap: 6,
		letters: sprites.symbols,
		track: 64,
		lead: 72,
		letterIndexString: 'abcdefghijklmnopqrstuvwxyz',
	});
	symbols.isActive = false;

	let xForNext = new TextSprite({
		x: 32,
		y: gme.height - 128,
		msg: 'x to continue',
		track: lettersTrack,
		letters: sprites.letters,
	});

	let dialogList, goNext = false;

	function add(list) {
		if (!Array.isArray(list)) list = [list];
		text.setMsg(list[0]);
		dialogList = [];
		for (let i = 1; i < list.length; i++) {
			dialogList.push(list[i]);
		}

		symbols.y = text.breaks.length * 64 + 64 + 32;
	}

	function addSymbols(str) {
		symbols.setMsg(str);
		symbols.setBreaks(true); // break with out spaces
		symbols.isActive = true;
		symbols.y = text.breaks.length * 64 + 64 + 32;
	}

	function cancelSymbols() {
		symbols.isActive = false;
	}

	function next() {
		if (!text.isDone()) {
			text.skip();
			sfx.play('skip_button', true);
		} else {
			goNext = true;
			sfx.play('next_button', true);
		}
	}

	function display() {

		let isDone = text.display();
		// console.log(dialogList)
		if (dialogList.length === 0) symbols.display();

		if (!isDone) {
			goNext = false;
			return;
		}

		xForNext.display();

		if (goNext) {
			goNext = false;
			if (dialogList.length === 0) {
				onFinshed();
			} else {
				text.setMsg(dialogList.shift());
				symbols.y = text.breaks.length * 64 + 64 + 32;
			}
		}
	}

	function addSFX(_sfx) {
		sfx = _sfx;
	}

	return { add, addSymbols, cancelSymbols, next, display, addSFX };

}