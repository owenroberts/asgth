import { Scene, Sprite, TextSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';

export function end(gm) {

	const scene = new Scene();

	let sprite = scene.add(new Sprite(0, 0, gm.anims.sprites.ending));
	sprite.animation.play();

	sprite.animation.play();
	sprite.animation.onPlayedOnce = function() {
		
		sprite.animation.state = "still_frame";
		
		scene.add(new TextSprite({
			msg: Strings.RESET_BTN,
			x: Consts.CELL_SIZE.W * 2,
			y: Consts.CELL_SIZE.H * 5.5,
			letters: gm.anims.sprites.letters_keyboard,
		}));
		
		scene.add(new TextSprite({
			msg: Strings.INST_RESTART,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 3,
			y: Consts.CELL_SIZE.H * 5.5,
			letters: gm.anims.sprites.letters,
		}));
	};


	return scene;
}