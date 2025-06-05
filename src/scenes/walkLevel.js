import { Counter, randomInt, choice, map } from '../../cool/cool.js';
import { BlobMap, TileMap, TileTypes, ColliderSprite, ColliderEmpty, Scene, Texture, Sprite } from '../../lines/src/Engine.js';
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
	let colliders = [], doorColliders = [], prevDoorIndex = 0, exit;
	let moon, moonAnim;

	scene.setup = function() {

		const { bounds, start, end, doors } = level_bounds.levels[gm.props.levelCount];
		
		player.spawn([
			start[0] * Consts.CELL_SIZE.W + player.halfWidth,
			start[1] * Consts.CELL_SIZE.H + player.halfHeight,
		], start[2]);
		scene.addSprite(player);

		moon = scene.addToDisplay(new Sprite(13 * Consts.CELL_SIZE.W, 7 * Consts.CELL_SIZE.H, gm.anims.sprites.moon));
		moonAnim = new Counter(Consts.MOON_INTERVAL);

		const ground = scene.addToDisplay(new Texture({ animation: gm.anims.sprites[choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt')] }));

		const bgTexture = scene.addToDisplay(new Texture({ animation: gm.anims.sprites.walk_tiles }));
		const bgIndex = randomInt(0, (bgTexture.animation.endFrame - 1) / 4) * 4;

		exit = new ColliderEmpty(
			end[0] * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W / 4,
			end[1] * Consts.CELL_SIZE.H + Consts.CELL_SIZE.W / 4,
			Consts.CELL_SIZE.W / 2,
			Consts.CELL_SIZE.H / 2,
			// gm.anims.sprites.end_web
		);

		function addDoor(doorData) {
			const dc = new ColliderEmpty(
				doorData[0] * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W / 4,
				doorData[1] * Consts.CELL_SIZE.H + Consts.CELL_SIZE.W / 4,
				Consts.CELL_SIZE.W / 2, 
				Consts.CELL_SIZE.H / 2,
			);
			dc.dir = doorData[2];
			doorColliders.push(dc);
		}

		if (doors) {
			addDoor(start); // initial prev door is start
			for (let i = 0; i < doors.length; i++) {
				addDoor(doors[i]);
			}
		}
		

		// is this wackadoodle?
		const map = new BlobMap(new TileMap(13, 8));

		for (let i = 0; i < bounds.length; i++) {
			const [x, y, w, h] = bounds[i];
			map.tileMap.setAreaProperty(x, y, w, h, "type", TileTypes.ON);
			
			colliders.push(new ColliderEmpty(
				x * Consts.CELL_SIZE.W,
				y * Consts.CELL_SIZE.H, 
				w * Consts.CELL_SIZE.W, 
				h * Consts.CELL_SIZE.H
			));
		}

		for (let i = 0; i < map.tileMap.tiles.length; i++) {
			const { x, y } = map.tileMap.getIndexPosition(i);
			if (map.tileMap.tiles[i].type === TileTypes.OFF) {
				const blobIndex = map.getBlobIndex(x, y, TileTypes.OFF);
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
			// doorColliders[i].drawDebug();
			if (player.collide(doorColliders[i])) {
				isOnDoor = true;
				if (i === prevDoorIndex) continue;
				let randomIndex = randomInt(doorColliders.length - 1);
				while (randomIndex === i) {
					randomIndex = randomInt(doorColliders.length - 1);
				}
				player.spawn([
					doorColliders[randomIndex].position[0] - Consts.CELL_SIZE.W / 4 + player.halfWidth,
					doorColliders[randomIndex].position[1] - Consts.CELL_SIZE.W / 4 + player.halfHeight,
				], doorColliders[randomIndex].dir);
				player.resetInput();
				prevDoorIndex = randomIndex;
			}
		}

		if (!isOnDoor) {
			prevDoorIndex = -1;
		}

		for (let i = 0; i < colliders.length; i++) {
			if (player.collide(colliders[i])) player.back();
		}
		
		if (player.collide(exit)) {
			gm.sq.next();
		}

		moonAnim.update();
		moon.position[1] = map(Math.sin(moonAnim.getProgress() * Math.PI), 0, 1, gm.height - 64, 0, true);
	};

	return scene;
}