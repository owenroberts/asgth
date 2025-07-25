import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

export function splash(gm) {

	const scene = new Scene();

	scene.setup = function() {
		
		scene.add(new TextSprite({
			countForward: true,
			msg: Strings.TITLE,
			wrap: Consts.TEXT_WRAP,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 2,
			y: Consts.CELL_SIZE.H * 1,
			letters: gm.anims.sprites.letters_white,
		}));

		scene.add(new TextSprite({
			msg: Consts.PRIMARY_BTN,
			x: Consts.CELL_SIZE.W * (2 + 7),
			y: Consts.CELL_SIZE.H * 3,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		scene.add(new TextSprite({
			msg: Strings.START_SOUND,
			countForward: true,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 2,
			y: Consts.CELL_SIZE.H * 3,
			letters: gm.anims.sprites.letters,
		}));

		scene.add(new TextSprite({
			msg: Consts.SECONDARY_BTN,
			x: Consts.CELL_SIZE.W * (2 + 7),
			y: Consts.CELL_SIZE.H * 4.5,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		scene.add(new TextSprite({
			msg: Strings.START_SILENT,
			countForward: true,
			wrap: 14,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 2,
			y: Consts.CELL_SIZE.H * 4.5,
			letters: gm.anims.sprites.letters,
		}));		
	};

	return scene;
}