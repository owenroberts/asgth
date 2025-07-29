import { Counter, assert } from '../../cool/cool.js';
import { ColliderSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';

const Directions = {
	UP: 0,
	UP_RIGHT: 1,
	RIGHT: 2,
	DOWN_RIGHT: 3,
	DOWN: 4,
	DOWN_LEFT: 5,
	LEFT: 6,
	UP_LEFT: 7
};

const directionStates = ['up', 'up_right', 'right', 'down_right', 'down', 'down_left', 'left', 'up_left'];

const speed = 16;
const directionSpeeds = [
	[0, -speed],
	[speed * 0.71, -speed * 0.71],
	[speed, 0],
	[speed * 0.71, speed * 0.71],
	[0, speed],
	[-speed * 0.71, speed * 0.71],
	[-speed, 0],
	[-speed * 0.71, -speed * 0.71],
];

export class Spider extends ColliderSprite {
	
	constructor(gm) {
		super(0, 0, gm.anims.sprites.spider);

		this.bounds = gm.bounds;
		
		this.center = true;
		this.prevPosition = [0, 0];
		this.input = { right: false, up: false, left: false, down: false, x: false, z: false, c: false };

		this.direction = Directions.UP;

		this.rightCounter = new Counter(8);
		this.rightCounter.end();
		this.leftCounter = new Counter(8);
		this.leftCounter.end();

		this.animation.state = "idle_right";
		this.setCollider(16, 16, 32, 32);
	}

	spawn(location, dir) {
		assert(Number.isFinite(location[0]), "x is not a number");
		assert(Number.isFinite(location[1]), "y is not a number");
		this.position[0] = location[0];
		this.position[1] = location[1];
		if (dir) this.direction = Directions[dir];
	}

	// better name for this ... 
	back() {
		this.position[0] = this.prevPosition[0];
		this.position[1] = this.prevPosition[1];
	}

	inputKey(key, state) {
		this.input[key] = state;
	}

	resetInput() {
		this.input = { right: false, up: false, left: false, down: false, x: false, z: false, c: false, v: false, b: false, n: false, m: false };
	}

	// getter?
	isMoving() {
		return this.input.up || this.input.down || this.input.right || this.input.left;
	}

	update(time) {

		// for back, collision with walls
		this.prevPosition[0] = this.position[0];
		this.prevPosition[1] = this.position[1];
		
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
			[
				directionSpeeds[this.direction][0],
				directionSpeeds[this.direction][1],
			] :
			[0, 0];

		const state = (speed[0] === 0 && speed[1] === 0) ? 
			'idle_' + directionStates[this.direction] :
			directionStates[this.direction] ;

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
}
