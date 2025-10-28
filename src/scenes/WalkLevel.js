import { Counter, randomInt, choice, map } from '../../cool/cool.js';
import { BlobMap, TileMap, TileTypes, BBox, Scene, Texture, Sprite, generateBSPMap, BSPTileTypes } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import level_bounds from '../data/level_bounds.json';

export class WalkLevel extends Scene {

	constructor(gm) {
		super();

		this.player = this.add(gm.player);
		this.sfx = gm.sfx;
		this.sq = gm.sq;
		this.states = gm.states;
		this.height = gm.window.height;
		this.input = gm.input;
		
		this.drawDebug = gm.drawDebug.bind(gm); // fuck! bind! well at least it works ... 

		this.doors = [];
		this.walls = [];
		
		const levelMap = generateBSPMap({ cols: 13, rows: 7, minRoomSize: 2, minNodeSize: 2, maxNodeSize: 6 });
		const start = levelMap.paths[0];
		const end = levelMap.paths[levelMap.paths.length - 1];
		
		this.player.spawn(
			start.x * Consts.CELL_SIZE.W,
			start.y * Consts.CELL_SIZE.H,
			"RIGHT"
		);
		this.player.collider.set(...Consts.WALK_COLLIDER);

		this.moon = this.add(new Sprite(13 * Consts.CELL_SIZE.W, 7 * Consts.CELL_SIZE.H, gm.anims.sprites.moon));
		this.moonAnim = new Counter(Consts.MOON_INTERVAL);

		const ground = this.add(new Texture({ animation: gm.anims.sprites[choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt')] }));

		const bgTexture = this.add(new Texture({ animation: gm.anims.sprites.walk_tiles }));
		const bgIndex = randomInt(0, (bgTexture.animation.endFrame - 1) / 4) * 4;

		this.exit = new BBox(
			(end.x + end.w - 1) * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W * 0.25,
			(end.y + end.h - 1) * Consts.CELL_SIZE.H + Consts.CELL_SIZE.W * 0.25,
			Consts.CELL_SIZE.W * 0.5,
			Consts.CELL_SIZE.H * 0.5,
		);

		// make bsp areas bbox?
		function checkOverlapOrAdjacent(p1, p2) {
			if (p1.x < p2.x + p2.w &&
				p1.x + p1.w > p2.x &&
				p1.y < p2.y + p2.h &&
				p1.y + p1.h > p2.y) {
				return true;
			}

			if ((p1.x + p1.w === p2.x || p2.x + p2.w === p1.x) &&
         		(Math.max(p1.y, p2.y) < Math.min(p1.y + p1.h, p2.y + p2.h))) {
        		return true
			}

			if ((p1.y + p1.h === p2.y || p2.y + p2.h === p1.y) &&
         		(Math.max(p1.x, p2.x) < Math.min(p1.x + p1.w, p2.x + p2.w))) {
        		return true
			}

			return false;
		}
		
		let groupNumber = 0;
		for (let i = 0; i < levelMap.paths.length; i++) {
			if (i === 0) {
				levelMap.paths[i].groupNumber = groupNumber;
				continue;
			}

			const p1 = levelMap.paths[i];

			let isInExistingGroup = false;
			for (let j = 0; j < levelMap.paths.length; j++) {
				
				if (j === i) continue;
				const p2 = levelMap.paths[j];
				if (!p2.hasOwnProperty('groupNumber')) continue;
				
				if (checkOverlapOrAdjacent(p1, p2)) {
					isInExistingGroup = true;
					p1.groupNumber = p2.groupNumber;
					break;
				}
			}

			if (!isInExistingGroup) {
				groupNumber++;
				p1.groupNumber = groupNumber;
			}
		}

		for (let i = 0; i < levelMap.paths.length - 1; i++) {

			// check if last path in group
			let path = levelMap.paths[i];

			// last group is exit
			if (path.groupNumber === groupNumber) continue;

			let isLastPathInGroup = true;
			for (let j = i + 1; j < levelMap.paths.length; j++) {
				if (levelMap.paths[j].groupNumber === path.groupNumber) {
					isLastPathInGroup = false;
				}
			}

			if (!isLastPathInGroup) {
				continue;
			}

			const d = new BBox(
				(path.x + path.w - 1) * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W4 + Consts.CELL_SIZE.W8,
				(path.y + path.h - 1) * Consts.CELL_SIZE.H + Consts.CELL_SIZE.H4 + Consts.CELL_SIZE.H8,
				Consts.CELL_SIZE.W4,
				Consts.CELL_SIZE.H4,
			);

			const destination = levelMap.paths[i + 1];
			d.destination = {
				x: destination.x * Consts.CELL_SIZE.W, 
				y: destination.y * Consts.CELL_SIZE.H,
			};
			this.doors.push(d);
		}

		for (let i = 0; i < levelMap.tileMap.tiles.length; i++) {
			if (levelMap.tileMap.tiles[i].type >= 2) {
				levelMap.tileMap.tiles[i].type = TileTypes.ON;
				continue;
			} 
			const { x, y } = levelMap.tileMap.getIndexPosition(i);
			levelMap.tileMap.tiles[i].type = TileTypes.OFF;
			this.walls.push(new BBox(
				x * Consts.CELL_SIZE.W,
				y * Consts.CELL_SIZE.H, 
				Consts.CELL_SIZE.W, 
				Consts.CELL_SIZE.H
			));
		}

		const blobMap = new BlobMap(levelMap.tileMap); // is this wackadoodle?
		for (let i = 0; i < levelMap.tileMap.tiles.length; i++) {
			const { x, y } = levelMap.tileMap.getIndexPosition(i);
			if (levelMap.tileMap.tiles[i].type === TileTypes.ON) {
				const blobIndex = blobMap.getBlobIndex(x, y, TileTypes.ON);
				ground.addLocation(x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, blobIndex);
			} else {
				const f = bgIndex + randomInt(0, 3);
				bgTexture.addLocation(x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, f);
			}
	}
	}

	update(timeElapsed) {

		this.player.update(timeElapsed);

		let isOnDoor = false;

		for (let i = 0; i < this.doors.length; i++) {
			// doorColliders[i].drawDebug();
			// this.drawDebug({ bbox: this.doors[i] });
			if (this.player.isColliding(this.doors[i])) {
				this.player.spawn(
					this.doors[i].destination.x,
					this.doors[i].destination.y,
				);
				this.input.reset();
				this.sfx.play("walk", { randomRate: true });
			}
		}

		for (let i = 0; i < this.walls.length; i++) {
			if (this.player.isColliding(this.walls[i])) {
				this.player.moveBack();
			}
		}
		
		// exit.drawDebug("#ffbb00");
		if (this.player.isColliding(this.exit)) {
			this.sfx.play("walk", { randomRate: true });
			this.states.isWalkLevelExited = true;
			this.input.reset();
			this.sq.next();
		}

		this.moonAnim.update();
		this.moon.bbox.y = map(Math.sin(this.moonAnim.getProgress() * Math.PI), 0, 1, this.height - 64, 0, true);
		
		if (this.moonAnim.isDone) {
			this.sq.next();
		}
	}

}