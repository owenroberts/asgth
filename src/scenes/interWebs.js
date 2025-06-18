import { randomInt, Counter } from '../../cool/cool.js';
import { Scene, Sprite, TextSprite } from '../../lines/src/Engine.js';
import { Animator } from '../../lines/src/Lines.js';
import { Strings } from '../Strings.js';
import { Consts } from '../Consts.js';

export function interWebs(gm) {
	
	const scene = new Scene();
	const sprite = scene.addSprite(new Sprite(0, 0, gm.anims.sprites.webs_2));
	sprite.animation.frame = randomInt(0, 6);
	const counter = new Counter(Consts.WEBS_INTERVAL);
	const animator = new Animator(sprite.animation, {
		segmentNum: [1, 3],
		jiggleRange: [1, 2],
	});

	scene.setup = function() {
		animator.set();
		counter.reset();
	};

	scene.onUpdate = function() {
		counter.update();
		if (counter.isDone()) {
			gm.sq.next();
		}
	};

	return scene;
}
