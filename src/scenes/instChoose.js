import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

/**
 * option to skip or repeat, if the player has previously completed instructions
 * @param {Object} sprites - game sprites
 * @returns scene
 */
export function instChoose(gm) {

	const scene = new Scene();
	let instText;

	scene.setup = function() {
		instText = scene.add(new TextSprite({
			countForward: true,
			msg: Strings.INST_CHOOSE,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: gm.anims.sprites.letters,
		}));
	};

	scene.isDone = function() {
		return instText.isDone();
	};

	return scene;
}