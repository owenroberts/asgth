import { Texture } from '../lines/src/Engine.js';
import { Animator } from '../lines/src/Lines.js';
import { Consts } from './Consts.js';

/**
 * Draw and manage trees for walk and draw levels
 * @param {Object} animation animation for tree texture
 */
export function Trees(animation) {

	const texture = new Texture({ animation });
	const animator = new Animator(texture.animation, {
		jiggleRange: [1, 1],
		segmentNum: [2, 3],
	});
	// animator.update();

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
			if (texture.center) {
				x -= texture.halfWidth;
				y -= texture.halfHeight;
			}

			if (player.tap(x + 32, y + 32)) {
				return [x, y];
			}
		}
		return false;
	}

	/**
	 * Animate trees shaking while rock is moving in scene.
	 */
	function shake() {
		texture.offset[0] = Cool.randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT); 
		texture.offset[1] = Cool.randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT);
	}

	function clearTweens() {
		texture.animation.layers.forEach(l => { l.tweens = []; });
	}

	function reset() {
		// texture.animation.cancelOverride();
		// texture.animation.update(); // trees still on override ... 
		// texture.animation.onDraw = undefined;
		animator.update();
	}

	return { 
		isColliding, reset, shake, clearTweens,
		getTexture: () => { return texture; },
		addLocation: (x, y, frameIndex) => { texture.addLocation(x, y, frameIndex); },
		clear: () => { texture.clear(); },
		empty: () => { texture.locations = []; },
		// updateAnimator: () => { animator.update(); },
	};


}