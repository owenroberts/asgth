import { Counter, randomInt, choice } from '../../cool/cool.js';
import { Scene, TextSprite, TileMap, BlobMap, Texture } from '../../lines/src/Engine.js';

import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';
import { patternMatch } from '../patternMatch.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Sun } from '../components/Sun.js';
import { Tracing } from '../components/Tracing.js';

export function instPattern(gm, player) {

	const scene = new Scene();
	let trees, web, tracing, sun;
	let gotMatch = false;

	scene.setup = function() {

		trees = Trees(gm);
		web = Web();
		sun = Sun(gm);
		scene.add(sun.getSprite());

		scene.addSprite([player, web, trees.getSprites()]);

		// not DRY ... idk
		const start = { x: 4, y: 1 };
		const ground = scene.add(new Texture({ animation: gm.anims.sprites[choice('tiles_stones', 'tiles_dirt')] }, true));

		const tileMap = new TileMap(5, 5);
		const treeLocations = [[1,1], [1,2], [1,3], [2,1], [2,2], [2,3], [3,1], [3,2], [3,3]];


		for (let i = 0; i < treeLocations.length; i++) {
			let [x, y] = treeLocations[i];
			trees.addLocation(
				(start.x + x) * Consts.CELL_SIZE.W,
				(start.y + y) * Consts.CELL_SIZE.H,
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
				(start.x + x) * Consts.CELL_SIZE.W, 
				(start.y + y) * Consts.CELL_SIZE.H,
				blobIndex,
			);
		}

		tracing = Tracing(gm.props.pattern, start, true);
		scene.addToDisplay(tracing);

		player.spawn([
			start.x * Consts.CELL_SIZE.W,
			(start.y + 1) * Consts.CELL_SIZE.H,
		], 'RIGHT');
	};

	scene.reset = function() {
		web.clear();
		trees.getTexture().locations.forEach(l => {
			l.i = randomInt(25);
		});
		sun.reset();
	};

	scene.onUpdate = function() {

		// not dry ...
		if (player.input.v) {
			player.input.v = false;
			tracing.activate(gm.sfx);
		}

		const treeLocation = trees.isColliding(player);
		const connection = web.getConnection(player, treeLocation, gm.sfx);
		if ((connection === Consts.WEB_CONNECTS.COMPLETED && checkUnfinished) || connection === Consts.WEB_CONNECTS.RELEASED) {

			const points = structuredClone(web.getPoints({ trimmed: connection === Consts.WEB_CONNECTS.COMPLETED }));

			const isMatch = patternMatch(gm.props.pattern, points);
			
			if (isMatch) {
				if (connection === Consts.WEB_CONNECTS.COMPLETED) {
					web.cancel();
				}
				gm.sfx.play('match', { randomRate: true });
				gotMatch = true;
				sun.end();
			}
		}

		if (web.isActive() && player.isMoving()) {
			console.log('play web');
			gm.sfx.play('web');
		} else {
			gm.sfx.pause('web');
		}

		sun.update();
		if (sun.isDone()) {
			gm.sfx.play('inter', { randomRate: true });
			if (gotMatch) gm.props.isPracticePatternSolved = true;
			gm.sq.next();
		}

	};

	return scene;

}