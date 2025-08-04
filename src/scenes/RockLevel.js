import { randomInt, choice, random } from '../../cool/cool.js';

import { Scene, Sprite, Texture, TileMap, generateBSPMap, BSPTileTypes, BlobMap } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Sun } from '../components/Sun.js';
import { Tracing } from '../components/Tracing.js';

import { patternMatch } from '../patternMatch.js';

export class RockLevel extends Scene {

	constructor(gm) {
		super();

		this.player = this.add(gm.player);
		this.sfx = gm.sfx;
		this.props = gm.props;
		this.sq = gm.sq;
		this.width = gm.window.width;

		this.dir = choice(-1, 1); // rock starts animating
		this.isRockRolled = false;
		this.gotMatch = false;
		
		const map = generateBSPMap({ cols: 13, rows: 7, minNodeSize: 2, maxNodeSize: 6, createPaths: false, inject: [{ type: "room", w: gm.props.patternBounds.width, h: gm.props.patternBounds.height, name: 'drawing' }] });

		const tracingStartTile = map.rooms.filter(r => r.name == "drawing")[0]
		this.tracing = this.add(new Tracing(gm, gm.props.pattern, tracingStartTile));

		this.trees = this.add(new Trees(gm));
		this.trees.clearAnimator();

		let treeClusterSize = 3;
		// don't like mixing getTexture() with .animation ... 
		let numTrees = this.trees.texture.animation.endFrame;
		for (let i = 0; i < map.rooms.length; i++) {
			const treeClusterIndex = randomInt(numTrees - treeClusterSize);
			const r = map.rooms[i];
			for (let x = r.x; x < r.x + r.w; x++) {
				for (let y = r.y; y < r.y + r.h; y++) {
					this.trees.addLocation(
						x * Consts.CELL_SIZE.W, 
						y * Consts.CELL_SIZE.H, 
						randomInt(treeClusterIndex, treeClusterIndex + treeClusterSize, false),
					);
				}
			}
		}

		const ground = this.add(new Texture({ animation: gm.anims.sprites[choice('tiles_grass', 'tiles_stones', 'tiles_sparse_grass', 'tiles_dirt')] }));
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
		this.player.spawn(
			spawnLocation.x * Consts.CELL_SIZE.W + Consts.CELL_SIZE.W * 0.5, 
			spawnLocation.y * Consts.CELL_SIZE.H + Consts.CELL_SIZE.H * 0.5,
		); // no spawn on edge ?

		this.player.setCollider(...Consts.ROCK_COLLIDER);

		this.sun = this.add(new Sun(gm));

		this.rock = this.add(new Sprite(gm.window.width, -gm.anims.sprites.rock.height, gm.anims.sprites.rock));
		this.rock.isActive = false;
		this.rock.animation.play();

		this.web = this.add(new Web(gm));
	}

	updateScore() {
		this.props.lastPointWinner = this.gotMatch ? 'SPIDER' : 'ROCK';
		this.props.points[this.props.lastPointWinner]++;
	}

	update() {
		if (this.isRockRollwed) this.rockUpdate();
		else this.webUpdate();
	}

	webUpdate() {

		this.tracing.update();

		const treeLocation = this.trees.getTreeLocation(this.player);
		const connection = this.web.getConnection(this.player, treeLocation, this.sfx);
		if (connection === Consts.WEB_CONNECTS.COMPLETED || connection === Consts.WEB_CONNECTS.RELEASED) {

			const points = structuredClone(this.web.getPoints({ trimmed: connection === Consts.WEB_CONNECTS.COMPLETED }));

			const isMatch = patternMatch(this.props.pattern, points);
			
			if (isMatch) {
				if (connection === Consts.WEB_CONNECTS.COMPLETED) {
					this.web.cancel();
				}
				this.sfx.play('match', { randomRate: true });
				this.sun.end();
				this.gotMatch = true;
			}
		}


		if (this.web.isActive && this.player.isMoving()) {
			this.sfx.play('web');
		} else {
			this.sfx.pause('web');
		}

		this.sun.update();

		if (this.sun.isDone()) {
			this.updateScore();
			this.sq.next();
		}
	}

	rockSetup() {
		
		this.web.end(); // unset web scene
		this.sfx.pause('web');
		this.sun.isActive = false;
		this.player.isActive = false;
		
		this.rock.bbox.xywh[0] = this.dir === 1 ? -this.rock.bbox.halfWidth : this.width;
		this.rock.bbox.xywh[1] = -this.rock.bbox.halfHeight;
		this.rock.isActive = true;

		this.trees.startRock();
		this.web.startOverride();
		
		this.sfx.play('stone');
		this.sfx.play('rock');
		
		this.isRockRollwed = true;
	};

	rockUpdate() {
		this.rock.bbox.xywh[0] += random(2, 1) * this.dir * Consts.ROCK_SPEED;
		this.rock.bbox.xywh[1] += random(-1, 2) * Consts.ROCK_SPEED;

		this.sfx.loop('stone');
		this.sfx.loop('rock');

		if ((this.dir === -1 && this.rock.bbox.xywh[0] < -this.rock.bbox.width) || 
			this.dir === 1 && this.rock.bbox.xywh[0] > this.width) {
			this.rock.isActive = false;
			this.rock.displayFunc = undefined;
			this.player.isActive = true;
			this.sq.next();
		}
		this.trees.shake();
	}
}