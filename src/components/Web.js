import { Consts } from '../Consts.js';
import { GameAnim } from '../../lines/src/Engine.js';
import { Drawing, Layer, Style, POINTS, Animator } from '../../lines/src/Lines.js';

/**
 * draw the spiders web
 * @returns { display, getConnection }
 */
export function Web(sfx) {
	
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

	let treeList = []; // track connected trees, is this ever used? -- maybe just need tree count
	let prevTreeLocation; // location of tree under player

	/* testing (still?) continuous web vs segmented */
	let continuousWeb = true;
	document.addEventListener('keydown', ev => {
		if (ev.code === 'KeyT') {
			continuousWeb = !continuousWeb;
			console.log('Continuous web toggled', continuousWeb);
		}
	});

	/**
	 * display web animation
	 */
	function display() {
		animation.draw();
	}

	/**
	 * end active line drawing}
	 */
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

	// do this with animator?
	// can't because its only one frame and no update func
	// that why coding is cool! i can do whatever
	function startOverride() {
		let w = 4, s = 0.1, n = 10;
		console.log({animation})
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

	/**
	 * get clone of points in web drawing
	 * @param  {Boolean} { trimmed } trim off dangling spider points
	 * @returns {number[]} points
	 */
	function getPoints(trimmed=false) {
		const points = structuredClone(drawing.points)
		if (trimmed) {
			while (points.slice(-1)[0] !== POINTS.END && points.length > 0) {
				points.pop();
			}
		}
		return points;
	}

	/**
	 * pop off last two poits to stop drawing web
	 * when cacncelling drawing or getting symbol
	 */
	function cancel() {
		drawing.points.pop();
		drawing.points.pop();
		isActive = false;
	}

	// this also draws?
	/**
	 * draws web and tests connections
	 * @param  {Player}
	 * @param  {Boolean|Array} location of tree spider is on or false
	 * @returns {WEB_CONNECTION} type of web connection, NONE, STARTED, CONNECTED, RELEASED, CANCELED
	 */
	function getConnection(player, treeLocation) {

		if (player.input.c) {
			player.input.c = false;
			// better than player.resetInput('c') ?
			clear();
			return Consts.WEB_CONNECTIONS.CLEARED;
		}

		// cancel web
		if (player.input.z) {
			player.resetInput();
			if (treeList.length > 1 && continuousWeb) {
				drawing.points.pop(); // last spider point
				end();
				treeList = [];
				sfx.play('cancel');
				return Consts.WEB_CONNECTIONS.RELEASED;
			}
			if (isActive) {
				cancel();				
				return Consts.WEB_CONNECTIONS.CANCELED;
			}
		}

		if (treeLocation) {
			if (player.input.x) {
				player.resetInput();
				if (!isActive) {

					isActive = true;
					drawing.add([
						treeLocation[0] + Consts.CELL_SIZE.W / 2, 
						treeLocation[1] + Consts.CELL_SIZE.H / 2
					]);
					
					// living reference, tracks player
					drawing.add(player.position);
					
					treeList.push(structuredClone(treeLocation));
					prevTreeLocation = structuredClone(treeLocation);
					sfx.play('connect');
					return Consts.WEB_CONNECTIONS.STARTED;

				} else if (prevTreeLocation[0] !== treeLocation[0] || prevTreeLocation[1] !== treeLocation[1]) {

					drawing.insert([
						treeLocation[0] + Consts.CELL_SIZE.W / 2,
						treeLocation[1] + Consts.CELL_SIZE.H / 2
					]);
					
					sfx.play('connect');
					if (!continuousWeb) {
						end();
						return Consts.WEB_CONNECTIONS.RELEASED;
					} else {
						drawing.insert(POINTS.END);
						drawing.insert([
							treeLocation[0] + Consts.CELL_SIZE.W / 2,
							treeLocation[1] + Consts.CELL_SIZE.H / 2
						]);
						prevTreeLocation = treeLocation;
						treeList.push([...treeLocation]);
						return Consts.WEB_CONNECTIONS.COMPLETED;
					}
				} else {
					sfx.play('cancel');
					return Consts.WEB_CONNECTIONS.NONE;
				}
			}
		}
	}

	return { 
		display, getConnection, getPoints, cancel, startOverride, end,
		isActive() { return isActive; }
	};
}