class Level {
	constructor(letter, animation, index) {
		this.letter = letter;
		this.map = new BSPMap(13, 7, 1, 6);
		// console.log(this.map);

		this.map.build({ w: 0, h: 0}, 16, false);

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
				let i = randomInt(25);
				n.room.getLocations().forEach(loc => {
					this.locations.push([...loc, i]);
				});
			});

		this.walls = []; // not walls ...
		this.wallTexture = new Texture({ animation: gme.anims.sprites.room, center: true });
		for (let i = 0; i < this.map.matrix.length; i++) {
			if (this.map.matrix[i] === 0) {
				const x = i % this.map.cols;
				const y = Math.floor(i / this.map.cols);
				// console.log(x * cellSize.w + 32, y + cellSize.h + 32)
				this.walls.push([x * cellSize.w + 32, y * cellSize.h + 32]);

				let mt = this.map.getMatrixCell(x, y, 0);
				console.log(gme.anims.sprites.room.states);
				if (gme.anims.sprites.room.states[mt])
				var f = 0;
				if (gme.anims.sprites.room.states[mt]) f = gme.anims.sprites.room.states[mt].start;
				this.wallTexture.addLocation(x * cellSize.w + 32, y * cellSize.h + 32, f);
			}
		}
		console.log(this.map.matrix);
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
		this.map.nodes[0].display(); // displays through tree of nodes
		this.wallTexture.display();
		// for (let i = 0; i < this.map.walls.length; i++) {
		// 	this.map.walls[i].display();
		// }
	}

}