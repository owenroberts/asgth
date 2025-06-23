import { Counter, assert } from '../../cool/cool.js';
import { ColliderSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';

/**
 * player controller - returns sprite with player funcs
 * @param {Object} gm - game
 * @returns Sprite;
 */
export function Spider(gm) {

	const sprite = new ColliderSprite(0, 0);
	sprite.addAnimation(gm.anims.sprites.spider);
	sprite.center = true;
	// sprite.debug = true;
	const prevPosition = [0, 0];
	sprite.input = { right: false, up: false, left: false, down: false, x: false, z: false, c: false };

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

	let direction = Directions.UP;
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

	const rightCounter = new Counter(8);
	rightCounter.end();
	const leftCounter = new Counter(8);
	leftCounter.end();

	sprite.animation.state = "idle_right";
	sprite.setCollider(16, 16, 32, 32);

	sprite.spawn = function(location, dir) {
		assert(Number.isFinite(location[0]), "x is not a number");
		assert(Number.isFinite(location[1]), "y is not a number");
		sprite.position[0] = location[0];
		sprite.position[1] = location[1];
		if (dir) direction = Directions[dir];
	};

	// better name for this ... 
	sprite.back = function() {
		sprite.position[0] = prevPosition[0];
		sprite.position[1] = prevPosition[1];
	};

	sprite.inputKey = function(key, state) {
		sprite.input[key] = state;
	};

	sprite.resetInput = function() {
		this.input = { right: false, up: false, left: false, down: false, x: false, z: false, c: false, v: false, b: false, n: false, m: false };
	};

	sprite.isMoving = function() {
		return this.input.up || this.input.down || this.input.right || this.input.left;
	};

	sprite.update = function(time, canMove) {

		// for back, collision with walls
		prevPosition[0] = sprite.position[0];
		prevPosition[1] = sprite.position[1];
		
		if (sprite.input.right && !sprite.input.left && rightCounter.isDone()) {
			direction = (direction + 1) % 8;
			rightCounter.reset();
		}

		if (sprite.input.left && !sprite.input.right && leftCounter.isDone()) {
			direction = (8 + (direction - 1) % 8) % 8;
			leftCounter.reset();
		}

		rightCounter.update();
		leftCounter.update();

		const speed = sprite.input.up ? 
			[directionSpeeds[direction][0], directionSpeeds[direction][1]] :
			[0, 0];

		const state = (speed[0] === 0 && speed[1] === 0) ? 
			'idle_' + directionStates[direction] :
			directionStates[direction] ;

		sprite.animation.state = state;

		speed[0] *= time / 100;
		speed[1] *= time / 100;

		if (sprite.position[0] + speed[0] > gm.bounds.left &&
			sprite.position[0] + speed[0] < gm.bounds.right) {
			sprite.position[0] += speed[0];
		}

		if (sprite.position[1] + speed[1] > gm.bounds.top &&
			sprite.position[1] + speed[1] < gm.bounds.bottom) {
			sprite.position[1] += speed[1];
		}
	};

	return sprite;
}
