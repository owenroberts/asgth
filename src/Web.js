function Web() {
	const animation = new GameAnim();
	const drawing = new Drawing();
	animation.drawings.push(drawing);
	animation.layers.push(new Layer({ 
		color: '#FFFFFF', 
		drawingIndex: 0,
		segmentNum: 10,
		wiggleRange: 4,
		wiggleSegments: true,
	}));
	animation.setFrames();

	let isActive = false;
	let soundEnabled = false;
	let sfx = {};

	function display() {
		animation.draw();
	}

	function addPoint(point) {
		drawing.add(point);
	}

	function insertPoint(point) {
		drawing.points.splice(drawing.length - 2, 0, point);
		drawing.offsets.splice(drawing.length - 2, 0, [[0,0],[0,0]]);
	}

	function start() {
		isActive = true;
	}

	function end() {
		drawing.points.pop();
		isActive = false;
		drawing.add('end');
	}

	function clear() {
		drawing.points = [];
		drawing.offsets = [];
	}

	function startOverride() {
		let w = 4, s = 0.1, n = 10;
		animation.onDraw = () => {
			if (w < 32) {
				w += 0.04;
				s += 0.004;
				n += 0.1;
				animation.overrideProperty('wiggleRange', w);
				animation.overrideProperty('wiggleSpeed', s);
				animation.overrideProperty('segmentNum', n);

			}
		}
	}

	function cancelOverride() {
		animation.cancelOverride();
		animation.onDraw = undefined;
	}

	function playSFX(type) {
		if (!soundEnabled) return;

		switch(type) {
			case 'connect':
				random(sfx.connects).play();
			break;
			default:
				sfx[type].play();
			break;
		}
	}

	function stopSFX(type) {
		if (!soundEnabled) return;
		if (type === 'web') sfx.web.pause();
	}

	function addSFX(sounds) {
		soundEnabled = true;

		sfx.web = sounds.zip_lock;
		sfx.web.loop = true;

		sfx.button_1 = sounds.button_1;
		sfx.button_2 = sounds.button_2;
		sfx.button_3 = sounds.button_3;

		sfx.cancel = sounds.cancel;

		sfx.connects = [];
		sfx.connects.push(sounds.connect_1);
		sfx.connects.push(sounds.connect_2);
		sfx.connects.push(sounds.connect_3);
		sfx.connects.push(sounds.connect_4);
		sfx.connects.push(sounds.connect_5);
		sfx.connects.push(sounds.connect_6);
	}

	return { 
		display, addPoint, insertPoint, start, end, clear, startOverride, cancelOverride, 
		addSFX, playSFX, stopSFX,
		isActive() { return isActive; }
	};

}