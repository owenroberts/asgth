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
		this.input = gm.input;
		
		this.center = true;
		this.prevPosition = [0, 0];

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

	// getter?
	isMoving() {
		return this.input.getKey('up') || this.input.getKey('down') || this.input.getKey('left') || this.input.getKey('right');
	}

	update(time) {

		// for back, collision with walls
		this.prevPosition[0] = this.position[0];
		this.prevPosition[1] = this.position[1];
		
		if (this.input.getKey('right') && !this.input.getKey('left') && this.rightCounter.isDone()) {
			this.direction = (this.direction + 1) % 8;
			this.rightCounter.reset();
		}

		if (this.input.getKey('left') && !this.input.getKey('right') && this.leftCounter.isDone()) {
			this.direction = (8 + (this.direction - 1) % 8) % 8;
			this.leftCounter.reset();
		}

		this.rightCounter.update();
		this.leftCounter.update();

		const speed = this.input.getKey('up') ? 
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
