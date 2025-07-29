import { Scene, Sprite, TextSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';

export class End extends Scene {
	constructor(gm) {
		super();
		
		let sprite = this.add(new Sprite(0, 0, gm.anims.sprites.ending));
		sprite.animation.play();

		sprite.animation.onPlayedOnce = () => {

			sprite.animation.state = "still_frame";
			
			this.add(new TextSprite({
				msg: Consts.RESET_BTN,
				x: Consts.CELL_SIZE.W * 5.5,
				y: Consts.CELL_SIZE.H * 5.5,
				letters: gm.anims.sprites.letters_keyboard,
			}));
			
			this.add(new TextSprite({
				msg: Strings.INST_RESTART,
				wrap: 24,
				track: Consts.LETTERS_TRACK,
				lead: Consts.LETTERS_LEAD,
				x: Consts.CELL_SIZE.W * 0.5,
				y: Consts.CELL_SIZE.H * 5.5,
				letters: gm.anims.sprites.letters,
			}));
		};
	}
}