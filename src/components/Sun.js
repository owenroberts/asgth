import { Sprite } from '../../lines/src/Engine.js';
import { Counter, map } from '../../cool/cool.js';
import { Consts } from '../Consts.js';

export class Sun extends Sprite {

	constructor(gm) {
		super(12.85 * Consts.CELL_SIZE.W, 6 * Consts.CELL_SIZE.H, gm.anims.sprites.sun);

		const extraTime = gm.states.levelCount * 300 + gm.states.pattern.length * 100;
	
		this.counter = new Counter(Consts.SUN_INTERVAL + extraTime);
		this.animator = new Counter(Consts.SUN_INTERVAL + extraTime);
	}
	
	update() {
		this.counter.update();
		this.animator.update();
		const progress = Math.sin(this.animator.getProgress() * Math.PI);
		this.bbox.y = map(progress, 0, 1, 5.75 * Consts.CELL_SIZE.H, Consts.CELL_SIZE.H / 4, true);
	}

	end() {
		const count = this.counter.getCount();
		const duration = this.counter.getDuration();
		const progress = this.counter.getProgress();
		this.counter.setCount(duration - Consts.SUN_FINISH_COUNT);
		
		const a = Consts.SUN_FINISH_COUNT * (duration / (duration - count));
		this.animator.setDuration(a);
		this.animator.setCount(progress * a);
	}

	isDone() { return this.counter.isDone(); }

	reset() {
		this.counter.reset();
		this.animator.reset();
	}
}