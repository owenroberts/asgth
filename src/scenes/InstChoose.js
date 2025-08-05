import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

/**
 * option to skip or repeat, if the player has previously completed instructions
 * @param {object} gm - game manager
 */
export class InstChoose extends Scene {

	setup(gm) {
		this.text = this.add(new TextSprite({
			countForward: true,
			message: Strings.INST_CHOOSE,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: gm.anims.sprites.letters,
		}));
	}

	isDone() {
		return this.text.isDone();
	}
}