import { randomInt, Counter } from '../../cool/cool.js';
import { Texture, Sprite } from '../../lines/src/Engine.js';
import { Animator } from '../../lines/src/Lines.js';
import { Consts } from '../Consts.js';

/**
 * Draw and manage trees for walk and draw levels
 * @param {Game} gm - game manager {}
 */
export function Trees(gm) {

	// turn trees into a scene?
	const texture = new Texture({ animation: gm.anims.sprites.trees });
	const animator = Animator(texture.animation, {
		jiggleRange: [1, 1],
		segmentNum: [2, 3],
	});
	// animator.set();
	const animCounter = Counter(24, () => { 
		animator.set(); 
	});
	animCounter.setLoop(true);
	const select = new Sprite(0, 0, gm.anims.sprites.select);
	select.isActive = false;
	select.animation.play();
	
	/**
	 * Detect if player is colliding with a tree
	 * @param  {Object}  player
	 * @return {(boolean|Array)}	either false, or colliding tree position array
	 */
	function isColliding(player) {
		// return this.collide(player);
		for (let i = 0; i < texture.locations.length; i++) {
			let x = texture.locations[i][0];
			let y = texture.locations[i][1];
			if (player.tap(x + 32, y + 32)) {
				select.position = [x, y];
				select.isActive = true;
				return [x, y];
			}
		}
		select.isActive = false;
		return false;
	}

	/**
	 * animate trees shaking while rock is moving in scene.
	 */
	function shake() {
		texture.offset[0] = randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT); 
		texture.offset[1] = randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT);
		animCounter.update();
	}

	function startRock() {
		select.isActive = false;
		animator.set(); 
	}

	return { 
		isColliding, shake, startRock,
		getSprites: () => { return [texture, select]; },
		getTexture: () => { return texture; },
		addLocation: (x, y, frameIndex) => { texture.addLocation(x, y, frameIndex); },
		clear: () => { texture.clear(); },
		clearAnimator: () => { 
			animator.clear();
			texture.offset = [0, 0];
		},
	};
}