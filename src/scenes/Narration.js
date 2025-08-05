import { Scene, Texture, TextSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';
import { ContinueUI } from '../components/ContinueUI.js';

export class Narration extends Scene {
	
	constructor(gm) {
		super();

		this.sfx = gm.sfx;
		this.states = gm.states;

		this.dialogList = []; // sequencer?
		this.isDone = true;

		this.score = this.add(new Texture({ 
			animation: gm.anims.sprites.score,
			isActive: false, 
		}));

		this.text = this.add(new TextSprite({
			x: Consts.CELL_SIZE.W * Consts.TEXT_MARGIN.W,
			y: Consts.CELL_SIZE.H * Consts.TEXT_MARGIN.H,
			wrap: 24,
			letters: gm.anims.sprites.letters,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			countForward: true,
		}));

		this.continue = this.add(new ContinueUI(gm));
		this.continue.isActive = false;
	}

	addDialog(list) {
		if (!Array.isArray(list)) list = [list];
		this.text.setMsg(list[0]);
		this.dialogList = [];
		for (let i = 1; i < list.length; i++) {
			this.dialogList.push(list[i]);
		}
		this.isDone = false;
	}

	next() {
		if (this.text.isDone()) {
			this.sfx.play('next_button', { randomRate: true });
			if (this.dialogList.length > 0) {
				this.text.setMsg(this.dialogList.shift());
			} else {
				this.isDone = true;
			}
		} else {
			this.text.skip();
			this.sfx.play('skip_button', { randomRate: true });
			if (this.dialogList.length === 0) {
				this.isDone = true;
			}
		}
	}

	update() {
		if (!this.text.isDone()) {
			this.continue.isActive = false;
			return;
		} else {
			this.continue.isActive = true;

			if (this.dialogList.length === 0) {
				this.isDone = true;
			} 
		}
	}

	setScore() {
		this.score.isActive = true;

		let scoreX = Consts.CELL_SIZE.W * 13;
		let scoreY = Consts.CELL_SIZE.H * (this.states.points.SPIDER + this.states.points.ROCK - 1);

		let point = this.states.lastPointWinner === 'SPIDER' ? 1 : 0;
		this.score.addLocation(scoreX, scoreY,  point);
	}

	hideScore() {
		this.score.isActive = false;
	}
}