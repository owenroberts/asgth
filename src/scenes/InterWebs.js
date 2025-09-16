import { randomInt, Counter } from '../../cool/cool.js';
import { Scene, Sprite, TextSprite } from '../../lines/src/Engine.js';
import { Animator } from '../../lines/src/Lines.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

export class InterWebs extends Scene {

	constructor(gm) {
		super();

		this.sprite = this.add(new Sprite(0, 0, gm.anims.sprites.interwebs));
		this.sprite.animation.play();
		this.sprite.animation.onPlayedState = () => {
			gm.sq.next();
		};

		this.animator = new Animator(this.sprite.animation, {
			segmentNum: [1, 3],
			jiggleRange: [1, 2],
		}, ['startIndex', 'endIndex']);
	}

	setup() {
		this.animator.set();
	}
}
