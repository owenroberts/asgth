import { randomInt, Counter } from '../../cool/cool.js';
import { Scene, Sprite, TextSprite } from '../../lines/src/Engine.js';
import { Animator } from '../../lines/src/Lines.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

export class InterWebs extends Scene {

	constructor(gm) {
		super();

		this.sq = gm.sq;

		this.sprite = this.add(new Sprite(0, 0, gm.anims.sprites.webs_2));
		this.counter = new Counter(Consts.WEBS_INTERVAL);
		this.animator = new Animator(this.sprite.animation, {
			segmentNum: [1, 3],
			jiggleRange: [1, 2],
		});
	}

	setup() {
		this.sprite.animation.frame = randomInt(0, 6);
		this.animator.set();
		this.counter.reset();
	}

	update() {
		this.counter.update();
		if (this.counter.isDone()) {
			this.sq.next();
		}
	}
}
