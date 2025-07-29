import { Counter, randomInt, choice, map } from '../../cool/cool.js';
import { BlobMap, TileMap, TileTypes, ColliderSprite, ColliderEmpty, Scene, Texture, Sprite, generateBSPMap, BSPTileTypes } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import level_bounds from '../data/level_bounds.json';

export class WalkLevel extends Scene {

	constructor(gm) {
		super();

		this.player = this.add(gm.player);
		this.sfx = gm.sfx;
		this.sq = gm.sq;
		this.props = gm.props;
		this.height = gm.height;

		this.doorColliders = [];
		this.colliders = [];
		
		const map = generateBSPMap({ cols: 13, rows: 7, minRoomSize: 2, minNodeSize: 2, maxNodeSize: 6 });
		const start = map.paths[0];
		const end = map.paths[map.paths.length - 1];
		
		this.player.spawn([
			start.x * Consts.CELL_SIZE.W + this.player.halfWidth,
			start.y * Consts.CELL_SIZE.H + this.player.halfHeight,
		], "RIGHT");
		this.player.setCollider(...Consts.WALK_COLLIDER);

		this.moon = this.add(new Sprite(13 * Consts.CELL_SIZE.W, 7 * Consts.CELL_SIZE.H, gm.anims.sprites.moon));
		this.moonAnim = new Counter(Consts.MOON_INTERVAL);

		const ground = this.add(new Texture({ animation: gm.anims.sprites[choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt')] }));

		const bgTexture = this.add(new Texture({ animation: gm.anims.sprites.walk_tiles }));
		const bgIndex = randomInt(0, (bgTexture.animation.endFrame - 1) / 4) * 4;

		this.exit = new ColliderEmpty(
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

			const d = new ColliderEmpty(
				(pathStart.x + pathStart.w - 1) * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W * 0.32,
				(pathStart.y + pathStart.h - 1) * Consts.CELL_SIZE.H + Consts.CELL_SIZE.H * 0.32,
				Consts.CELL_SIZE.W * 0.25,
				Consts.CELL_SIZE.H * 0.25,
			);
			d.destination = {
				x: pathEnd.x * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W * 0.5, 
				y: pathEnd.y * Consts.CELL_SIZE.H + Consts.CELL_SIZE.H * 0.5,
			};
			this.doorColliders.push(d);
		}

		for (let i = 0; i < map.tileMap.tiles.length; i++) {
			if (map.tileMap.tiles[i].type >= 2) {
				map.tileMap.tiles[i].type = TileTypes.ON;
				continue;
			} 
			const { x, y } = map.tileMap.getIndexPosition(i);
			map.tileMap.tiles[i].type = TileTypes.OFF;
			this.colliders.push(new ColliderEmpty(
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

		for (let i = 0; i < this.doorColliders.length; i++) {
			// doorColliders[i].drawDebug();
			if (this.player.collide(this.doorColliders[i])) {
				this.player.spawn([
					this.doorColliders[i].destination.x,
					this.doorColliders[i].destination.y,
				]);
				this.player.resetInput();
				this.sfx.play("walk", { randomRate: true });
			}
		}

		for (let i = 0; i < this.colliders.length; i++) {
			if (this.player.collide(this.colliders[i])) this.player.back();
		}
		
		// exit.drawDebug("#ffbb00");
		if (this.player.collide(this.exit)) {
			this.sfx.play("walk", { randomRate: true });
			this.props.isWalkLevelExited = true;
			this.sq.next();
		}

		this.moonAnim.update();
		this.moon.position[1] = map(Math.sin(this.moonAnim.getProgress() * Math.PI), 0, 1, this.height - 64, 0, true);
		
		if (this.moonAnim.isDone()) {
			this.sq.next();
		}
	}

}