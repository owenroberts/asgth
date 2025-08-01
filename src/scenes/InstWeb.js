import { Counter, randomInt, choice } from '../../cool/cool.js';
import { Scene, TextSprite, TileMap, BlobMap, Texture } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Tracing } from '../components/Tracing.js';

export class InstWeb extends Scene {

	constructor(gm) {
		super();

		this.player = this.add(gm.player);
		this.sfx = gm.sfx;
		this.input = gm.input;

		// after connecting trees and releasing web, go to practice symbol
		// conditions? some kind of condition manager?
		// isFirstTreeConnected? yikes
		this.conditions = {
			firstTree: false,
			secondTree: false,
			releasedWeb: false,
			clearedWeb: false,
			visualizedWeb: false,
		};

		this.delay = new Counter(Consts.PRACTICE_DELAY, () => {
			gm.sq.next();
		});

		this.trees = this.add(new Trees(gm));
		this.web = this.add(new Web(gm));
		
		this.instText = this.add(new TextSprite({
			countForward: true,
			msg: Strings.INST_WEB_1,
			wrap: 22,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W2,
			y: Consts.CELL_SIZE.H2,
			letters: gm.anims.sprites.letters,
		}));

		this.instBtn = this.add(new TextSprite({
			msg: Consts.KEY_DISPLAY.BTN_1,
			x: Consts.CELL_SIZE.W * Consts.INST_WEB_X1,
			y: Consts.CELL_SIZE.H2,
			letters: gm.anims.sprites.letters_keyboard,
		}));

		// DRY w InstPattern ... 
		this.start = { x: 0, y: 3 };
		const ground = this.add(new Texture({ 
			animation: gm.anims.sprites[choice('tiles_stones', 'tiles_dirt')]
		}));

		const tileMap = new TileMap(13, 3);
		const treeLocations = [
			[randomInt(0, 5), randomInt(0, 2)], 
			[randomInt(6, 11), randomInt(0, 2)]
		];

		for (let i = 0; i < treeLocations.length; i++) {
			let [x, y] = treeLocations[i];
			this.trees.addLocation(
				(this.start.x + x) * Consts.CELL_SIZE.W,
				(this.start.y + y) * Consts.CELL_SIZE.H,
				randomInt(25),
			);

			tileMap.setTileProperty(x, y, 'type', 1); // default type is 0
		}

		this.tracing = this.add(new Tracing(gm, [treeLocations], this.start, true));
		
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
		this.player.spawn([
			(this.start.x + 1) * Consts.CELL_SIZE.W,
			(this.start.y) * Consts.CELL_SIZE.H,
		], 'DOWN');
	}

	update() {


		if (this.input.triggerKey('BTN_4')) {
			this.conditions.visualizedWeb = true;
		}
		this.tracing.update();

		const treeLocation = this.trees.getTreeLocation(this.player);
		const connection = this.web.getConnection(this.player, treeLocation, this.sfx);

		if (connection === Consts.WEB_CONNECTS.STARTED) {
			if (!this.conditions.firstTree && !this.conditions.secondTree && !this.conditions.releasedWeb) {
				this.conditions.firstTree = true;
				this.instBtn.x = Consts.INST_WEB_X2 * Consts.CELL_SIZE.W;
				this.instText.setMsg(Strings.INST_WEB_2);
			}
		}

		if (connection === Consts.WEB_CONNECTS.COMPLETED) {
			if (this.conditions.firstTree && !this.conditions.releasedWeb) {
				this.conditions.secondTree = true;
				this.instBtn.setMsg(Consts.SECONDARY_BTN);
				this.instBtn.x = Consts.INST_WEB_X3 * Consts.CELL_SIZE.W;
				this.instText.setMsg(Strings.INST_WEB_3);
			}
		}

		if (connection === Consts.WEB_CONNECTS.RELEASED ||
			connection === Consts.WEB_CONNECTS.CANCELED) {
			if (this.conditions.firstTree && this.conditions.secondTree) {
				this.conditions.releasedWeb = true;
				this.instBtn.setMsg(Consts.CLEAR_BTN);
				this.instBtn.x = Consts.INST_WEB_X4 * Consts.CELL_SIZE.W;
				this.instText.setMsg(Strings.INST_WEB_4);
			}
		}

		if (connection === Consts.WEB_CONNECTS.CLEARED) {
			if (this.conditions.firstTree && this.conditions.secondTree && this.conditions.releasedWeb) {
				this.conditions.clearedWeb = true;
				this.instBtn.setMsg(Consts.VIZ_BTN);
				this.instBtn.x = Consts.INST_WEB_X5 * Consts.CELL_SIZE.W;
				this.instText.setMsg(Strings.INST_WEB_5);
			}
		}

		if (this.conditions.firstTree && this.conditions.secondTree && this.conditions.releasedWeb && this.conditions.clearedWeb && this.conditions.visualizedWeb) {
			this.delay.update();
		}
	}
}