class Player extends ColliderSprite {
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

		this.useSfx = false;

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

		// this.items = [];
		this.currencyCount = 0;

		this.poopCounter = 0;
		this.poopInterval = 100;
		this.food = 0;
	}

	setAnimation(animation) {
		this.addAnimation(animation);
		this.animation.state = 'idle';
		this.setCollider(8, 8, 48, 48);
	}

	addItem(letter, n) {
		for (let i = 0; i < n; i++) {
			this.items.push(letter);
		}
	}

	removeItem(letter, n) {
		for (let i = 0; i < n; i++) {
			const index = this.items.indexOf(letter);
			this.items.splice(index, 1);
		}
	}

	eatFood() {
		this.food++;
		this.poopCounter = 0;
	}

	poop() {
		levels[currentLevel].addMoney(this.mapPosition);
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

	resetInput() {
		this.input = { right: false, up: false, left: false, down: false, x: false, z: false, c: false, v: false, b: false, n: false, m: false };
	}

	update(time, canMove) {

		if (this.food > 0) {
			this.poopCounter++;
			if (this.poopCounter === this.poopInterval) {
				this.poop();
				this.food--;
				if (this.food > 0) this.poopCounter = 0;
			}
		}

		this.prevPosition = [...this.position];
		
		let state = this.animation.stateName.includes('idle') ?
			this.animation.stateName :
			Cool.random(['idle']);

		const speed = [0, 0];

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

		speed[0] *= time / 100;
		speed[1] *= time / 100;

		// this.mapPosition[0] += speed[0];
		// this.mapPosition[1] += speed[1];
		this.position[0] += speed[0];
		this.position[1] += speed[1];

		this.animation.state = state;

		if (this.soundEnabled) {
			this.stepCount++;
			if (state !== 'idle' && this.stepCount > this.stepInterval) {
				this.sfxPlayer.player(this.stepSamples[idx]).start();
				this.stepCount = 0;
			}
		}
	}

	back() {
		this.mapPosition = [...this.prevPosition]; // for collisions
	}

	spawn(map) {
		const nodes = shuffle(map.nodes.filter(node => node.room));
		let location;
		for (let i = 0; i < nodes.length; i++) {
			location = nodes[i].room.getCell('player');
			if (location) break;
		}
		this.mapPosition[0] = location.x * cellSize.w; 
		this.mapPosition[1] = location.y * cellSize.h;
	}

	display() {
		super.display();

		// debug opject ?
		if (mapAlpha > 0) {
			gme.renderer.ctx.globalAlpha = mapAlpha;
			gme.renderer.ctx.fillStyle = 'blue';

			gme.renderer.ctx.fillRect(
				this.mapPosition[0] / cellSize.w * mapCellSize - mapCellSize * 0.5, 
				this.mapPosition[1] / cellSize.h * mapCellSize - mapCellSize * 0.5, 
				mapCellSize / 2,
				mapCellSize / 2,
			);

			gme.renderer.ctx.globalAlpha = 1.0;
		}
	}

	playSFX(type) {
		if (this.soundEnabled) {
			if (!this.sfxSamples.hasOwnProperty(type)) type = 'special';
			let sample = Cool.random(this.sfxSamples[type]);
			this.sfxPlayer.player(sample).start();
		}
	}

	soundSetup() {

		sound.setBPM(player.speed[0]);

		const urls = {};
		const sfx = {
			'continue': 2,
			'dead': 2,
			'eat': 2,
			'fight': 1,
			'gate': 6,
			'read': 6,
			'sacrifice': 3,
			'special': 2
		};

		this.sfxSamples = {};

		for (const key in sfx) {
			this.sfxSamples[key] = [];
			for (let i = 1; i <= sfx[key]; i++) {
				urls[`${key}-${i}`] = `sfx/${key}-${i}.mp3`;
				this.sfxSamples[key].push(`${key}-${i}`);
			}
		}

		this.stepSamples = [];
		const steps = {
			'step': 10,
			'stones': 6,
			'mud': 6,
			'splash': 3
		};
		
		for (const key in steps) {
			for (let i = 1; i <= steps[key]; i++) {
				urls[`${key}-${i}`] = `footsteps/${key}-${i}.mp3`;
				this.stepSamples.push(`${key}-${i}`);
			}
		}

		this.sfxPlayer = new Tone.Players({volume: -6}).toDestination();
		// this.sfxPlayer.volume = -6;
		console.time('load sfx');
		let samples = new Tone.ToneAudioBuffers({
			urls: urls,
			baseUrl: "./audio/",
			onload: () => {
				console.timeEnd('load sfx');
				for (let url in urls) {
					this.sfxPlayer.add(url, samples.get(url));
				}
				this.soundEnabled = true;
			}
		});

		/*
			sounds (remember to stick this somewhere visible)
			https://freesound.org/people/MWLANDI/sounds/85858/
			https://freesound.org/people/MWLANDI/sounds/85857/
			https://freesound.org/people/InspectorJ/sounds/329603/
			https://freesound.org/people/InspectorJ/sounds/329602/
			https://freesound.org/people/florianreichelt/sounds/459964/
		*/
	}
}