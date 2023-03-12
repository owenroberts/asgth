function Web() {
	const animation = new GameAnim();
	const drawing = new Drawing();
	animation.drawings.push(drawing);
	animation.layers.push(new Layer({ 
		color: '#FFFFFF', 
		drawingIndex: 0,
		segmentNum: 4,
	}));
	console.log(animation);
	animation.setFrames();

	let isActive = false;

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

	return { 
		display, addPoint, insertPoint, start, end, 
		isActive() { return isActive; }
	};

}