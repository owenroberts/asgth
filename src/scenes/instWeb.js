import { Counter, randomInt, choice } from '../../cool/cool.js';
import { Scene, TextSprite, TileMap, BlobMap, Texture } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Tracing } from '../components/Tracing.js';

/**
 * practice using web to connect two trees
 * @param {Object} gm - game manager
 * @param {Spider} player - the player
 */
export function instWeb(gm, player) {

	const scene = new Scene();
	let instBtn, instText;
	let trees, web, tracing;
	let sfx;

	scene.setup = function(_sfx) {

		sfx = _sfx;

		trees = Trees(gm);
		web = Web(sfx);

		scene.addSprite([player, web, trees.getSprites()]);
		
		instText = scene.addToDisplay(new TextSprite({
			countForward: true,
			msg: Strings.INST_WEB_1,
			wrap: 22,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W2,
			y: Consts.CELL_SIZE.H2,
			letters: gm.anims.sprites.letters,
		}));

		instBtn = scene.addToDisplay(new TextSprite({
			msg: Consts.PRIMARY_BTN,
			x: Consts.CELL_SIZE.W * Consts.INST_WEB_X1,
			y: Consts.CELL_SIZE.H2,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		const start = { x: 0, y: 3 };
		const ground = scene.add(new Texture({ 
			animation: gm.anims.sprites[choice('tiles_stones', 'tiles_dirt')]
		}));

		const tileMap = new TileMap(13, 3);
		const treeLocations = [
			[randomInt(0, 5), randomInt(0, 2)], 
			[randomInt(6, 11), randomInt(0, 2)]
		];

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

		tracing = Tracing([treeLocations], start, true);
		scene.addToDisplay(tracing);

		player.spawn([
			(start.x + 1) * Consts.CELL_SIZE.W,
			(start.y) * Consts.CELL_SIZE.H,
		], 'DOWN');
	};

	// after connecting trees and releasing web, go to practice symbol
	// conditions? some kind of condition manager?
	const conditions = {
		firstTree: false,
		secondTree: false,
		releasedWeb: false,
		clearedWeb: false,
		visualizedWeb: false,
	};

	const delay = new Counter(Consts.PRACTICE_DELAY, () => {
		gm.sq.next();
	});

	scene.onUpdate = function() {

		if (player.input.v) {
			player.input.v = false;
			tracing.activate(sfx);
			conditions.visualizedWeb = true;
		}

		const treeLocation = trees.isColliding(player);
		const connection = web.getConnection(player, treeLocation);

		if (connection === Consts.WEB_CONNECTS.STARTED) {
			if (!conditions.firstTree && !conditions.secondTree && !conditions.releasedWeb) {
				conditions.firstTree = true;
				instBtn.x = Consts.INST_WEB_X2 * Consts.CELL_SIZE.W;
				instText.setMsg(Strings.INST_WEB_2);
			}
		}

		if (connection === Consts.WEB_CONNECTS.COMPLETED) {
			if (conditions.firstTree && !conditions.releasedWeb) {
				conditions.secondTree = true;
				instBtn.setMsg(Consts.SECONDARY_BTN);
				instBtn.x = Consts.INST_WEB_X3 * Consts.CELL_SIZE.W;
				instText.setMsg(Strings.INST_WEB_3);
			}
		}

		if (connection === Consts.WEB_CONNECTS.RELEASED ||
			connection === Consts.WEB_CONNECTS.CANCELED) {
			if (conditions.firstTree && conditions.secondTree) {
				conditions.releasedWeb = true;
				instBtn.setMsg(Consts.CLEAR_BTN);
				instBtn.x = Consts.INST_WEB_X4 * Consts.CELL_SIZE.W;
				instText.setMsg(Strings.INST_WEB_4);
			}
		}

		if (connection === Consts.WEB_CONNECTS.CLEARED) {
			if (conditions.firstTree && conditions.secondTree && conditions.releasedWeb) {
				conditions.clearedWeb = true;
				instBtn.setMsg(Consts.VIZ_BTN);
				instBtn.x = Consts.INST_WEB_X5 * Consts.CELL_SIZE.W;
				instText.setMsg(Strings.INST_WEB_5);
			}
		}

		
		if (conditions.firstTree && conditions.secondTree && conditions.releasedWeb && conditions.clearedWeb && conditions.visualizedWeb) {
			delay.update();
		}
	};

	return scene;
}