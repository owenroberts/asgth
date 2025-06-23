import { randomInt } from '../../cool/cool.js';
import { Scene, TextSprite, Texture } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Sun } from '../components/Sun.js';

import { SymbolMatch } from '../SymbolMatch.js';
import { SymbolMatch2 } from '../SymbolMatch2.js';

export function instSymbol(gm, player) {
	
	const scene = new Scene();
	
	const symbolMatch = SymbolMatch();
	const symbolMatch2 = SymbolMatch2();

	// why ground a let?
	let ground, trees, sun, web, webUpdater;
	let attemptCount = 0, webCount = 0;
	let gotSymbol = false; // so they can't fuck it up after

	let sfx;

	/* finish for them */
	let checkUnfinished = true;
	document.addEventListener('keydown', ev => {
		if (ev.code === 'KeyY') {
			checkUnfinished = !checkUnfinished;
			console.log('Check unfinished toggled', checkUnfinished);
		}
	});

	scene.setup = function(_sfx) {
		sfx = _sfx;

		player.spawn([Consts.CELL_SIZE.W * 5.5, Consts.CELL_SIZE.H * 5.5]);
		scene.add(player);

		trees = Trees(gm);
		scene.addSprite(trees.getSprites());
		web = Web(sfx);
		scene.addSprite(web);
		sun = Sun(gm);
		scene.add(sun.getSprite());

		scene.add(new TextSprite({
			msg: Consts.PRACTICE_SYMBOL,
			x: Consts.CELL_SIZE.W * 10,
			y: Consts.CELL_SIZE.H * 0.5,
			wrap: 6,
			letters: gm.anims.sprites.symbols_big,
			track: Consts.SYMBOLS_TRACK,
			lead: Consts.SYMBOLS_LEAD,
			letterIndexString: Consts.SYMBOL_INDEX_STRING,
		}));

		ground = scene.add(new Texture({ animation: gm.anims.sprites.tiles_dirt }));

		setupScene();
	};

	function moreInstructions() {
		narration.add([
			Strings.INST_WEB_5,
			Strings.INST_WEB_6,
			Strings.INST_WEB_7,
		]);
		narration.addCallback(() => {
			gme.scenes.setCurrent("instSymbol");
		});
		gm.scenes.setCurrent("narration");
	}

	function setupScene() {

		trees.clear();
		ground.clear();
		webCount = 0;

		for (let x = 0; x <= 4; x += 1) {
			for (let y = 0; y <= 4; y += 1) {
				if (x === 0 || y === 0 || x === 4 || y === 4) {
					ground.addLocation(
						Consts.CELL_SIZE.W + x * Consts.CELL_SIZE.W, 
						Consts.CELL_SIZE.H + y * Consts.CELL_SIZE.H, 
						21
					);
					continue;
				}
				trees.addLocation(
					Consts.CELL_SIZE.W + x * Consts.CELL_SIZE.W, 
					Consts.CELL_SIZE.H + y * Consts.CELL_SIZE.H,
					randomInt(25)
				);
			}
		}
	}

	scene.onUpdate = function() {
		
		const treeLocation = trees.isColliding(player);
		const connection = web.getConnection(player, treeLocation);

		if ((connection === Consts.WEB_CONNECTS.COMPLETED && checkUnfinished) || connection === Consts.WEB_CONNECTS.RELEASED) {

			const points = web.getPoints(connection === Consts.WEB_CONNECTS.COMPLETED);

			const symbolMatches = symbolMatch.getMatch(points, 64, 32)
				.flatMap(m => m)
				.map(m => m.symbol);
			
			const symbolMatches2 = symbolMatch2.getMatch(points, 64, 32)
				.flatMap(m => m);

			if (symbolMatches.includes(Consts.PRACTICE_SYMBOL)) {
				gotSymbol = true;
			}

			if (symbolMatches2.includes(Consts.PRACTICE_SYMBOL)) {
				gotSymbol = true;
			}

			if (gotSymbol) {
				if (connection === Consts.WEB_CONNECTS.COMPLETED) {
					sfx.play('cancel');
					web.cancel();
				}
				sfx.play('match', true, 0.9, 1.1);
				sun.end();
			}

			webCount++;
			
			if (webCount >= 12) {
				moreInstructions();
				setupScene();
			}
		}

		sun.update();
		if (sun.isDone()) {
			if (gotSymbol) {
				gm.sq.next();
			} else {
				moreInstructions();
				setupScene();
			}
		}
	};

	return scene;
}