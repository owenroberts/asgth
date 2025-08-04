import { Consts } from '../Consts.js';
import { GameAnim, Sprite } from '../../lines/src/Engine.js';
import { Drawing, Layer, Style, Points, Animator } from '../../lines/src/Lines.js';

/**
 * draw the spiders web
 */
export class Web extends Sprite {

	constructor(gm) {
		super();

		this.sfx = gm.sfx;
		this.input = gm.input;

		this.isDrawing = false; // toggle for starting web drawing

		this.animation = new GameAnim(gm);
		this.animation.width = gm.window.width;
		this.animation.height = gm.window.height
		this.addAnimation(this.animation);

		this.drawing = new Drawing();
		this.animation.drawings.push(this.drawing);
		this.animation.layers.push(new Layer());
		this.animation.styles.push(new Style({
			color: '#FFFFFF', 
			segmentNum: 10,
			wiggleRange: 4,
			wiggleSegments: true,
		}));
		this.animation.setFrames();

		this.treeList = []; // track connected trees
		this.prevTreeLocation; // location of tree under player

		this.playerPosition = [0, 0];
	}

	/**
	 * end active line drawing
	 */
	end() {
		this.drawing.points.pop();
		this.isDrawing = false;
		if (this.drawing.points.slice(-1) !== Points.END) {
			this.drawing.add(Points.END);
		}
	}

	clear() {
		this.drawing.points = [];
		this.drawing.offsets = [];
		this.isDrawing = false;
	}
	
	/**
	 * starts animation during rock phase
	 * animator doesn't work here, just 1 farme
	 */
	startOverride() {
		// try pass by ref?
		// eventually convert to keyframes?
		let w = 4, s = 0.1, n = 10;
		this.animation.onDraw = () => {
			if (w < 32) {
				w += 0.04;
				s += 0.004;
				n += 0.1;
				this.animation.overrideProperty('wiggleRange', w);
				this.animation.overrideProperty('wiggleSpeed', s);
				this.animation.overrideProperty('segmentNum', n);

			}
		}
	}

	/**
	 * get clone of points in web drawing
	 * @param  {Boolean} { trimmed } trim off dangling spider points
	 * @returns {number[]} points
	 */
	getPoints(trimmed=false) {
		const points = structuredClone(this.drawing.points);
		if (trimmed) {
			while (points.slice(-1)[0] !== Points.END && points.length > 0) {
				points.pop();
			}
		}
		return points;
	}

	/**
	 * pop off last two poits to stop drawing web
	 * when cacncelling drawing or getting symbol
	 */
	cancel() {
		this.drawing.points.pop();
		this.drawing.points.pop();
		this.isDrawing = false;
	}

	isNotPrevTree(treeLocation) {
		return (this.prevTreeLocation[0] !== treeLocation[0] || 
			this.prevTreeLocation[1] !== treeLocation[1]);
	}

	/**
	 * adds points web and tests connections
	 * @param  {Player}
	 * @param  {Boolean|Array} location of tree spider is on or false
	 * @returns {WEB_CONNECTION} type of web connection, NONE, STARTED, CONNECTED, RELEASED, CANCELED
	 */
	getConnection(player, treeLocation) {

		// don't rewrite reference
		this.playerPosition[0] = player.bbox.centeredPosition[0];
		this.playerPosition[1] = player.bbox.centeredPosition[1];


		// clear web
		if (this.input.triggerKey('BTN_3')) {
			if (this.drawing.length > 0) {
				this.sfx.play("web_clear");
				this.sfx.play("web_clear_web");
			}
			this.clear();
			return Consts.WEB_CONNECTS.CLEARED;
		}

		// cancel web
		if (this.input.triggerKey('BTN_2')) {
			if (this.treeList.length > 1) {
				this.drawing.points.pop(); // last spider point
				this.end();
				this.treeList = [];
				this.sfx.play('cancel');
				return Consts.WEB_CONNECTS.RELEASED;
			}
			if (this.isDrawing) {
				this.cancel();		
				// sfx?		
				return Consts.WEB_CONNECTS.CANCELED;
			}
		}


		if (treeLocation) {
			if (this.input.triggerKey('BTN_1')) {

				if (!this.isDrawing) {
					this.isDrawing = true;

					this.drawing.add([
						treeLocation[0] + Consts.CELL_SIZE.W2, 
						treeLocation[1] + Consts.CELL_SIZE.H2,
					]);
					
					// pass by reference, tracks player
					this.drawing.add(this.playerPosition);

					this.treeList.push(structuredClone(treeLocation));
					this.prevTreeLocation = structuredClone(treeLocation);
					this.sfx.play('connect');
					return Consts.WEB_CONNECTS.STARTED;

				} else if (this.isNotPrevTree(treeLocation)) {

					this.drawing.insert([
						treeLocation[0] + Consts.CELL_SIZE.W2,
						treeLocation[1] + Consts.CELL_SIZE.H2,
					]);
					
					this.sfx.play('connect');
					this.drawing.insert(Points.END);
					this.drawing.insert([
						treeLocation[0] + Consts.CELL_SIZE.W2,
						treeLocation[1] + Consts.CELL_SIZE.H2,
					]);
					this.prevTreeLocation = structuredClone(treeLocation);
					this.treeList.push([...treeLocation]);
					return Consts.WEB_CONNECTS.COMPLETED;
				} else {
					this.sfx.play('cancel');
					return Consts.WEB_CONNECTS.NONE;
				}
			}
		}
	}
}