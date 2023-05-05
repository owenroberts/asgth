/*
	handles displaying narration
*/

function Narration(onFinshed) {

	const { sprites } = gme.anims;
	const sfx = {};
	let soundEnabled = false;

	let text = new TextSprite({
		x: 32,
		y: 32,
		wrap: 22,
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
		track: lettersTrack,
		letterIndexString: 'abcdefghijklmnopqrstuvwxyz',
	});
	symbols.isActive = false;

	let xForNext = new TextSprite({
		x: 32,
		y: gme.height - 96,
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
		symbols.isActive = true;
	}

	function cancelSymbols() {
		symbols.isActive = false;
	}

	function next() {
		if (!text.isDone()) {
			text.skip();
			if (soundEnabled) sfx.button_2.play();
		} else {
			goNext = true;
			if (soundEnabled) sfx.button_3.play();
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

	function addSFX(sounds) {
		soundEnabled = true;
		sfx.button_1 = sounds.button_1;
		sfx.button_2 = sounds.button_2;
		sfx.button_3 = sounds.button_3;
	}

	return { add, addSymbols, cancelSymbols, next, display, addSFX };

}