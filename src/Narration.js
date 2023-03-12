/*
	handles displaying narration
*/

function Narration(onFinshed) {

	const { sprites } = gme.anims;

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
		x: 64,
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

	function next() {
		goNext = true;
	}

	function skip() {
		text.skip();
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

	return { add, next, display, skip };

}