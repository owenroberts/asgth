import { Counter, randomInt, choice } from '../../cool/cool.js';
import { Scene, TextSprite, TileMap, BlobMap, Texture } from '../../lines/src/Engine.js';

import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';
import { patternMatch } from '../patternMatch.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Sun } from '../components/Sun.js';
import { Tracing } from '../components/Tracing.js';

export class InstPattern extends Scene {
	
	constructor(gm) {
		super();

		this.player = this.add(gm.player);
		this.sfx = gm.sfx;
		this.props = gm.props;
		this.sq = gm.sq;

		this.gotMatch = false;

		this.trees = this.add(new Trees(gm));
		this.web = this.add(new Web(gm));
		this.sun = this.add(new Sun(gm));

		// not DRY ... idk
		this.start = { x: 4, y: 1 };
		
		this.tracing = this.add(new Tracing(gm, gm.props.pattern, this.start, true));
		
		const ground = this.add(new Texture({ animation: gm.anims.sprites[choice('tiles_stones', 'tiles_dirt')] }, true));

		const tileMap = new TileMap(5, 5);
		const treeLocations = [[1,1], [1,2], [1,3], [2,1], [2,2], [2,3], [3,1], [3,2], [3,3]];

		for (let i = 0; i < treeLocations.length; i++) {
			let [x, y] = treeLocations[i];
			this.trees.addLocation(
				(this.start.x + x) * Consts.CELL_SIZE.W,
				(this.start.y + y) * Consts.CELL_SIZE.H,
				randomInt(25),
			);

			tileMap.setTileProperty(x, y, 'type', 1); // default type is 0
		}

		const blobMap = new BlobMap(tileMap);
		for (let i = 0; i < tileMap.tiles.length; i++) {
			if (tileMap.tiles[i].type === 1) continue;
			const { x, y } = tileMap.getIndexPosition(i);
			// console.log(x, y);
			const blobIndex = blobMap.getBlobIndex(x, y, 0);
			ground.addLocation(
				(this.start.x + x) * Consts.CELL_SIZE.W, 
				(this.start.y + y) * Consts.CELL_SIZE.H,
				blobIndex,
			);
		}
	}

	setup() {
		this.player.spawn(
			this.start.x * Consts.CELL_SIZE.W,
			(this.start.y + 1) * Consts.CELL_SIZE.H,
		 	'RIGHT'
		 );
	}

	reset() {
		this.web.clear();
		this.trees.locations.forEach(l => {
			l[2] = randomInt(25);
		});
		this.sun.reset();
	}

	update() {

		this.tracing.update();

		const treeLocation = this.trees.getTreeLocation(this.player);
		const connection = this.web.getConnection(this.player, treeLocation, this.sfx);
		if ((connection === Consts.WEB_CONNECTS.COMPLETED) || connection === Consts.WEB_CONNECTS.RELEASED) {

			const points = structuredClone(this.web.getPoints({ trimmed: connection === Consts.WEB_CONNECTS.COMPLETED }));

			const isMatch = patternMatch(this.props.pattern, points);
			
			if (isMatch) {
				if (connection === Consts.WEB_CONNECTS.COMPLETED) {
					this.web.cancel();
				}
				this.sfx.play('match', { randomRate: true });
				this.gotMatch = true;
				this.sun.end();
			}
		}

		if (this.web.isActive && player.isMoving()) {
			this.sfx.play('web');
		} else {
			this.sfx.pause('web');
		}

		this.sun.update();
		if (this.sun.isDone()) {
			this.sfx.play('inter', { randomRate: true });
			if (this.gotMatch) {
				this.props.isPracticePatternSolved = true;
			}
			this.sq.next();
		}
	}
}