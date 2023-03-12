class Level {
	constructor(letter) {
		this.letter = letter;
		this.map = new BSPMap(20, 20, 5, 16);
		// console.log(this.map);

		this.map.build({ w: 2, h: 2}, 16, {
			walls: gme.anims.sprites[spriteMap[letter].sprite],
		});

		this.roomCount = this.map.nodes.filter(n => n.room).length;
		this.cellCount = this.map.nodes.filter(n => n.room).map(n => n.room.w * n.room.h).reduce((s, n) => s + n);

		this.map.nodes
			.filter(n => n.room)
			.forEach(n => {
				n.room.addTextureLocations(this.map.matrix, this.map.rows, [1, 3]);
			});

		function addPaths(obj, map) {
			if (obj.paths) {
				obj.paths.forEach(path => {
					// console.log('path', path.x, path.y);
					path.addTextureLocations(map.matrix, map.rows, [2, 3])
				});
			}
			if (obj.a) addPaths(obj.a, map);
			if (obj.b) addPaths(obj.b, map);

		}
		this.map.nodes.forEach(n => { addPaths(n, this.map) });
		// console.log(this.map);
		this.items = new SpriteCollection();
		this.food = new SpriteCollection();
		this.npcs = new SpriteCollection();

	}

	get() {
		return this.letter;
	}

	update(player) {

		const offset = [
			-player.mapPosition[0] + gme.view.halfWidth,
			-player.mapPosition[1] + gme.view.halfHeight,
		];

		// this.nodes[0].update(offset);
		for (let i = 0; i < this.map.nodes.length; i++) {
			const node = this.map.nodes[i];
			if (node.room) node.room.update(offset);
			for (let j = 0; j < node.paths.length; j++) {
				node.paths[j].update(offset);
			}
		}

		for (let i = 0; i < this.map.walls.length; i++) {
			this.map.walls[i].update(offset);
		}

		// can i fucking optimize this ... ?? -- shg ... 
		let wallCollision = false;
		for (let i = 0; i < this.map.walls.length; i++) {
			const wall = this.map.walls[i];
			if (wall.collide(player)) {
				wallCollision = true;
			}
		}
		if (wallCollision) player.back();


		// this.items.all(item => { item.update(offset, player); });
		this.food.all(f => { 
			const isColliding = f.update(offset, player);
			if (isColliding) {
				player.eatFood();
				this.food.remove(f);
			}
		});

		this.items.all(i => { 
			const isColliding = i.update(offset, player);
			if (isColliding) {
				player.addItem(i.get());
				this.items.remove(i);
			}
		});

		this.npcs.all(n => { 
			const isColliding = n.update(offset, player);
			if (isColliding) {
				player.resetInput();
				gme.scenes.current = n.get();
				// console.log('talk to', n.get());
				// player.addItem(i.get());
				// this.items.remove(i);
			}
		});
	}

	display() {
		this.map.nodes[0].display(); // displays through tree of nodes
		for (let i = 0; i < this.map.walls.length; i++) {
			this.map.walls[i].display();
		}
		this.items.all(i => { i.display(); });
		this.food.all(f => { f.display(); });
		this.npcs.all(n => { n.display(); });

	}

	addNPC(letter) {
		const room = choice(this.map.nodes.filter(n => n.room)).room;
		const location = room.getCell('npc');
		const npc = new NPC(location.x * cellSize.w, location.y * cellSize.h, letter);
		this.npcs.add(npc);
		return npc;
	}

	addFood() {
		const nodes = this.map.nodes.filter(n => n.room);
		for (let i = 0; i < nodes.length; i++) {
			const location = nodes[i].room.getCell('food');
			const sprite = new Food(location.x * cellSize.w, location.y * cellSize.h, build.food);
			this.food.add(sprite);
		}
	}

	addMoney(position) {
		const sprite = new Item(Math.round(position[0]), Math.round(position[1]), build.money);
		this.items.add(sprite);
	}
}