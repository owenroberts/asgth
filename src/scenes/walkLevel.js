import { Counter, randomInt, choice, map } from '../../cool/cool.js';
import { BlobMap, TileMap, TileTypes, ColliderSprite, ColliderEmpty, Scene, Texture, Sprite, generateBSPMap, BSPTileTypes } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';

import level_bounds from '../data/level_bounds.json';

/**
 * generate walk level
 * @param {Object} gm     the game obj
 * @param {Player} player player sprite
 * @returns Scene
 */
export function walkLevel(gm, player) {

	const scene = new Scene();
	let colliders = [], doorColliders = [], exit;
	let moon, moonAnim;

	scene.setup = function() {

		doorColliders = [];
		colliders = [];

		// console.log(gm.props.levelCount) 
		
		const map = generateBSPMap({ cols: 13, rows: 7, minRoomSize: 2, minNodeSize: 2, maxNodeSize: 6 });
		const start = map.paths[0];
		const end = map.paths[map.paths.length - 1];
		// console.log({ start, end });
		// console.log(map) 

		// console.log(map.tileMap.toString('roomIndex'));
		// console.log(map.tileMap.toString('pathIndex'));
		
		player.spawn([
			start.x * Consts.CELL_SIZE.W + player.halfWidth,
			start.y * Consts.CELL_SIZE.H + player.halfHeight,
		], "RIGHT");
		player.setCollider(...Consts.WALK_COLLIDER);
		scene.addSprite(player);

		moon = scene.addToDisplay(new Sprite(13 * Consts.CELL_SIZE.W, 7 * Consts.CELL_SIZE.H, gm.anims.sprites.moon));
		moonAnim = new Counter(Consts.MOON_INTERVAL);

		const ground = scene.addToDisplay(new Texture({ animation: gm.anims.sprites[choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt')] }));

		const bgTexture = scene.addToDisplay(new Texture({ animation: gm.anims.sprites.walk_tiles }));
		const bgIndex = randomInt(0, (bgTexture.animation.endFrame - 1) / 4) * 4;

		exit = new ColliderEmpty(
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

			// console.log({pathStart, pathEnd})

			// if two paths collide, don't make the door
			if (pathStart.x < pathEnd.x + pathEnd.w &&
				pathStart.x + pathStart.w > pathEnd.x &&
				pathStart.y < pathEnd.y + pathEnd.h &&
				pathStart.y + pathStart.h > pathEnd.y) {
				continue;
			}

			// if (pathStart.x + pathStart.w - 1 === pathEnd.x && pathStart.y + pathStart.h - 1 === pathEnd.y) {
			// 	continue;
			// }

			// if (startTile.roomIndex === endTile.roomIndex) {
			// 	continue;
			// }

			// console.log(path);
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
			doorColliders.push(d);
		}
		// console.log(doorColliders);

		for (let i = 0; i < map.tileMap.tiles.length; i++) {
			if (map.tileMap.tiles[i].type >= 2) {
				map.tileMap.tiles[i].type = TileTypes.ON;
				continue;
			} 
			const { x, y } = map.tileMap.getIndexPosition(i);
			map.tileMap.tiles[i].type = TileTypes.OFF;
			colliders.push(new ColliderEmpty(
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
	};

	scene.onUpdate = function() {

		let isOnDoor = false;

		for (let i = 0; i < doorColliders.length; i++) {
			doorColliders[i].drawDebug();
			if (player.collide(doorColliders[i])) {
				// isOnDoor = true;
				player.spawn([
					doorColliders[i].destination.x,
					doorColliders[i].destination.y,
				]);
				player.resetInput();
			}
		}

		// if (!isOnDoor) {
		// 	prevDoorIndex = -1;
		// }

		for (let i = 0; i < colliders.length; i++) {
			// colliders[i].drawDebug();
			if (player.collide(colliders[i])) player.back();
		}
		
		exit.drawDebug("#ffbb00");
		if (player.collide(exit)) {
			gm.sq.next();
		}

		moonAnim.update();
		moon.position[1] = map(Math.sin(moonAnim.getProgress() * Math.PI), 0, 1, gm.height - 64, 0, true);
		
		if (moonAnim.isDone()) {
			// scene.clear();
			// scene.setup();
		}
	};

	return scene;
}