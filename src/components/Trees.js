import { randomInt, Counter } from '../../cool/cool.js';
import { Texture, Sprite, SpriteCollection } from '../../lines/src/Engine.js';
import { Animator } from '../../lines/src/Lines.js';
import { Consts } from '../Consts.js';

/**
 * SpriteCollection with trees Texture and select circle Sprite
 */
export class Trees extends SpriteCollection {
	
	constructor(gm) {
		super();

		this.texture = this.add(new Texture({ animation: gm.anims.sprites.trees }));
		
		this.animator = new Animator(this.texture.animation, {
			jiggleRange: [1, 1],
			segmentNum: [2, 3],
		});
		
		this.animCounter = Counter(24, () => { 
			this.animator.set(); 
		});
		
		this.animCounter.setLoop(true);
	
		this.select = this.add(new Sprite(0, 0, gm.anims.sprites.select));
		this.select.isActive = false;
		this.select.animation.play();
	}
	
	/**
	 * detect if player is colliding with a tree
	 * @param  {object}  player
	 * @return {boolean|[x, y]}	either false, or colliding tree position array
	 */
	getTreeLocation(player) {
		const treeLocation = this.texture.getCollisionLocation(player.collider);
		if (treeLocation) {
			this.select.setPosition(treeLocation[0], treeLocation[1]);
			this.select.isActive = true;
			return treeLocation;
		} else {
			this.select.isActive = false;
			return false;
		}
	}

	/**
	 * animate trees shaking while rock is moving in scene.
	 */
	shake() {
		this.texture.offset[0] = randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT); 
		this.texture.offset[1] = randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT);
		this.animCounter.update();
	}

	addLocation(x, y, i) {
		this.texture.addLocation(x, y, i);
	}

	startRock() {
		this.select.isActive = false;
		this.animator.set(); 
	}

	clearTrees() { 
		this.texture.clear(); 
	}

	clearAnimator() { 
		this.animator.clear();
		this.texture.offset = [0, 0];
	}
}