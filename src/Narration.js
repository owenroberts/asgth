/*
	handles displaying narration
*/

function Narration(onFinshed) {

	const { sprites } = gme.anims;
	let sfx;

	let text = new TextSprite({
		x: 32,
		y: 32,
		wrap: 19,
		letters: sprites.letters,
		track: lettersTrack,
		lead: lettersLead,
		countForward: true,
	});

	let symbols = new TextSprite({
		x: gme.width - (64 * 3),
		y: 32,
		wrap: 3,
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
	}

	function addSymbols(str) {
		symbols.setMsg(str);
		symbols.setBreaks(true); // break with out spaces
		symbols.isActive = true;
	}

	function cancelSymbols() {
		symbols.isActive = false;
	}

	function next() {
		if (!text.isDone()) {
			text.skip();
			if (sfx) sfx.play('skip_button', true);
		} else {
			goNext = true;
			if (sfx) sfx.play('next_button', true);
		}
	}

	function display() {

		let isDone = text.display();
		symbols.display();

		if (!isDone) {
			goNext = false;
			return;
		}

		xForNext.display();

		if (goNext) {
			goNext = false;
			if (dialogList.length === 0) onFinshed();
			else text.setMsg(dialogList.shift());
		}
	}

	function addSFX(_sfx) {
		sfx = _sfx;
	}

	return { add, addSymbols, cancelSymbols, next, display, addSFX };

}