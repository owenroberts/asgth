import { randomInt, Counter } from '../../cool/cool.js';
import { TileSet, Sprite, SpriteCollection } from '../../lines/src/Engine.js';
import { Animator } from '../../lines/src/Lines.js';
import { Consts } from '../Consts.js';

/**
 * SpriteCollection with trees TileSet and select circle Sprite
 */
export class Trees extends SpriteCollection {
	
	constructor(gm) {
		super();

		this.debug = true;

		this.tileSet = this.add(new TileSet({ 
			animation: gm.anims.sprites.trees, 
			hasColliders: true
		}));
		
		this.animator = new Animator(this.tileSet.animation, {
			jiggleRange: [1, 1],
			segmentNum: [2, 3],
		});
		
		this.animCounter = new Counter(24, () => {
			this.animator.set();
		});
		this.animCounter.isLoop = true;
	
		this.select = this.add(new Sprite(0, 0, gm.anims.sprites.select));
		this.select.isActive = false;
		this.select.animation.play();
	}
	
	/**
	 * detect if player is colliding with a tree
	 * @param  {object}  player
	 * @return {[x, y]|false}	either false, or colliding tree position array
	 */
	getTreeLocation(player) {
		const treeLocation = this.tileSet.getCollisionLocation(player);
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
		this.tileSet.offset[0] = randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT); 
		this.tileSet.offset[1] = randomInt(-Consts.ROCK_SHAKE_AMOUNT, Consts.ROCK_SHAKE_AMOUNT);
		this.animCounter.update();
	}

	startRock() {
		this.select.isActive = false;
		this.animator.set(); 
	}

	clearTrees() { 
		this.tileSet.clear(); 
	}

	clearAnimator() {
		this.animator.clear();
		this.tileSet.offset = [0, 0];
	}
}