import { Consts } from '../Consts.js';
import { GameAnim, Sprite } from '../../lines/src/Engine.js';
import { Drawing, Layer, Style, Points } from '../../lines/src/Lines.js';

export class Tracing extends Sprite {

	constructor(gm, pattern, startTile, ignoreOffset=false) {
		super(0, 0);

		this.sfx = gm.sfx;
		this.input = gm.input;

		this.isActive = false;

		const animation = new GameAnim();
		animation.width = gm.width;
		animation.height = gm.height;
		this.addAnimation(animation);
		
		const drawing = new Drawing();
		animation.drawings.push(drawing);
		animation.layers.push(new Layer());
		animation.styles.push(new Style({
			color: '#5d5c99',
	 		segmentNum: 10,
			wiggleRange: 4,
			wiggleSegments: true,
		}));
		animation.setFrames();

		// offset issue
		let left = Math.min(...pattern.flatMap(p => p).map(p => p[0]));
		let top = Math.min(...pattern.flatMap(p => p).map(p => p[1]));

		// adds 0.5 to center web points in middle of tree tile
		let offset = {
			w: Consts.CELL_SIZE.W * (0.5 - (ignoreOffset ? 0 : left)),
			h: Consts.CELL_SIZE.H * (0.5 - (ignoreOffset ? 0 : top)), 
		};

		for (let i = 0; i < pattern.length; i++) {
			let line = pattern[i];
			drawing.add([
				(line[0][0] + startTile.x) * Consts.CELL_SIZE.W + offset.w,
				(line[0][1] + startTile.y) * Consts.CELL_SIZE.H + offset.h,
			]);
			drawing.add([
				(line[1][0] + startTile.x) * Consts.CELL_SIZE.W + offset.w,
				(line[1][1] + startTile.y) * Consts.CELL_SIZE.H + offset.h,
			]);
			drawing.add(Points.END);
		}
	}

	update() {
		if (this.input.triggerKey('v')) {
			this.activate();
		}
	}

	activate() {
		if (this.isActive) return;
		this.isActive = true;
		this.sfx.play("vis_on", { randomRate: true });
		
		setTimeout(() => {
			this.isActive = false;
			this.sfx.play("vis_off", { randomRate: true });
		}, Consts.TRACING_TIMEOUT);
	}
}