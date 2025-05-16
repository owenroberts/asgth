import { Counter, Sequencer, random, choice, randomInt, tileMap } from '../cool/cool.js';
import { Doodoo } from '../doodoo/src/Doodoo.js';
import { Game, Sprite, TextButton, TextSprite, Button, SoundProvider, Texture, Scene, ColliderEmpty, ColliderSprite } from '../lines/src/Engine.js';
import { Animator, POINTS } from '../lines/src/Lines.js';
import { Web } from './Web.js';
import { Sun } from './Sun.js';
import { Narration } from './Narration.js';
import { SymbolMatch } from './SymbolMatch.js';
import { SymbolMatch2 } from './SymbolMatch2.js';
import { Spider } from './Spider.js';
import { Trees } from './Trees.js';


// scenes
import { Splash } from './scenes/Splash.js';
import { InstMove } from './scenes/InstMove.js';
import { InstChoose } from './scenes/InstChoose.js';
import { InstWeb } from './scenes/InstWeb.js';
import { InstSymbol } from './scenes/InstSymbol.js';
import { InterWebs } from './scenes/InterWebs.js';
import { RockLevel } from './scenes/RockLevel.js';

import { Strings } from './Strings.js';
import { Consts } from './Consts.js';

import themeFile from '../doodoo/compositions/inf3_theme_v.json';
import spritePaths from './data/sprites.json';
import shape_profiles_2 from './data/shape_profiles_2.json';
import level_bounds from './data/level_bounds.json';

const debug = true; // global debug

/* this is the game part */
const scenes = ['game', 'loading', 'narration', 'inst_move', 'inst_web', 'inst_sun', 'inst_symbol', 'webs', 'end', 'inst_choose'];

const gm = new Game({
	dps: 24,
	lineWidth: 1,
	// zoom: isMobile ? 1 : 1.5, --> fuck zoom doesn't work
	width: Consts.CELL_SIZE.W * Consts.GRID_COLS,
	height: Consts.CELL_SIZE.H * Consts.GRID_ROWS,
	multiColor: true,
	retina: true,
	bgColor: Consts.BG_COLOR,
	// debug: true,
	// stats: true,
	suspend: true,
	events: ['keyboard'],
	scenes: scenes,
	// testPerformance: true,
});
gm.load({ animations: { sprites: spritePaths }, }, false);
if (debug) console.log('game', gm);

let player;
let levelCount = 0; // counts levels, also used to advance narrative
let seq = Sequencer();
let points = { ROCK: 0, SPIDER: 0 };
let lastPointWinner;

let webs, websAnimator, websCounter;
let moon, stone, scoreDisplay, levelDisplay;
let narration; // handles text scenes
let doodoo, sfx;

function soundSetup(withSound) {
	if (withSound) {
		doodoo = new Doodoo({
			...themeFile,
			samplesURL: './doodoo/samples/',
			volume: -12,
			autoStart: false // !debug
		});

		sfx = SoundProvider({
			audioFiles: [
				{ key: 'web', url: 'zip_lock.wav', },
				{ key: 'connect', sequence: [1, 6] },
				{ key: 'cancel', url: 'cancel.wav', },
				// { key: 'button', sequence: [1, 3] },
				{ key: 'skip_button', url: 'button_2.wav' },
				{ key: 'next_button', url: 'button_3.wav' },
				{ key: 'stone',  sequence: [1, 9] },
				{ key: 'rock',  sequence: [1, 9] },
				{ key: 'match', sequence: [1, 7] },
				{ key: 'level_start', sequence: [1, 3] },
			]
		}, soundFiles => {
			narration.addSFX(sfx);
			seq.next(); // afterSetupOrSound();
		});
	} else {
		sfx = SoundProvider(); // empty sound provider plays nothing
		narration.addSFX(sfx);
		seq.next(); // afterSetupOrSound();
	}
}

function getNextSymbolString(len) {
	return Consts.LEVEL_ORDER.charAt(levelCount);

	// old way 
	// len = len ?? Math.min(3, Math.max(1, levelCount - points.rock));
	// let str = '';
	// for (let i = 0; i < len; i++) {
	// 	str += random('abcdefghijklm'.split(''));
	// }
	// return str;
}

function setupRockScene(scene) {
	
	web.end(); // unset web scene
	sfx.pause('web');
	// selectSprite.isActive = false;
	trees.startAnimator();

	scene.addToDisplay(stone);

	// rock starts animating
	const dir = choice(-1, 1);
	stone.position[0] = dir === 1 ? -stone.halfWidth : gm.width;
	stone.position[1] = -stone.halfHeight;
	stone.isActive = true;

	sfx.play('stone');
	sfx.play('rock');

	player.isActive = false;

	scene.onUpdate = () => {
		stone.position[0] += random(2, 1) * dir;
		stone.position[1] += random(-1, 2);

		sfx.loop('stone');
		sfx.loop('rock');

		if ((dir === -1 && stone.position[0] < -stone.width) || 
			dir === 1 && stone.position[0] > gm.width) {
			stone.isActive = false;
			stone.displayFunc = undefined;
			player.isActive = true;
			seq.next();
		}
		trees.shake();
	};

	web.startOverride();
}

function setupNarrativeScene() {
	// this is more like next narrative or something ... 

	scoreDisplay.isActive = true; // separate scene?
	levelDisplay.isActive = true;

	let nextNarration = Strings.NARRATIVE[lastPointWinner][levelCount];
	
	const nextSymbolString = getNextSymbolString();

	if (levelCount < 7) {
		nextLevel = setupWalkLevel(nextSymbolString);
	} else {
		nextLevel = 'end';
	}

	narration.addSequence([nextNarration], () => {
		narration.add([Strings.INST_DRAW]);
		narration.addSymbols(nextSymbolString);
		scoreDisplay.isActive = false;
		levelDisplay.isActive = false;
	});
	
	return;
		
	// old crap 
	// let intro = `The ${lastPointWinner === 'spider' ? 'tale' : 'story'} of the ${lastPointWinner}`;
	if (!nextNarration) {
		// end of game/round
		// const winner = score.points.filter(p => p === 1).length > score.points.filter(p => p === 0).length ? 'spider' : 'rock';
		const winner = points.spider > points.rock ? 'A' : 'B';
		nextNarration = Strings.NARRATIVE.END[lastPointWinner][winner];
		nextLevel = 'end';
		narration.cancelSymbols();
	} else {
		// nextLevel = setupLevel(nextSymbolString);
		nextLevel = setupWalkLevel(nextSymbolString);
	}
	
	narration.add([intro, nextNarration]);
	gm.scenes.current = 'narration';
	sfx.play('level_start', true);
}

function setupWalkLevel(symbolString) {
	
	const { levels } = level_bounds;
	const levelIndex = levelCount < levels.length ? levelCount : randomInt(0, levels.length - 1);
	const levelData = levels[levelIndex];
	const levelName = 'walk-' + levelCount;

	const scene = new Scene();
	scene.needsUpdate = true;
	const bg = new Sprite(0, 0, gm.anims.sprites.levels);
	bg.animation.frame = levelIndex;
	scene.addToDisplay(bg);
	scene.addSprite(player);
	scene.addToDisplay(moon);
	// scene.addToDisplay(score);

	const groundTexture = choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');
	const ground = new Texture({ animation: gm.anims.sprites[groundTexture] });
	scene.addToDisplay(ground);
	const matrix = [];
	for (let x = 0; x < 13; x++) {
		for (let y = 0; y < 8; y++) {
			matrix[x + y * 13] = 0;
		}
	}

	const colliders = levelData.bounds.map(b => {
		const [x, y, w, h] = b;
		for (let _x = x; _x < x + w; _x++) {
			for (let _y = y; _y < y + h; _y++) {
				matrix[_x + _y * 13] = 1;
			}
		}
		const c = new ColliderEmpty(x * 64, y * 64, w * 64, h * 64);
		c.debug = true;
		return c;
	});

	if (levelData.ground) {
		levelData.ground.map(g => {
			const [x, y, w, h] = g;
			for (let _x = x; _x < x + w; _x++) {
				for (let _y = y; _y < y + h; _y++) {
					matrix[_x + _y * 13] = 1;
				}
			}
		});
	}

	function getMatrixCellNum(x, y, includeEdges=false) {
		if (x < 0 || y < 0 || x >= 13 || y >= 8) {
			return -1;
		} else {
			return matrix[x + y * 13];
		}
	}

	function getWangBlobNum(binaryString) {
		let array = binaryString.split('').map(n => Boolean(+n));
		let [t, tr, r, br, b, bl, l, tl] = array;
		if (!(t && l)) tl = 0;
		if (!(t && r)) tr = 0;
		if (!(b && l)) bl = 0;
		if (!(b && r)) br = 0;

		let tot = 0;
		if (t) 	tot += (1 << 0);
		if (tr)	tot += (1 << 1);
		if (r)	tot += (1 << 2);
		if (br)	tot += (1 << 3);
		if (b) 	tot += (1 << 4);
		if (bl)	tot += (1 << 5);
		if (l)	tot += (1 << 6);
		if (tl)	tot += (1 << 7);

		return tot;
	}

	function getMatrixCell(x, y, n) {
		return [
			getMatrixCellNum(x    , y - 1) === n ? 1 : 0,
			getMatrixCellNum(x + 1, y - 1) === n ? 1 : 0,
			getMatrixCellNum(x + 1, y    ) === n ? 1 : 0,
			getMatrixCellNum(x + 1, y + 1) === n ? 1 : 0,
			getMatrixCellNum(x    , y + 1) === n ? 1 : 0,
			getMatrixCellNum(x - 1, y + 1) === n ? 1 : 0,
			getMatrixCellNum(x - 1, y    ) === n ? 1 : 0,
			getMatrixCellNum(x - 1, y - 1) === n ? 1 : 0,
		].join('').toString();
	}

	for (let i = 0; i < matrix.length; i++) {
		if (matrix[i] === 0) {
			const x = i % 13;
			const y = Math.floor(i / 13);
			const mt = getMatrixCell(x, y, 0);
			const n = getWangBlobNum(mt);
			const f = tileMap.indexOf(n);
			ground.addLocation(x * 64, y * 64, f);
		}
	}

	let moonAnim = new Counter(Consts.MOON_INTERVAL);

	const end = levelData.end;
	// const ender = new ColliderEmpty(end[0] * 64, end[1] * 64, 64, 64);

	const ender = new ColliderSprite(end[0] * 64, end[1] * 64, gm.anims.sprites.end_web);
	scene.add(ender);

	scene.onUpdate = () => {
		for (let i = 0; i < colliders.length; i++) {
			if (player.collide(colliders[i])) player.back();
			// colliders[i].drawDebug();
		}
		// ender.drawDebug();
		
		if (player.collide(ender)) {
			sfx.play('level_start', true);
			gm.scenes.current = setupLevel(symbolString);
		}

		moonAnim.update();
		moon.position[1] = map(Math.sin(moonAnim.getRatio() * Math.PI), 0, 1, gm.height - 64, 0, true);
	};

	player.spawn([levelData.start[0] * 64 + 32, levelData.start[1] * 64 + 32]);
	gm.scenes.addScene(scene, levelName);
	return levelName;
}

function resetGame() {
	levelCount = 0;
	gm.scenes.current = "splash";
	lastPointWinner = undefined;
	nextLevel = undefined;
	if (doodoo) {
		doodoo.stop();
		doodoo.play();
	}
}

function clearStuff() {
	web.clear();
	trees.clear();
	narration.cancelSymbols();
}

gm.start = function() {

	const { sprites } = gm.anims;

	gm.setBounds('left', 0);
	gm.setBounds('top', 0);
	gm.setBounds('right', (Consts.GRID_COLS - 1) * Consts.CELL_SIZE.W);
	gm.setBounds('bottom', Consts.GRID_ROWS * Consts.CELL_SIZE.H);

	player = new Spider(gm.halfWidth + Consts.CELL_SIZE.W * 3, gm.halfHeight, {
		up_left: 'up_left', 
		up_right: 'up_right', 
		down_left: 'down_left', 
		down_right: 'down_right',
	}, gm.bounds);
	player.setAnimation(gm.anims.sprites.spider);
	
	gm.scenes.splash = Splash(gm.anims.sprites);
	gm.scenes.inst_move = InstMove(gm.anims.sprites, player);
	gm.scenes.inst_choose = InstChoose(gm.anims.sprites);
	gm.scenes.inst_web = InstWeb(gm.anims.sprites, player, seq);
	gm.scenes.inst_symbol = InstSymbol(gm, player, seq);
	gm.scenes.inter_webs = InterWebs(gm, seq);

	moon = new Sprite(13 * 64, 7 * 64, sprites.moon);
	stone = new Sprite(gm.width, -sprites.stone.height, sprites.stone);
	stone.isActive = false;
	stone.animation.isPlaying = true;

	// need these? 
	scoreDisplay = new Texture({ animation: sprites.score });
	gm.scenes.narration.addToDisplay(scoreDisplay);

	levelDisplay = new Texture({ animation: sprites.symbols_small });
	gm.scenes.narration.addToDisplay(levelDisplay);

	// make this a scene -- later
	narration = Narration(gm.anims.sprites);
	gm.scenes.narration.addToDisplay(narration);
	gm.scenes.narration.onKeyUp['x'] = function() {
		if (narration.isDone()) {
			sfx.play('next_button', true);
			seq.next();
		} else {
			narration.next();
		}
		player.resetInput(); // need this? 
	};

	const ending = new Sprite(0, 0, sprites.ending);
	gm.scenes.end.addToDisplay(ending);
	gm.scenes.end.onKeyUp[Strings.RESET_BTN] = function() {
		sfx.play('next_button');
		resetGame();
	};
	ending.animation.play();
	ending.animation.onPlayedOnce = function() {
		ending.animation.onPlayedOnce = undefined;
		ending.animation.state = "still_frame";
		
		gm.scenes.end.addToDisplay(new TextSprite({
			msg: Strings.RESET_BTN,
			x: 64 * 2,
			y: 64 * 5.5,
			letters: sprites.letters_keyboard,
		}));
		
		gm.scenes.end.addToDisplay(new TextSprite({
			msg: Strings.INST_RESTART,
			wrap: 24,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: 64 * 3,
			y: 64 * 5.5,
			letters: sprites.letters,
		}));
	};

	const loadingSprite = new Sprite(gm.halfWidth, gm.halfHeight, sprites.loading_web);
	loadingSprite.center = true;
	gm.scenes.loading.addToDisplay(loadingSprite);
	loadingSprite.animation.play();

	if (debug) {
		gm.scenes.debug = new Scene();
		gm.scenes.debug.add(new TextSprite({
			msg: "x to start debug",
			x: 64,
			y: 64,
			letters: gm.anims.sprites.letters,
			letterIndexString: Consts.SYMBOL_INDEX_STRING,
		}));
	}

	// game sequence
	const hasCompletedInstructions = false; // localStorage.getItem('spider-instructions-complete');
	const choseRepeatInstructions = false;
	let nextSymbolString = ""; // maybe don't need this if not setting up rock thing
	let useSound = false;

	seq.add(() => { 
		if (!debug) return seq.next();
		gm.scenes.setCurrent("debug");
		gm.scenes.debug.onKeyDown['x'] = () => {
			seq.next();	
		};
	});

	seq.add(() => {
		if (!debug) return seq.next();
		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(true);
	});

	seq.add(() => {
		if (debug) return seq.next();

		gm.scenes.splash.setup();
		gm.scenes.splash.onKeyDown['x'] = function() {
			useSound = true;
			seq.next();
		};
		gm.scenes.splash.onKeyUp['z']= function() {
			useSound = false;
			seq.next();
		};
		gm.scenes.setCurrent("splash");
	});

	seq.add(() => {
		if (debug) return seq.next();
		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(useSound);
	});

	seq.add(() => {
		if (debug) return seq.next();
		if (!hasCompletedInstructions) return seq.next();

		gm.scenes.inst_choose.setup();

		// skip instructions
		gm.scenes.inst_choose.onKeyDown['x'] = () => {
			seq.next();
			player.resetInput();
		};

		// repeat instructions
		gm.scenes.inst_choose.onKeyDown['z'] = () => {
			choseRepeatInstructions = true;
			seq.next();
			player.resetInput(); // need this?
		};

		gm.scenes.setCurrent("inst_choose");
	});

	seq.add(() => {
		if (debug) return seq.next();
		if (hasCompletedInstructions && !choseRepeatInstructions) {
			seq.next();
			return;
		}

		sfx.play("level_start", true);
		gm.scenes.inst_move.setup();
		gm.scenes.inst_move.onKeyDown['x'] = function() {
			if (!gm.scenes.inst_move.check()) return;
			sfx.play("next_button");
			seq.next();
		};

		gm.scenes.setCurrent("inst_move");
	});

	seq.add(() => {
		if (debug) return seq.next();
		if (hasCompletedInstructions && !choseRepeatInstructions) {
			seq.next();
			return;
		}
		
		gm.scenes.inst_web.setup(sfx);
		gm.scenes.setCurrent("inst_web");
	});

	seq.add(() => {
		if (debug) return seq.next();
		if (hasCompletedInstructions && !choseRepeatInstructions) {
			seq.next();
			return;
		}
		narration.addSymbols(Consts.PRACTICE_SYMBOL);
		gm.scenes.current = 'narration';
		narration.add([Strings.INST_WEB_4, Strings.INST_SUN]);
	});

	seq.add(() => {
		if (debug) return seq.next();
		if (hasCompletedInstructions && !choseRepeatInstructions) {
			seq.next();
			return;
		}
		gm.scenes.inst_symbol.setup(sfx);
		gm.scenes.setCurrent("inst_symbol");
	});

	seq.add(() => {
		// if (debug) return seq.next();
		localStorage.setItem('spider-instructions-complete', true);
		// clearStuff();
		narration.add([Strings.EDWARDS_QUOTE_1, Strings.EDWARDS_QUOTE_2]);
		gm.scenes.setCurrent("narration");
	});

	seq.add(() => { gameLoop(); });

	function gameLoop() {

		nextSymbolString = getNextSymbolString();
		narration.addSymbols(nextSymbolString);
		narration.add([Strings.INST_DRAW]);
		gm.scenes.setCurrent("narration");

		scoreDisplay.isActive = false; // for after first loop
		levelDisplay.isActive = false;

		const levelName = `level-${levelCount}`;

		seq.add(() => {
			gm.scenes[levelName] = RockLevel(gm, player, seq, sfx, nextSymbolString, levelCount, points);
			gm.scenes.setCurrent(levelName);
		});

		seq.add(() => {
			if (lastPointWinner == "SPIDER") {
				gm.scenes.inter_webs.setup();
				gm.scenes.setCurrent("inter_webs");
			} else {
				// setupRockScene(gm.scenes.current);
				gm.scenes[levelName].rock();
			}
		});

		seq.add(() => {
			clearStuff();
			let nextNarration = Strings.NARRATIVE[lastPointWinner][levelCount];
			levelCount++;
			narration.add([nextNarration]);
			scoreDisplay.isActive = true; // separate scene?
			levelDisplay.isActive = true;
			sfx.play('level_start', true);
			gm.scenes.setCurrent("narration");
			
		});

		seq.add(() => {
			if (levelCount > Consts.NUM_LEVELS) {
				gm.scenes.setCurrent("end");
			} else {
				gameLoop();
			}
		});
	}

	seq.next();
};

gm.update = function(timeElapsed) {
	player.update(timeElapsed, true);
	// part of scene?
	if (gm.scenes.current.onUpdate) {
		gm.scenes.current.onUpdate();
	}
};

gm.draw = function() {
	gm.scenes.current.display();
};

gm.keyDown = function(key) {
	switch (key) {

		case 'x':
		case 'z':
			if (gm.scenes.current.onKeyDown[key]) {
				gm.scenes.current.onKeyDown[key]();
				return;
			}
			player.inputKey(key, true);
		break;

		case 'left':
		case 'up':
		case 'right':
		case 'down':
		case 'c':
		case 'v':
		case 'b':
		case 'n':
		case 'm':
			player.inputKey(key, true);
		break;
	}
};

gm.keyUp = function(key) {
	switch (key) {

		case Strings.RESET_BTN:
		case 'x':
		case 'z':
			if (gm.scenes.current.onKeyUp[key]) {
				gm.scenes.current.onKeyUp[key]();
				return;
			}
			player.inputKey(key, false);
		break;

		case 'z':
		case 'left':
		case 'up':
		case 'right':
		case 'down':
		case 'c':
		case 'v':
		case 'b':
		case 'n':
		case 'm':
			player.inputKey(key, false);
		break;
	}
};