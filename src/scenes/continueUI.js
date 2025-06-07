import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';
import { TextSprite } from '../../lines/src/Engine.js';

/**
 * provides x btn and continue text for common usage
 * @param  {Object} gm game manager
 * @return {Object} { xBtn, xToContinue }
 */
export function continueUI(gm) {

	const xBtn = new TextSprite({
		msg: Strings.X_BTN,
		x: Consts.CELL_SIZE.W * 0.5,
		y: Consts.CELL_SIZE.H * 5.5,
		letters: gm.anims.sprites.letters_keyboard,
		isActive: false,
	});

	const xToContinue = new TextSprite({
		msg: Strings.CONTINUE,
		wrap: 24,
		track: Consts.LETTERS_TRACK,
		lead: Consts.LETTERS_LEAD,
		x: Consts.CELL_SIZE.W  * 1.5,
		y: Consts.CELL_SIZE.H  * 5.5,
		letters: gm.anims.sprites.letters,
		isActive: false,
	});

	return { xBtn, xToContinue };

}