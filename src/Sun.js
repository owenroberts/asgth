import { Sprite } from '../lines/src/Engine.js';
import { Counter, map } from '../cool/cool.js';
import { Consts } from './Consts.js';

/**
 * Animate sun progress, reset
 * @param {Sprite} sprite - the sun sprite
 * @param {number} height - the height to animate sun
 */
export function Sun(gm) {

	// make this a scene?? components?

	const sprite = new Sprite(12.85 * Consts.CELL_SIZE.W, 6 * Consts.CELL_SIZE.H, gm.anims.sprites.sun);
	const counter = new Counter(Consts.SUN_INTERVAL);
	const animation = new Counter(Consts.SUN_INTERVAL);

	function reset() {
		counter.setCount(Consts.SUN_INTERVAL);
		counter.reset();
		animation.reset();
	}

	function setup() {
		counter.setCount(Consts.SUN_INTERVAL);
		animation.setCount(Consts.SUN_INTERVAL);
		counter.setDuration(Consts.SUN_INTERVAL);
		animation.setDuration(Consts.SUN_INTERVAL);
		counter.reset();
		animation.reset();
	}

	function update() {
		counter.update();
		animation.update();
		const progress = Math.sin(animation.getProgress() * Math.PI);
		sprite.position[1] = map(progress, 0, 1, 5.75 * Consts.CELL_SIZE.H, Consts.CELL_SIZE.H / 4, true);
	}

	function end() {
		const count = counter.getCount();
		const duration = counter.getDuration();
		const progress = counter.getProgress();
		counter.setCount(duration - Consts.SUN_FINISH_COUNT);
		const a = Consts.SUN_FINISH_COUNT * (duration / (duration - count));
		animation.setDuration(a);
		animation.setCount(progress * a);
	}

	return { 
		update, reset, end, setup,
		isDone: () => { return counter.isDone(); },
		getSprite: () => { return sprite; },
	};
}