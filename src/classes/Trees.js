class Trees extends Texture {
	update(player) {
		// return this.collide(player);
		for (let i = 0; i < this.locations.length; i++) {
			let x = this.locations[i][0];
			let y = this.locations[i][1];
			if (this.center) {
				x -= this.halfWidth;
				y -= this.halfHeight;
			}

			if (player.tap(x, y)) {
				return [x, y];
			}
		}
		return false;

	}
}