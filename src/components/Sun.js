import { Sprite } from '../../lines/src/Engine.js';
import { Counter, map } from '../../cool/cool.js';
import { Consts } from '../Consts.js';

/**
 * animate sun progress, reset
 * @param {Sprite} sprite - the sun sprite
 * @param {number} height - the height to animate sun
*/
export function Sun(gm) {

	// make this a scene?? components?
	// this could extend sprite ... or return a sprite
	
	const sprite = new Sprite(12.85 * Consts.CELL_SIZE.W, 6 * Consts.CELL_SIZE.H, gm.anims.sprites.sun);

	const extraTime = gm.props.levelCount * 300 + gm.props.pattern.length * 100;
	const counter = new Counter(Consts.SUN_INTERVAL + extraTime);
	const animation = new Counter(Consts.SUN_INTERVAL + extraTime);

	// console.log('sun', gm.props.levelCount, gm.props.pattern.length, extraTime, Consts.SUN_INTERVAL + extraTime);
	
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
		update, end,
		isDone: () => { return counter.isDone(); },
		getSprite: () => { return sprite; },
	};
}