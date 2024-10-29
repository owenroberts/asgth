import { Texture } from '../../lines/src/GameEngine.js';

export class Trees extends Texture {
	update(player) {
		// return this.collide(player);
		for (let i = 0; i < this.locations.length; i++) {
			let x = this.locations[i][0];
			let y = this.locations[i][1];
			if (this.center) {
				x -= this.halfWidth;
				y -= this.halfHeight;
			}

			if (player.tap(x + 32, y + 32)) {
				return [x, y];
			}
		}
		return false;
	}

	shake(offset) {
		this.offset[0] = offset[0];
		this.offset[1] = offset[1];
	}
}