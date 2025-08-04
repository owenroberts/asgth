import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';
import { TextSprite, SpriteCollection } from '../../lines/src/Engine.js';

export class ContinueUI extends SpriteCollection {

	constructor(gm) {
		super();
		
		this.add(new TextSprite({
			msg: Strings.CONTINUE,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * Consts.TEXT_MARGIN.W,
			y: Consts.CELL_SIZE.H * 5.5,
			letters: gm.anims.sprites.letters,
		}));
		
		this.add(new TextSprite({
			msg: Consts.KEY_DISPLAY.BTN_1,
			x: Consts.CELL_SIZE.W * 4,
			y: Consts.CELL_SIZE.H * 5.5,
			letters: gm.anims.sprites.letters_keyboard,
		}));
	}
}