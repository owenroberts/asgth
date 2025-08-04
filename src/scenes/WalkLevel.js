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
		this.props = gm.props;
		this.height = gm.window.height;
		this.input = gm.input;

		this.doors = [];
		this.walls = [];
		
		const map = generateBSPMap({ cols: 13, rows: 7, minRoomSize: 2, minNodeSize: 2, maxNodeSize: 6 });
		const start = map.paths[0];
		const end = map.paths[map.paths.length - 1];
		
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
			// gm.anims.sprites.end_web
		);

		for (let i = 0; i < map.paths.length - 1; i++) {
			// add door to end
			const pathStart = map.paths[i];
			const pathEnd = map.paths[i + 1];
			const startTile = map.tileMap.getTile(pathStart.x, pathStart.y);
			const endTile = map.tileMap.getTile(pathEnd.x, pathEnd.y);


			// if two paths collide, don't make the door
			if (pathStart.x < pathEnd.x + pathEnd.w &&
				pathStart.x + pathStart.w > pathEnd.x &&
				pathStart.y < pathEnd.y + pathEnd.h &&
				pathStart.y + pathStart.h > pathEnd.y) {
				continue;
			}

			const d = new BBox(
				(pathStart.x + pathStart.w - 1) * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W * 0.32,
				(pathStart.y + pathStart.h - 1) * Consts.CELL_SIZE.H + Consts.CELL_SIZE.H * 0.32,
				Consts.CELL_SIZE.W * 0.25,
				Consts.CELL_SIZE.H * 0.25,
			);
			d.destination = {
				x: pathEnd.x * Consts.CELL_SIZE.W, 
				y: pathEnd.y * Consts.CELL_SIZE.H,
			};
			this.doors.push(d);
		}

		for (let i = 0; i < map.tileMap.tiles.length; i++) {
			if (map.tileMap.tiles[i].type >= 2) {
				map.tileMap.tiles[i].type = TileTypes.ON;
				continue;
			} 
			const { x, y } = map.tileMap.getIndexPosition(i);
			map.tileMap.tiles[i].type = TileTypes.OFF;
			this.walls.push(new BBox(
				x * Consts.CELL_SIZE.W,
				y * Consts.CELL_SIZE.H, 
				Consts.CELL_SIZE.W, 
				Consts.CELL_SIZE.H
			));
		}

		const blobMap = new BlobMap(map.tileMap); // is this wackadoodle?
		for (let i = 0; i < map.tileMap.tiles.length; i++) {
			const { x, y } = map.tileMap.getIndexPosition(i);
			if (map.tileMap.tiles[i].type === TileTypes.ON) {
				const blobIndex = blobMap.getBlobIndex(x, y, TileTypes.ON);
				ground.addLocation(x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, blobIndex);
			} else {
				const f = bgIndex + randomInt(0, 3);
				bgTexture.addLocation(x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, f);
			}
	}
	}

	update() {

		let isOnDoor = false;

		for (let i = 0; i < this.doors.length; i++) {
			// doorColliders[i].drawDebug();
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
			this.props.isWalkLevelExited = true;
			this.input.reset();
			this.sq.next();
		}

		this.moonAnim.update();
		this.moon.bbox.y = map(Math.sin(this.moonAnim.getProgress() * Math.PI), 0, 1, this.height - 64, 0, true);
		
		if (this.moonAnim.isDone()) {
			this.sq.next();
		}
	}

}