class Wall extends ColliderSprite {
	constructor(params, debug) {
		const { x, y, texture, matrix } = params;
		// super(x * cellSize.w, y * cellSize.h, cellSize.w, cellSize.h);
		super(x * cellSize.w, y * cellSize.h);
		this.halfWidth = Math.round(cellSize.w / 2);
		this.halfHeight = Math.round(cellSize.h / 2);
		this.size = [cellSize.w, cellSize.h];
		this.setCollider(0, 0, cellSize.w, cellSize.h);

		this.center = true;
		this.debug = false;
		this.origin = [x, y];

		this.texture = new Texture({
			center: true,
			animation: texture ? texture : gme.anims.textures.walls
		}, false);
		
		if (!texture.states.wall) console.log('no wall state', texture);
		this.texture.addLocation(x, y, texture.states.wall.start);
		
		// const m = matrix.join('').toString();
		// let f = texture.states[m] ? texture.states[m].start : 0;
		// this.texture.addLocation(x, y, f);
	}

	display() {
		super.display();
		this.texture.display();
	}

	update(offset) {
		this.position[0] = this.origin[0] + offset[0];
		this.position[1] = this.origin[1] + offset[1];
		this.texture.update(offset);
	}
}