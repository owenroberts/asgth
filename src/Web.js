import { GameAnim } from '../lines/src/Engine.js';
import { Drawing, Layer, Style, POINTS } from '../lines/src/Lines.js';

/**
 * draw the spiders web
 */
export function Web() {
	
	const animation = new GameAnim();
	const drawing = new Drawing();
	animation.drawings.push(drawing);
	animation.layers.push(new Layer());
	animation.styles.push(new Style({
		color: '#FFFFFF', 
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
		drawing.points.splice(drawing.length - 1, 0, point);
		drawing.offsets.splice(drawing.length - 1, 0, [[0,0],[0,0]]);
	}

	function insertEnd() {
		drawing.points.splice(drawing.length - 1, 0, POINTS.END);
		drawing.offsets.splice(drawing.length - 1, 0, [[0,0],[0,0]]);
	}

	function popPoint() {
		drawing.points.pop();
	}

	function start() {
		isActive = true;
	}

	function cancel() {
		drawing.points.pop();
		drawing.points.pop();
		isActive = false;
	}

	function end() {
		drawing.points.pop();
		isActive = false;
		if (drawing.points.slice(-1) !== POINTS.END) {
			drawing.add(POINTS.END);
		}
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

	function getPoints({trimmed=false}) {
		const points = structuredClone(drawing.points)
		if (trimmed) {
			while (points.slice(-1)[0] !== POINTS.END && points.length > 0) {
				points.pop();
			}

		}
		return points;
	}

	return { 
		display, 
		getPoints, addPoint, insertPoint, insertEnd, popPoint,
		start, end, clear, cancel,
		startOverride, cancelOverride, 
		isActive() { return isActive; },
	};

}