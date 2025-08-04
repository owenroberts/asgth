import { Counter, assert } from '../../cool/cool.js';
import { Sprite } from '../../lines/src/Engine.js';
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

export class Spider extends Sprite {
	
	constructor(gm) {
		super(0, 0, gm.anims.sprites.spider);

		this.bounds = gm.bounds;
		this.input = gm.input;

		this.debug = true;

		this.prevPosition = [0, 0];
		this.direction = Directions.UP;

		this.rightCounter = new Counter(8);
		this.rightCounter.end();
		this.leftCounter = new Counter(8);
		this.leftCounter.end();

		this.animation.state = "idle_right";
		this.colliderOffset = [16, 16];
		this.setCollider(16, 16, 32, 32);
	}

	spawn(x, y, dir) {
		assert(Number.isFinite(x), "x is not a number");
		assert(Number.isFinite(y), "y is not a number");
		this.bbox.setPosition(x, y);
		if (dir) this.direction = Directions[dir];
	}

	moveBack() {
		this.bbox.setPosition(this.prevPosition[0], this.prevPosition[1]);
	}

	isMoving() {
		return this.input.getKey('UP') || this.input.getKey('DOWN') || this.input.getKey('LEFT') || this.input.getKey('RIGHT');
	}

	update(time) {

		// for back, collision with walls
		this.prevPosition = this.bbox.position;
		// console.log(this.input.getKey('RIGHT'))
		
		if (this.input.getKey('RIGHT') && !this.input.getKey('LEFT') && this.rightCounter.isDone()) {
			this.direction = (this.direction + 1) % 8;
			this.rightCounter.reset();
		}

		if (this.input.getKey('LEFT') && !this.input.getKey('RIGHT') && this.leftCounter.isDone()) {
			this.direction = (8 + (this.direction - 1) % 8) % 8;
			this.leftCounter.reset();
		}

		this.rightCounter.update();
		this.leftCounter.update();

		const speed = this.input.getKey('UP') ? 
			[
				directionSpeeds[this.direction][0],
				directionSpeeds[this.direction][1],
			] :
			[0, 0];

		const state = (speed[0] === 0 && speed[1] === 0) ? 
			'idle_' + directionStates[this.direction] :
			directionStates[this.direction] ;

		this.animation.state = state;

		speed[0] *= time * Consts.SPEED_TIME;
		speed[1] *= time * Consts.SPEED_TIME;

		this.bbox.addPosition(speed[0], speed[1]);
		this.collider.setPosition(this.bbox.x + this.colliderOffset[0], this.bbox.y + this.colliderOffset[1]);

		if (!this.bbox.isColliding(this.bounds)) {
			this.moveBack();
		}
	}
}
