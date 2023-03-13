class Level {
	constructor(letter, animation, index) {
		this.letter = letter;
		this.map = new BSPMap(13, 7, 1, 6, 1);
		// console.log(this.map);

		this.map.build({ w: 0, h: 0 }, { w: 0, h: 0 }, 16, false);

		console.log('map', letter, this.map);

		this.roomCount = this.map.nodes.filter(n => n.room).length;
		this.cellCount = this.map.nodes
			.filter(n => n.room)
			.map(n => n.room.w * n.room.h)
			.reduce((s, n) => s + n);

		this.locations = [];

		this.map.nodes
			.filter(n => n.room)
			.forEach(n => {
				// n.room.addTextureLocations(this.map.matrix, this.map.rows, [1, 3]);
				// n.room.addTextureLocations()
				// n.room.addTextureAnimation(animation);
				// n.room.addLocations();
				const i = randomInt(25);
				const r = n.room;
				for (let x = r.x; x < r.x + r.w; x++) {
					for (let y = r.y; y < r.y + r.h; y++) {
						this.locations.push([x * cellSize.w, y * cellSize.h, i]);
					}
				}
			});

		this.walls = []; // not walls ...
		const { grass_tiles, dirt_tiles } = gme.anims.sprites;
		this.wallTexture = new Texture({ animation: choice([grass_tiles, dirt_tiles]) });
		for (let i = 0; i < this.map.matrix.length; i++) {
			if (this.map.matrix[i] === 0) {
				const x = i % this.map.cols;
				const y = Math.floor(i / this.map.cols);
				this.walls.push([x * cellSize.w , y * cellSize.h]);
				let mt = this.map.getMatrixCell(x, y, [0]);
				let n = this.map.getWangBlobNum(mt);
				let f = tileMap.indexOf(n);
				this.wallTexture.addLocation(x * cellSize.w , y * cellSize.h, f);
			}
		}
		// console.log(this.map.matrix);
		// console.log(this.walls);
	}



	update(player) {

		// for (let i = 0; i < this.map.nodes.length; i++) {
		// 	const node = this.map.nodes[i];
		// 	if (node.room) {
		// 		let treeLoc = node.room.update(player);
		// 		return treeLoc;
		// 	}
		// }

		// for (let i = 0; i < this.map.walls.length; i++) {
		// 	this.map.walls[i].update(offset);
		// }

		// // can i fucking optimize this ... ?? -- shg ... 
		// let wallCollision = false;
		// for (let i = 0; i < this.map.walls.length; i++) {
		// 	const wall = this.map.walls[i];
		// 	if (wall.collide(player)) {
		// 		wallCollision = true;
		// 	}
		// }
		// if (wallCollision) player.back();
		
	}

	display() {
		// this.map.nodes[0].display(); // displays through tree of nodes
		this.wallTexture.display();
		// for (let i = 0; i < this.map.walls.length; i++) {
		// 	this.map.walls[i].display();
		// }
	}

}