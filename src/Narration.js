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
		lead: 48,
		countForward: true,
	});

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

	function next() {
		goNext = true;
		if (soundEnabled) sfx.button_3.play();
	}

	function skip() {
		text.skip();
		if (soundEnabled) sfx.button_2.play();
	}

	function display() {

		let isDone = text.display();

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

	return { add, next, display, skip, addSFX };

}