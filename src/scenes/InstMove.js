import { Counter } from '../../cool/cool.js';
import { Scene, Sprite, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';
import { ContinueUI } from '../components/ContinueUI.js';

export class InstMove extends Scene {

	constructor(gm) {
		super();

		this.input = gm.input;
		this.player = this.add(gm.player);
		
		this.continue = this.add(new ContinueUI(gm));
		this.continue.isActive = false;
		
		// after player presses all three arrow buttons, next
		this.arrowsPressed = [false, false, false]; // up, left, right
		this.isNextReady = false;
		this.nextDelay = new Counter(60, () => {
			this.isNextReady = true;
			this.continue.isActive = true;
		});

		this.add(new TextSprite({
			countForward: true,
			msg: Strings.INST_MOVE_YOU,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: gm.anims.sprites.letters,
			wrap: 14,
		}));

		this.add(new TextSprite({
			countForward: true,
			msg: Strings.INST_MOVE_KEYS,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 1.5,
			letters: gm.anims.sprites.letters,
			wrap: 22,
		}));
		
		this.add(new Sprite(Consts.CELL_SIZE.W * 0.5, Consts.CELL_SIZE.H * 3, gm.anims.sprites.keyboard_arrows));
	}

	setup() {
		this.player.spawn(Consts.CELL_SIZE.W * 5, Consts.CELL_SIZE.H * 3.5);
	}

	update() {
		if (this.input.getKey('UP')) this.arrowsPressed[0] = true;
		if (this.input.getKey('LEFT')) this.arrowsPressed[1] = true;
		if (this.input.getKey('RIGHT')) this.arrowsPressed[2] = true;

		if (this.arrowsPressed.every(a => a)) {
			this.nextDelay.update();
		}
	}
}