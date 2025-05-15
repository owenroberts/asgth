import { Player } from './classes/Player.js';
import { Counter } from '../cool/cool.js';

export class Spider extends Player {
	constructor(x, y, states, bounds, debug) {
		super(Math.round(x), Math.round(y));

		/* 
			direcitons
			7 0 1
			6 x 2
			5 3 2
		*/

		this.direction = 0;
		this.directionStates = [
			'up', 'up_right', 'right', 'down_right', 'down', 'down_left', 'left', 'up_left',
		];
		const speed = 16;
		this.directionSpeeds = [
			[0, -speed],
			[speed * 0.71, -speed * 0.71],
			[speed, 0],
			[speed * 0.71, speed * 0.71],
			[0, speed],
			[-speed * 0.71, speed * 0.71],
			[-speed, 0],
			[-speed * 0.71, -speed * 0.71],			
		];
		this.rightCounter = new Counter(8);
		this.leftCounter = new Counter(8);
		this.rightCounter.end();
		this.leftCounter.end();
		this.bounds = structuredClone(bounds);
	}

	setAnimation(animation) {
		super.setAnimation(animation);
		this.animation.state = 'idle_right';
		this.setCollider(8, 8, 48, 48);
	}

	update(time, canMove) {

		this.prevPosition = [...this.position];
		
		if (this.input.right && !this.input.left && this.rightCounter.isDone()) {
			this.direction = (this.direction + 1) % 8;
			this.rightCounter.reset();
		}
		if (this.input.left && !this.input.right && this.leftCounter.isDone()) {
			this.direction = (8 + (this.direction - 1) % 8) % 8;
			this.leftCounter.reset();
		}

		this.rightCounter.update();
		this.leftCounter.update();

		const speed = this.input.up ? 
			[...this.directionSpeeds[this.direction]] :
			[0, 0];

		const state = (speed[0] === 0 && speed[1] === 0) ? 
			'idle_' + this.directionStates[this.direction] :
			this.directionStates[this.direction] ;
		this.animation.state = state;

		speed[0] *= time / 100;
		speed[1] *= time / 100;

		if (this.position[0] + speed[0] > this.bounds.left &&
			this.position[0] + speed[0] < this.bounds.right) {
			this.position[0] += speed[0];
		}

		if (this.position[1] + speed[1] > this.bounds.top &&
			this.position[1] + speed[1] < this.bounds.bottom) {
			this.position[1] += speed[1];
		}
	}

	spawn(location) {
		this.position[0] = location[0];  
		this.position[1] = location[1];
	}

	back() {
		this.position = [...this.prevPosition];
	}
}