import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

export class Splash extends Scene {

	constructor(gm) {
		super();

		this.add(new TextSprite({
			countForward: true,
			message: Strings.TITLE,
			wrap: Consts.TEXT_WRAP,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 2,
			y: Consts.CELL_SIZE.H * 1,
			letters: gm.anims.sprites.letters_white,
		}));

		this.add(new TextSprite({
			message: Consts.KEY_DISPLAY.BTN_1,
			x: Consts.CELL_SIZE.W * (2 + 7),
			y: Consts.CELL_SIZE.H * 3,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		this.add(new TextSprite({
			message: Strings.START_SOUND,
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
			x: Consts.CELL_SIZE.W * (2 + 7),
			y: Consts.CELL_SIZE.H * 4.5,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		this.add(new TextSprite({
			message: Strings.START_SILENT,
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