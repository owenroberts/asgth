/*
	handle sun progress and reset
*/

import * as Cool from '../cool/cool.js';
import { Counter } from '../lines/src/Engine.js';
import { Consts } from './Consts.js';

export function Sun(sprite, height) {

	const counter = new Counter(Consts.SUN_INTERVAL);
	let animation = new Counter(Consts.SUN_INTERVAL);

	function reset() {
		counter.set(Consts.SUN_INTERVAL);
		counter.reset();
		animation.reset();
	}

	function levelSetup() {
		counter.set(Consts.SUN_INTERVAL);
		animation.set(Consts.SUN_INTERVAL);
		counter.setDuration(Consts.SUN_INTERVAL);
		animation.setDuration(Consts.SUN_INTERVAL);
		counter.reset();
		animation.reset();
	}

	function update() {
		counter.update();
		animation.update();

		const progress = Math.sin(animation.getRatio() * Math.PI);
		sprite.position[1] = Cool.map(progress, 0, 1, height - 76, 0, true);

		return counter.isDone();
	}

	function end() {
		const { count, duration } = counter;
		const ratio = counter.getRatio();
		counter.set(-Consts.SUN_FINISH_COUNT);
		const a = Consts.SUN_FINISH_COUNT * (duration / (duration - count));
		animation.setDuration(a);
		animation.set(ratio * a);
	}

	return { 
		update, reset, end, levelSetup,
		getSprite: () => { return sprite; },
	};
}