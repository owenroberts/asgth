/*
	this is the spider's web?
*/

import { GameAnim } from '../lines/src/GameEngine.js';
import { Drawing, Layer } from '../lines/src/Lines.js';

export function Web() {
	
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
	let sfx;

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

	function cancel() {
		drawing.points.pop();
		drawing.points.pop();
		isActive = false;
		// playSFX('cancel');
		// build if into sfx class/sound provider?
		if (sfx) sfx.play('cancel'); 
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

	function addSFX(_sfx) {
		sfx = _sfx;
		return;
	}

	return { 
		display, 
		addPoint, insertPoint, 
		start, end, clear, cancel,
		startOverride, cancelOverride, 
		addSFX,
		getPoints() { return drawing.points;  },
		isActive() { return isActive; }
	};

}