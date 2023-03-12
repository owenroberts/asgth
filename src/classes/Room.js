class Room extends Area {
	constructor(...args) {
		super(...args);

		this.texture = new Trees({
			center: true
		}, false);
		// this.addTextureAnimation();
		this.takenCells = [];
	}

	addTextureAnimation(animation) {
		// this.texture.addAnimation(gme.anims.sprites.room);
		this.texture.addAnimation(animation);
	}

	getLocations() {
		let locations = [];
		for (let x = this.x; x < this.x + this.w; x++) {
			for (let y = this.y; y < this.y + this.h; y++) {
				// this.texture.addLocation(x * cellSize.w + 32, y * cellSize.h + 32, index);
				locations.push([x * cellSize.w + 32,  y * cellSize.h + 32]);
			}
		}
		return locations;
	}

	addLocations(index) {
		for (let x = this.x; x < this.x + this.w; x++) {
			for (let y = this.y; y < this.y + this.h; y++) {
				this.texture.addLocation(x * cellSize.w + 32, y * cellSize.h + 32, index);
			}
		}
	}

	addTextureLocations(matrix, rows, indexes) {
		// console.log(indexes);
		let testMatrix = [];
		
		for (let x = this.x; x < this.x + this.w; x++) {
			for (let y = this.y; y < this.y + this.h; y++) {

				const mt = [
					indexes.includes(matrix[x - 1 + (y - 1) * rows]) ? 1 : 0, // -1, -1
					indexes.includes(matrix[x + (y - 1) * rows]) ? 1 : 0, // 0, -1,
					indexes.includes(matrix[x + 1 + (y - 1) * rows]) ? 1 : 0, // 0, -1,
					indexes.includes(matrix[x - 1 + y * rows]) ? 1 : 0, // -1, 0,
					// 0, 0
					indexes.includes(matrix[x + 1 + y * rows]) ? 1 : 0, // 1, 0,
					indexes.includes(matrix[x - 1 + (y + 1) * rows]) ? 1 : 0, // -1, 1,
					indexes.includes(matrix[x + (y + 1) * rows]) ? 1 : 0, // 0, 1
					indexes.includes(matrix[x + 1 + (y + 1) * rows]) ? 1 : 0, // 1, 1
				].join('').toString();

				// if (!testMatrix.includes(mt)) testMatrix.push(mt);
				let f = 0;
				if (this.texture.animation.states[mt] !== undefined) {
					f = this.texture.animation.states[mt].start;
					this.texture.addLocation(
						x * cellSize.w,
						y * cellSize.h,
						f
					);
				} else {
					// console.log('no state', mt);
				}
			}
		}

		// console.log('test', testMatrix);
		// console.log(this.texture);
	}

	// should be part of main repo
	getCell(label) {

		// get available cells
		const availableCells = [];
		for (let x = this.x; x < this.x + this.w; x++) {
			for (let y = this.y; y < this.y + this.h; y++) {
				if (!this.takenCells.some(c => c.x == x && c.y == y))
					availableCells.push({ x: x, y: y});
			}
		}
		const c = Cool.random(availableCells);
		if (c) this.takenCells.push({ ...c, label: label });
		return c;
	}

	display() {
		this.texture.display();
		
		if (mapAlpha > 0) {
			gme.renderer.ctx.globalAlpha = mapAlpha / 2;
			gme.renderer.ctx.fillStyle = this.c;
			gme.renderer.ctx.fillRect(
				(this.x - 1) * mapCellSize, 
				(this.y - 1) * mapCellSize, 
				this.w * mapCellSize, 
				this.h * mapCellSize
			);

			gme.renderer.ctx.fillStyle = 'white';
			gme.renderer.ctx.font = `${mapCellSize/2}px sans-serif`;
			gme.renderer.ctx.fillText(
				`${this.x},${this.y}`, 
				this.x * mapCellSize, 
				this.y * mapCellSize + 10
			);
			gme.renderer.ctx.globalAlpha = 1.0;
		}
	}

	update(player) {
		// this.texture.update(offset);
		return this.texture.update(player);
	}
}