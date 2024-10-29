import { ColliderSprite} from '../../lines/src/GameEngine.js';

export class Player extends ColliderSprite {
	constructor(x, y, states, debug) {
		super(Math.round(x), Math.round(y));
		this.mapPosition = [Math.round(x), Math.round(y)];
		this.prevPosition = [Math.round(x), Math.round(y)];
		this.center = true; /* need better name */
		
		this.debug = debug || false;
		this.speed = [16, 16];

		this.input = { right: false, up: false, left: false, down: false, x: false, z: false, c: false };

		this.soundEnabled = false;
		this.stepCount = 0;
		this.stepInterval = 32 - this.speed[0] * 2;
		this.sfx = {};

		this.states = {
			idle: 'idle',
			up: 'up',
			down: 'down',
			left: 'left',
			right: 'right',
		};

		if (states) {
			for (const k in states) {
				this.states[k] = states[k];
			}
		}
	}

	setAnimation(animation) {
		this.addAnimation(animation);
		this.animation.state = 'idle';
		this.setCollider(8, 8, 48, 48);
	}

	setSpeed(n) {
		this.speed[0] = +n;
		this.speed[1] = +n;
		this.stepInterval = 32 - this.speed[0] * 2;
		if (this.sfxPlayer) {
			sound.setBPM(player.speed[0]);
		}
	}

	getSpeed() {
		return this.speed[0];
	}

	inputKey(key, state) {
		this.input[key] = state;
	}

	isMoving() {
		return this.input.up || this.input.down || this.input.right || this.input.left;
	}

	resetInput() {
		this.input = { right: false, up: false, left: false, down: false, x: false, z: false, c: false, v: false, b: false, n: false, m: false };
	}

	update(time, canMove) {

		this.prevPosition = [...this.position];
		
		// moving states are up, down, left, right, up_right, down_right, down_left, up_left
		// idle states have idle_ before
		let state = this.animation.stateName.includes('idle') ?
			this.animation.stateName :
			'idle_' + this.animation.stateName;

		const speed = [0, 0];
		const buttonsPressed = (this.input.up ? 1 : 0) +
			(this.input.down ? 1 : 0) + 
			(this.input.right ? 1 : 0) + 
			(this.input.left ? 1 : 0);
		if (buttonsPressed > 2) {
			this.animation.state = state;
			return;
		}

		if (this.input.up) {
			if (this.position[1] > gme.bounds.top && canMove) {
				speed[1] = -this.speed[1];
				if (this.input.left || this.input.right) speed[1] *= 0.71;
			}
			state = this.states.up;
		}

		if (this.input.down) {
			if (this.position[1] < gme.bounds.bottom && canMove) {
				speed[1] = this.speed[1];
				if (this.input.left || this.input.right) speed[1] *= 0.71;
			}
			state = this.states.down;
		}

		if (this.input.right) {
			if (this.position[0] < gme.bounds.right && canMove) {
				speed[0] = this.speed[0];
				if (this.input.left || this.input.right) speed[0] *= 0.71;
			}
			state = this.states.right;
		}

		if (this.input.left) {
			if (this.position[0] > gme.bounds.left && canMove) {
				speed[0] = -this.speed[0];
				if (this.input.left || this.input.right) speed[0] *= 0.71;
			}
			state = this.states.left;
		}

		if (this.input.up && this.input.left) state = this.states.up_left;
		if (this.input.up && this.input.right) state = this.states.up_right;
		if (this.input.down && this.input.left) state = this.states.down_left;
		if (this.input.down && this.input.right) state = this.states.down_right;


		speed[0] *= time / 100;
		speed[1] *= time / 100;

		// this.mapPosition[0] += speed[0];
		// this.mapPosition[1] += speed[1];
		this.position[0] += speed[0];
		this.position[1] += speed[1];

		this.animation.state = state;
	}

	back() {
		this.mapPosition = [...this.prevPosition]; // for collisions
	}

	spawn(location) {
		// const nodes = shuffle(map.nodes.filter(node => node.room));
		// let location = choice(map.walls);
		// console.log(map.walls)
		// for (let i = 0; i < nodes.length; i++) {
		// 	location = nodes[i].room.getCell('player');
		// 	if (location) break;
		// }
		this.position[0] = location[0];  
		this.position[1] = location[1];
	}

	display() {
		super.display();

		// debug opject ?
		// how to debug with modules?
		// if (mapAlpha > 0) {
		// 	gme.renderer.ctx.globalAlpha = mapAlpha;
		// 	gme.renderer.ctx.fillStyle = 'blue';

		// 	gme.renderer.ctx.fillRect(
		// 		this.mapPosition[0] / cellSize.w * mapCellSize - mapCellSize * 0.5, 
		// 		this.mapPosition[1] / cellSize.h * mapCellSize - mapCellSize * 0.5, 
		// 		mapCellSize / 2,
		// 		mapCellSize / 2,
		// 	);

		// 	gme.renderer.ctx.globalAlpha = 1.0;
		// }
	}

}