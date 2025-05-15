import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

/**
 * option to skip or repeat, if the player has previously completed instructions
 * @param {Object} sprites - game sprites
 * @returns scene
 */
export function InstChoose(sprites) {

	const scene = new Scene();

	scene.setup = function() {
		scene.addToDisplay(new TextSprite({
			countForward: true,
			msg: Strings.INST_CHOOSE,
			wrap: 14,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 2,
			letters: sprites.letters,
		}));
	};

	return scene;
}