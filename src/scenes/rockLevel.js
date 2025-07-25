import { randomInt, choice, random } from '../../cool/cool.js';

import { Scene, Sprite, Texture, TileMap, generateBSPMap, BSPTileTypes, BlobMap } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Sun } from '../components/Sun.js';
import { Tracing } from '../components/Tracing.js';

import { patternMatch } from '../patternMatch.js';

export function rockLevel(gm, player) {
	
	const scene = new Scene();

	let trees, web, sun, rock, tracing;
	const dir = choice(-1, 1); // rock starts animating
	let rockRolled = false;
	let gotMatch = false;

	scene.setup = function() {
		
		const map = generateBSPMap({ cols: 13, rows: 7, minNodeSize: 2, maxNodeSize: 6, createPaths: false, inject: [{ type: "room", w: gm.props.patternBounds.width, h: gm.props.patternBounds.height, name: 'drawing' }] });

		const tracingStartTile = map.rooms.filter(r => r.name == "drawing")[0]
		tracing = Tracing(gm.props.pattern, tracingStartTile);
		scene.add(tracing);

		trees = Trees(gm);
		scene.add(trees.getSprites());
		trees.clearAnimator();

		let treeClusterSize = 3;
		// don't like mixing getTexture() with .animation ... 
		let numTrees = trees.getTexture().animation.endFrame;
		for (let i = 0; i < map.rooms.length; i++) {
			const treeClusterIndex = randomInt(numTrees - treeClusterSize);
			const r = map.rooms[i];
			for (let x = r.x; x < r.x + r.w; x++) {
				for (let y = r.y; y < r.y + r.h; y++) {
					trees.addLocation(
						x * Consts.CELL_SIZE.W, 
						y * Consts.CELL_SIZE.H, 
						randomInt(treeClusterIndex, treeClusterIndex + treeClusterSize, false),
					);
				}
			}
		}

		const ground = scene.add(new Texture({ animation: gm.anims.sprites[choice('tiles_grass', 'tiles_stones', 'tiles_sparse_grass', 'tiles_dirt')] }));
		const blobMap = new BlobMap(map.tileMap);
		const wallTiles = map.tileMap.getTilesByType(BSPTileTypes.WALL);
		for (let i = 0; i < wallTiles.length; i++) {
			const { x, y } = map.tileMap.getPosition(wallTiles[i]);
			const blobIndex = blobMap.getBlobIndex(x, y, BSPTileTypes.WALL);
			ground.addLocation(x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, blobIndex);
		}

		// get tile type method?
		const spawnTile = choice(map.tileMap.tiles.filter(t => t.type === BSPTileTypes.WALL));
		const spawnLocation = map.tileMap.getPosition(spawnTile);
		player.spawn([
			spawnLocation.x * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W * 0.5, 
			spawnLocation.y * Consts.CELL_SIZE.H + Consts.CELL_SIZE.H * 0.5,
		]); // no spawn on edge ?

		player.setCollider(...Consts.ROCK_COLLIDER);
		scene.add(player);

		sun = Sun(gm);
		scene.add(sun.getSprite());

		rock = scene.add(new Sprite(gm.width, -gm.anims.sprites.rock.height, gm.anims.sprites.rock));
		rock.isActive = false;
		rock.animation.play();

		web = Web();
		scene.add(web);		
	};

	function updateScore() {
		let point = gotMatch ? 1 : 0;
		gm.props.lastPointWinner = gotMatch ? 'SPIDER' : 'ROCK';
		gm.props.points[gm.props.lastPointWinner]++;
	}

	// dont kys on this, going to remove probably ... but also use in another scene ... 
	scene.update = function() {
		if (rockRolled) rockUpdate();
		else webUpdate();
	};

	function webUpdate() {

		if (player.input.v) {
			player.input.v = false;
			tracing.activate(gm.sfx);
		}

		const treeLocation = trees.isColliding(player);
		const connection = web.getConnection(player, treeLocation, gm.sfx);
		if (connection === Consts.WEB_CONNECTS.COMPLETED || connection === Consts.WEB_CONNECTS.RELEASED) {

			const points = structuredClone(web.getPoints({ trimmed: connection === Consts.WEB_CONNECTS.COMPLETED }));

			const isMatch = patternMatch(gm.props.pattern, points);
			
			if (isMatch) {
				if (connection === Consts.WEB_CONNECTS.COMPLETED) {
					web.cancel();
				}
				gm.sfx.play('match', { randomRate: true });
				sun.end();
				gotMatch = true;
			}
		}


		if (web.isActive() && player.isMoving()) {
			gm.sfx.play('web');
		} else {
			gm.sfx.pause('web');
		}

		sun.update();

		if (sun.isDone()) {
			updateScore();
			gm.sq.next();
		}
	}

	scene.rock = function() {
		
		web.end(); // unset web scene
		gm.sfx.pause('web');
		sun.getSprite().isActive = false; // yuck
		player.isActive = false; // double yuck
		
		rock.position[0] = dir === 1 ? -rock.halfWidth : gm.width;
		rock.position[1] = -rock.halfHeight;
		rock.isActive = true;

		trees.startRock();
		web.startOverride();
		
		gm.sfx.play('stone');
		gm.sfx.play('rock');
		
		rockRolled = true;
	};

	function rockUpdate() {
		rock.position[0] += random(2, 1) * dir * Consts.ROCK_SPEED;
		rock.position[1] += random(-1, 2) * Consts.ROCK_SPEED;

		gm.sfx.loop('stone');
		gm.sfx.loop('rock');

		if ((dir === -1 && rock.position[0] < -rock.width) || 
			dir === 1 && rock.position[0] > gm.width) {
			rock.isActive = false;
			rock.displayFunc = undefined;
			player.isActive = true;
			gm.sq.next();
		}
		trees.shake();
	}

	return scene;
}