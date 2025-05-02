import * as Cool from '../../cool/cool.js';
import { Texture } from '../../lines/src/Engine.js';
import { BSPMap } from "../../hellmaps/src/Map.js";
import { Consts } from '../Consts.js';

export class Level {
	constructor(minNodeRoomSize, maxNodes, groundTexture) {
		
		this.map = new BSPMap(13, 7, minNodeRoomSize, 6, minNodeRoomSize);
		this.map.build({ w: 0, h: 0 }, { w: 0, h: 0 }, maxNodes, Consts.CELL_SIZE, false);
		this.roomCount = this.map.nodes.filter(n => n.room).length;
		this.cellCount = this.map.nodes
			.filter(n => n.room)
			.map(n => n.room.w * n.room.h)
			.reduce((s, n) => s + n);

		this.locations = [];

		// console.log('map', 'nodes', this.map.nodes.length, 'rooms', this.roomCount, 'cells', this.cellCount);

		// fill nodes with random tree ints
		this.map.nodes
			.filter(n => n.room)
			.forEach(n => {
				const i = Cool.randomInt(25 - 3);
				const r = n.room;
				for (let x = r.x; x < r.x + r.w; x++) {
					for (let y = r.y; y < r.y + r.h; y++) {
						let textureChoice = Cool.randomInt(i, i + 3);
						this.locations.push([x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, textureChoice]);
					}
				}
			});

		this.walls = []; // not walls ...

		this.ground = new Texture({ animation: groundTexture });
		for (let i = 0; i < this.map.matrix.length; i++) {
			if (this.map.matrix[i] === 0) {
				const x = i % this.map.cols;
				const y = Math.floor(i / this.map.cols);
				this.walls.push([x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H]);
				let mt = this.map.getMatrixCell(x, y, [0]);
				let n = this.map.getWangBlobNum(mt);
				let f = Cool.tileMap.indexOf(n);
				this.ground.addLocation(x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, f);
			}
		}
	}

	display() {
		this.ground.display();
	}

}