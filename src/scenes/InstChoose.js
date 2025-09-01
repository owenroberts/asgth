import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

/**
 * option to skip or repeat, if the player has previously completed instructions
 * @extends {Scene}
 */
export class InstChoose extends Scene {

	/**
	 * @param {object} gm - game manager
	 */
	setup(gm) {

		this.add(new TextSprite({
			message: Consts.KEY_DISPLAY.BTN_1,
			x: Consts.CELL_SIZE.W * (2 + 8),
			y: Consts.CELL_SIZE.H * 3,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		this.add(new TextSprite({
			message: Strings.INST_CHOOSE_REVIEW,
			// countForward: true,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 2,
			y: Consts.CELL_SIZE.H * 3,
			letters: gm.anims.sprites.letters,
		}));

		this.add(new TextSprite({
			message: Consts.KEY_DISPLAY.BTN_2,
			x: Consts.CELL_SIZE.W * (2 + 8),
			y: Consts.CELL_SIZE.H * 4.5,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		this.add(new TextSprite({
			message: Strings.INST_CHOOSE_CONTINUE,
			// countForward: true,
			wrap: 14,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 2,
			y: Consts.CELL_SIZE.H * 4.5,
			letters: gm.anims.sprites.letters,
		}));	
	}
}