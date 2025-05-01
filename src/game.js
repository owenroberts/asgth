import * as Cool from '../cool/cool.js';
import { Doodoo } from '../doodoo/src/Doodoo.js';
import { Game, Sprite, TextButton, TextSprite, Button, SoundProvider, Counter, Texture, Scene, ColliderEmpty, ColliderSprite } from '../lines/src/Engine.js';
import { Animator } from '../lines/src/Lines.js';
import { Web } from './Web.js';
import { Narration } from './Narration.js';
import { SymbolMatch } from './SymbolMatch.js';
import { SymbolMatch2 } from './SymbolMatch2.js';
import { Spider } from './Spider.js';
import { Trees } from './classes/Trees.js';
import { Level } from './classes/Level.js';

import themeFile from '../doodoo/compositions/inf3_theme_v.json';

import { sunFinish, shakeAmount, sunInterval, moonInterval, edwardsQuote, narrative, cellSize, lettersTrack, lettersLead, things } from './Utils.js';
import { Strings } from './Strings.js';
import { Consts } from './Consts.js';

const playedInstructions = false; // localStorage.getItem('spider-instructions-complete');

/* this is the game part */
const scenes = ['game', 'splash', 'loading', 'narration', 'instructionsMovement', 'instructionsWeb', 'instructionsSun', 'instructionsSymbol', 'webs', 'end', 'chooseInstructions'];
scenes.push('debug');
const gme = new Game({
	dps: 24,
	lineWidth: 1,
	// zoom: isMobile ? 1 : 1.5, --> fuck zoom doesn't work
	width: 64 * 14,
	height: 64 * 7,
	multiColor: true,
	retina: true,
	bgColor: '#aeaaa6', //'#4a4047',
	// debug: true,
	// stats: true,
	suspend: true,
	events: ['mouse'],
	scenes: scenes,
	// testPerformance: true,
	bounds: {
		left: -1024,
		top: 1024,
		right: 1024,
		bottom: 1024,
	}
});

/* debugging */
const debug = false; // glob debug val
const debugScene = "end";
if (debug) console.log('gme', gme);
let mapAlpha = 0;
let mapCellSize = 24;
document.addEventListener('keydown', ev => {
	if (ev.code === 'Equal') mapAlpha = Math.min(1, mapAlpha + 0.5);
	else if (ev.code === 'Minus') mapAlpha = Math.max(0, mapAlpha - 0.5);
	if (ev.code === 'KeyT') {
		continuousWeb = !continuousWeb;
		console.log('Continuous web toggled', continuousWeb);
	}
	if (ev.code === 'KeyY') {
		checkUnfinishedConnection = !checkUnfinishedConnection;
		console.log('Check unfinished toggled', checkUnfinishedConnection);
	}
	// else if (ev.code == 'Enter') ui.message.continue.onClick(); // to move message without mouse
});

gme.load({
	animations: {
		sprites: './data/sprites.json',	
	},
	data: {
		shape_profiles: './data/shape_profiles.json',
		shape_profiles_2: './data/shape_profiles_2.json',
		level_bounds: './data/level_bounds.json'
	}
}, false);

let player;
let continuousWeb = true;
let checkUnfinishedConnection = true;
let sun, moon, selectSprite, stone, scoreDisplay, levelDisplay;
let webs, websAnimator, websCounter;
let sunCounter = new Counter(sunInterval);
let sunAnimation = new Counter(sunInterval);
let points = { rock: 0, spider: 0 };
let lastPointWinner;

let web = Web();
let symbolMatch, symbolMatch2;
let trees;
let playerOnTreeLoc = [], prevTreeLoc = [], allTrees = [];
let narration; // handles text scenes
let doodoo, sfx;

let levelCount = 0; // counts levels, also used to advance narrative
let nextLevel; // save value of next level following dialog

function debugStart() {
	soundSetup();
	if (debugScene === 'instructionsSymbol') {
		setupPractice();
	} else if (debugScene === 'game') {
		const letter = Cool.random('abcd'.split(''));
		gme.scenes.current = setupLevel(letter);
	} else if (debugScene === 'rock') {
		const letter = Cool.random('abcd'.split(''));
		lastPointWinner = 'rock';
		const sceneName = setupLevel(letter);
		gme.scenes.current = sceneName;
		startRockScene(gme.scenes[sceneName]);
	} else {
		gme.scenes.current = debugScene;
	}
}

function splashSetup() {
	const { sprites } = gme.anims;
	const splash = gme.scenes.splash;

	splash.addToDisplay(new TextSprite({
		countForward: true,
		msg: "all spiders go to hell",
		wrap: 20,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 3,
		y: 64 * 1,
		letters: sprites.letters_white,
	}));

	splash.addToDisplay(new TextSprite({
		msg: "x",
		x: 64 * 2,
		y: 64 * 3,
		letters: sprites.letters_keyboard,
	}));

	splash.addToDisplay(new TextSprite({
		msg: "start with sound",
		countForward: true,
		wrap: 24,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 3,
		y: 64 * 3,
		letters: sprites.letters,
	}));

	splash.addToDisplay(new TextSprite({
		msg: "z",
		x: 64 * 2,
		y: 64 * 4.5,
		letters: sprites.letters_keyboard,
	}));

	splash.addToDisplay(new TextSprite({
		msg: "start silent",
		countForward: true,
		wrap: 14,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 3,
		y: 64 * 4.5,
		letters: sprites.letters,
	}));
}

function spritesSetup() {
	const { sprites } = gme.anims;

	trees = new Trees({ animation: sprites.trees });
	gme.scenes.add(trees, ['instructionsWeb', 'instructionsWeb', 'instructionsSymbol', 'game']);

	selectSprite = new Sprite(0, 0, sprites.select);
	selectSprite.isActive = false;
	selectSprite.animation.isPlaying = true;
	gme.scenes.addToDisplay(selectSprite, ['instructionsWeb', 'game', 'instructionsSymbol']);

	sun = new Sprite(12.85 * 64, 7 * 64, sprites.sun);
	gme.scenes.addToDisplay(sun, ['instructionsSymbol']);
	moon = new Sprite(13 * 64, 7 * 64, sprites.moon);

	stone = new Sprite(gme.width, -sprites.stone.height, sprites.stone);
	stone.isActive = false;
	stone.animation.isPlaying = true;

	webs = new Sprite(0, 0, sprites.webs_2);
	websAnimator = new Animator(webs.animation, {
		segmentNum: [1, 3],
		jiggleRange: [1, 2],
	});
	websCounter = new Counter(Consts.WEBS_INTERVAL);
	gme.scenes.webs.addToDisplay(webs);
	gme.scenes.webs.needsUpdate = true;

	scoreDisplay = new Texture({ animation: sprites.score });
	gme.scenes.narration.addToDisplay(scoreDisplay);

	levelDisplay = new Texture({ animation: sprites.symbols_small });
	gme.scenes.narration.addToDisplay(levelDisplay);

	// gme.scenes.webs.addToDisplay(new Sprite(0, 0, sprites.webs_1));
	
	const ending = new Sprite(0, 0, sprites.ending);
	ending.animation.play();
	ending.animation.onPlayedOnce = function() {
		ending.animation.onPlayedOnce = undefined;
		ending.animation.state = "still_frame";
		
		gme.scenes.end.addToDisplay(new TextSprite({
			msg: Strings.RESET_BTN,
			x: 64 * 2,
			y: 64 * 5.5,
			letters: sprites.letters_keyboard,
		}));
		
		gme.scenes.end.addToDisplay(new TextSprite({
			msg: Strings.INST_RESTART,
			wrap: 24,
			track: lettersTrack,
			lead: lettersLead,
			x: 64 * 3,
			y: 64 * 5.5,
			letters: sprites.letters,
		}));
	};
	gme.scenes.end.addToDisplay(ending);
}

function startGame(withSound) {
	if (withSound) {
		soundSetup();
	} else {
		sfx = SoundProvider(); // empty sound provider plays nothing
		web.addSFX(sfx); // error w no sfx
		narration.addSFX(sfx);
	}
	if (playedInstructions) {
		chooseInstructions();
	} else {
		sfx.play("level_start", true);
		gme.scenes.current = 'instructionsMovement';
	}
}

function soundSetup() {

	// start doodoo
	doodoo = new Doodoo({
		...themeFile,
		samplesURL: './doodoo/samples/',
		volume: -12,
		autoStart: !debug
	});

	// start sfx
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
		web.addSFX(sfx);
		narration.addSFX(sfx);
	});
}

function instructionsSetup() {
	const { sprites } = gme.anims;
	const instMove = gme.scenes.instructionsMovement;
	const instWeb = gme.scenes.instructionsWeb;
	
	instMove.onXPress = function() {
		if (!arrowsPressed.every(a => a)) return;
		gme.scenes.current = 'instructionsWeb';
		sfx.play('next_button');
		xBtn.setPosition(64 * 0.5, 64 * 0.5);
	};

	// movement instructions
	player.spawn([64 * 10, 64 * 1]);

	instMove.addToDisplay(new TextSprite({
		countForward: true,
		msg: Strings.INST_MOVE_YOU,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 0.5,
		y: 64 * 0.5,
		letters: sprites.letters,
		wrap: 14,
	}));

	instMove.addToDisplay(new TextSprite({
		countForward: true,
		msg: Strings.INST_MOVE_KEYS,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 0.5,
		y: 64 * 1.5,
		letters: sprites.letters,
		wrap: 22,
	}));

	instMove.addToDisplay(new Sprite(64 * 0.5, 64 * 2.5, sprites.keyboard_arrows));

	const xBtn = instMove.addToDisplay(new TextSprite({
		msg: Strings.X_BTN,
		x: 64 * 0.5,
		y: 64 * 5.5,
		letters: sprites.letters_keyboard,
		isActive: false,
	}));
	instWeb.addToDisplay(xBtn);

	const xToContinue = instMove.addToDisplay(new TextSprite({
		msg: Strings.CONTINUE,
		wrap: 24,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 1.5,
		y: 64 * 5.5,
		letters: sprites.letters,
		isActive: false,
	}));

	let arrowsPressed = [false, false, false]; // up, left, right
	const nextInstructionDelay = new Counter(60, () => {
		xToContinue.isActive = true;
		xBtn.isActive = true;
		// xBtn.setPosition(64 * 1, 64 * 1);
	});

	instMove.updateFunc = () => {
		if (player.input['up']) arrowsPressed[0] = true;
		if (player.input['left']) arrowsPressed[1] = true;
		if (player.input['right']) arrowsPressed[2] = true;

		if (arrowsPressed.every(a => a)) {
			nextInstructionDelay.update();
		}
	};

	// instructionsWeb
	const webInstructions = instWeb.addToDisplay(new TextSprite({
		countForward: true,
		msg: Strings.INST_WEB_1,
		wrap: 22,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 1.5,
		y: 64 * 0.5,
		letters: sprites.letters,
	}));

	trees.addLocation(
		Cool.randomInt(2 * 64, 4 * 64), 
		Cool.randomInt(3 * 64, 6 * 64), 
		Cool.randomInt(25)
	);

	trees.addLocation(
		Cool.randomInt(7 * 64, 12 * 64), 
		Cool.randomInt(3 * 64, 6 * 64), 
		Cool.randomInt(25)
	);

	const webInstructionsDelay = new Counter(120, () => {
		setupPractice();
	});
	const connections = [false, false, false];

	instWeb.updateFunc = () => {
		const madeConnection = webUpdate();
		if (madeConnection === 1) {
			if (!connections[0] && !connections[1] && !connections[2]) {
				connections[0] = true;
				webInstructions.setMsg(Strings.INST_WEB_2);
			}
		}

		if (madeConnection === 2) {
			if (connections[0] && !connections[2]) {
				connections[1] = true;
				xBtn.setMsg(Strings.Z_BTN);
				webInstructions.setMsg(Strings.INST_WEB_3);
			}
		}

		if (madeConnection >= 3) {
			if (connections[0] && connections[1]) {
				connections[2] = true;
			}
		}
		
		if (connections.every(c => c)) {
			webInstructionsDelay.update();
		}
	};
}

function chooseInstructions() {
	const { sprites } = gme.anims;
	gme.scenes.current = 'chooseInstructions';
	gme.scenes.chooseInstructions.needsUpdate = true;
	gme.scenes.chooseInstructions.addToDisplay(new TextSprite({
		countForward: true,
		msg: "press z to review instructions, press x to continue",
		wrap: 14,
		track: lettersTrack,
		lead: lettersLead,
		x: 64 * 0.5,
		y: 64 * 2,
		letters: sprites.letters,
	}));

	gme.scenes.chooseInstructions.updateFunc = () => {
		if (player.input.x) startAfterPractice();
		if (player.input.z) gme.scenes.current = 'instructionsMovement';
		player.resetInput();
	};
}

function setupPractice(practiceAttemptCount=0, practiceSymbolPrevious) {
	
	const practiceSymbol = 'd'; // practiceSymbolPrevious ?? Cool.random('abcd'.split(''));

	// what to do after multiple attempts?
	// console.log('practiceSymbol', practiceSymbol)
	narration.addSymbols(practiceSymbol);
	gme.scenes.current = 'narration';
	web.end();
	web.clear();


	if (practiceAttemptCount === 0) {
		narration.add([Strings.INST_WEB_4, Strings.INST_SUN]);	
	}

	if (practiceAttemptCount > 0) {
		narration.add([
			Strings.INST_WEB_5,
			Strings.INST_WEB_6,
			Strings.INST_WEB_7,
		]);
	}

	setupLevel(getNextSymbolString());
	nextLevel = 'instructionsSymbol';

	sunCounter.set(sunInterval);
	sunCounter.reset();
	sunAnimation.reset();

	// set up for instructions symbol
	trees.clear();
	const ground = new Texture({ animation: gme.anims.sprites.tiles_dirt });
	gme.scenes.instructionsSymbol.addToDisplay(ground);
	
	for (let x = 0; x <= 4; x += 1) {
		for (let y = 0; y <= 4; y += 1) {
			if (x === 0 || y === 0 || x === 4 || y === 4) {
				ground.addLocation(64 + x * 64, 64 + y * 64, 21);
				continue;
			}
			trees.addLocation(64 + x * 64, 64 + y * 64, Cool.randomInt(25));
		}
	}

	const symbolSprite = new TextSprite({
		msg: practiceSymbol,
		x: 64 * 10,
		y: 64 * 0.5,
		wrap: 6,
		letters: gme.anims.sprites.symbols_big,
		track: 64,
		lead: 72,
		letterIndexString: things,
	});
	gme.scenes.instructionsSymbol.addToDisplay(symbolSprite);
	player.spawn([64 * 5.5, 64 * 5.5]);

	let gotSymbol = false; // so they can't fuck it up after
	let attemptCount = 0;

	gme.scenes.instructionsSymbol.updateFunc = () => {
		const madeConnection = webUpdate();
		if ((madeConnection === 2 && checkUnfinishedConnection) || madeConnection === 3) {

			const points = structuredClone(web.getPoints());
			if (madeConnection === 2) {
				while (points.slice(-1)[0] !== 'end' && points.length > 0) {
					points.pop();
				}
			}

			const symbolMatches = symbolMatch.getMatch(points, 64, 32);
			const symbolMatches2 = symbolMatch2.getMatch(points, 64, 32);
			// console.log('symbol matches', symbolMatches.flatMap(m => m).map(m => m.symbol), symbolMatches2.flatMap(m => m));

			if (symbolMatches.flatMap(m => m).map(m => m.symbol).includes(practiceSymbol)) gotSymbol = true;
			if (symbolMatches2.flatMap(m => m).includes(practiceSymbol)) gotSymbol = true;


			if (gotSymbol) {
				if (madeConnection === 2) {
					web.cancel();
				}
				sfx.play('match', true, 0.9, 1.1);
				finishSun();
			}

			attemptCount++;
			// console.log(attemptCount);
			if (attemptCount >= 12) {
				setupPractice(practiceAttemptCount + 1, practiceSymbol);
			}
		}
		
		sunCounter.update();
		sunAnimation.update();
		updateSun();

		if (sunCounter.isDone()) {
			if (gotSymbol) {
				setupWebsScene(startAfterPractice);
			} else {
				setupPractice(practiceAttemptCount + 1, practiceSymbol);
			}
		}
	}
}

function startAfterPractice() {
	web.clear();
	trees.clear();
	narration.cancelSymbols();
	localStorage.setItem('spider-instructions-complete', true);

	const nextSymbolString = getNextSymbolString();
	// sfx.play('level_start', true);
	gme.scenes.current = 'narration';
	nextLevel = setupLevel(nextSymbolString);

	narration.addSequence(
		[Strings.EDWARDS_QUOTE_1, Strings.EDWARDS_QUOTE_2],
		() => {
			narration.addSymbols(nextSymbolString);
			narration.add([Strings.INST_DRAW]);
	});
}

function setupWebsScene(callback) {
	web.clear();
	gme.scenes.current = 'webs';
	webs.animation.currentFrame = Cool.randomInt(0, 6);
	websCounter.reset();
	websAnimator.update();
	gme.scenes.webs.updateFunc = function() {
		websCounter.update();
		if (websCounter.isDone()) {
			callback();
		}
	};
}

function getNextSymbolString(len) {
	return Consts.LEVEL_ORDER.charAt(levelCount);

	// old way 
	// len = len ?? Math.min(3, Math.max(1, levelCount - points.rock));
	// let str = '';
	// for (let i = 0; i < len; i++) {
	// 	str += Cool.random('abcdefghijklm'.split(''));
	// }
	// return str;
}

function updateSun() {
	const sunProgress = Math.sin(sunAnimation.getRatio() * Math.PI);
	sun.position[1] = Cool.map(sunProgress, 0, 1, gme.height - 76, 0, true);
}

function finishSun() {
	// console.log(sunCounter, sunAnimation);
	const { count, duration } = sunCounter;
	const ratio = sunCounter.getRatio();
	sunCounter.set(-sunFinish);
	const a = sunFinish * (duration / (duration - count));
	// sunAnimation = new Counter(a);
	sunAnimation.setDuration(a);
	sunAnimation.set(ratio * a);
}

function setupLevel(symbolString) {
	// console.clear(); // debug
	// console.log('symbolString', symbolString);

	// text generator?
	const levelName = 'level-' + levelCount;
	
	// min room size is size of room, 3+ is easiest/guaranteed
	let minNodeRoomSize = symbolString.length > 2 ? 2 : 1;
	// make at least one with 3 for each 3 symbol
	// or something more complex to make sure there are 3x3 grids for each symbol ... 

	// set max nodes based on level -- fewer nodes means bigger rooms
	// max 1x1 nodes 13x7 = 91, use 1/3 ish of that
	// const maxNodes = 16 - levelCount + (points.rock - points.spider);
	const maxNodes = Math.min(24, levelCount + 3 + (points.spider - points.rock));
	// console.log('room', minNodeRoomSize, 'nodes', maxNodes, 16, levelCount, points.rock - points.spider);
	if (levelCount === 0) minNodeRoomSize = 3;
	const groundTexture = Cool.choice('tiles_grass', 'tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');
	const level = new Level(minNodeRoomSize, maxNodes, gme.anims.sprites[groundTexture]);
	// console.log('level', levelName, symbolString);

	let symbolsMatched = [];
	trees.locations = [];
	level.locations.forEach(loc => trees.addLocation(...loc));
	
	trees.animation.layers.forEach(layer => {
		layer.tweens = [];
		layer.segmentNum = 2;
		layer.jiggleRange = 1;
		layer.wiggleRange = 1;
		layer.wiggleSpee = 0.1;
		layer.linesInterval = 5;
		layer.startIndex = 0;
		// endIndex: "end", need to test this
	});

	// no spawn on edge
	player.spawn(Cool.choice(level.walls));
	
	const scene = new Scene();
	scene.needsUpdate = true;
	scene.addSprite([level, player, trees, selectSprite, sun, scoreDisplay]);

	function updateScore() {
		let point = prevMatched === finishString ? 1 : 0;
		// console.log(symbolString, symbolsMatched, point);
		lastPointWinner = point === 1 ? 'spider' : 'rock'; // save who got this point
		points[lastPointWinner]++;
		// score.points.push(point);
		let scoreX = gme.width - 64 * 1.125;
		let scoreY = 64 * 0.125 + (64 * (points.spider + points.rock - 1));
		scoreDisplay.addLocation(scoreX, scoreY,  point);
		levelDisplay.addLocation(scoreX - 64, scoreY, levelCount);
		return lastPointWinner;
	}

	sunCounter.set(sunInterval);
	sunAnimation.set(sunInterval);
	sunCounter.setDuration(sunInterval);
	sunAnimation.setDuration(sunInterval);
	sunCounter.reset();
	sunAnimation.reset();
	
	let prevMatched = '';
	const finishString = symbolString.split('').sort().join('');

	scene.updateFunc = () => {

		const madeConnection = webUpdate();
		if ((madeConnection === 2 && checkUnfinishedConnection) || madeConnection === 3) {

			const points = structuredClone(web.getPoints());
			if (madeConnection === 2) {
				while (points.slice(-1)[0] !== 'end' && points.length > 0) {
					points.pop();
				}
			}
			
			// const matched = [];
			const symbolMatches = symbolMatch.getMatch(points, 64, 32);

			// only adds if the first one didn't get it
			const symbolMatches2 = symbolMatch2.getMatch(points, 64, 32);
			
			let matched = [...symbolMatches];
			const used = [...symbolMatches];
			
			symbolMatches2.forEach(s => {
				if (!matched.includes(s)) {
					matched.push(s);
				} else if (!used.includes(s)) {
					matched.push(s);
				} else {
					used.splice(used.indexOf(s), 1);
				}
			});

			matched = matched.filter(s => finishString.includes(s));

			if (matched.length > prevMatched.length) {
				if (madeConnection === 2) web.cancel();
				sfx.play('match', true, 0.9, 1.1);
			}
			prevMatched = matched.sort().join('');

			if (prevMatched === finishString) {
				// spider got it
				finishSun();
			}
		}

		if (web.isActive() && player.isMoving()) {
			sfx.play('web');
		} else {
			sfx.pause('web');
		}

		sunCounter.update();
		sunAnimation.update();
		updateSun();
		if (sunCounter.isDone()) {
			let whoScored = updateScore();
			if (whoScored === 'spider') {
				setupWebsScene(onRockRolled);
			} else {
				startRockScene(scene);
			}
		}
	};

	gme.scenes.addScene(scene, levelName);
	return levelName;
}

function webUpdate() {

	// cancel web
	if (player.input.z) {
		player.resetInput();
		if (allTrees.length > 1 && continuousWeb) {
			web.popPoint(); // last spider point
			web.end();
			allTrees = [];
			sfx.play('cancel');
			return 3; // made connection 3
		}
		if (web.isActive()) {
			web.cancel();
			return 4;
		}
	}

	let madeConnection = 0; // falsey no connection
	playerOnTreeLoc = trees.update(player); // player colliding with tree

	if (playerOnTreeLoc) {
		selectSprite.position = playerOnTreeLoc;
		selectSprite.isActive = true;

		if (player.input.x) {
			player.resetInput();
			if (!web.isActive()) {
				web.start();
				web.addPoint([playerOnTreeLoc[0] + 32, playerOnTreeLoc[1] + 32]);
				web.addPoint(player.position);
				allTrees.push([...playerOnTreeLoc]);
				
				sfx.play('connect');
				prevTreeLoc = playerOnTreeLoc;
				madeConnection = 1; // truthy 1 connect (started line)
			} else if (prevTreeLoc[0] != playerOnTreeLoc[0] || prevTreeLoc[1] != playerOnTreeLoc[1]) {
				web.insertPoint([playerOnTreeLoc[0] + 32, playerOnTreeLoc[1] + 32]);
				if (!continuousWeb) {
					web.end();
					madeConnection = 3;
				} else {
					web.insertEnd();
					web.insertPoint([playerOnTreeLoc[0] + 32, playerOnTreeLoc[1] + 32]); 
					prevTreeLoc = playerOnTreeLoc;
					allTrees.push([...playerOnTreeLoc]);
					madeConnection = 2; // truthy 2 connect (finished line)
				}
				sfx.play('connect');
			} else {
				sfx.play('cancel');
			}
		}
	} else {
		selectSprite.isActive = false;
	}

	return madeConnection;
}

function startRockScene(scene) {
	
	// unset web scene
	web.end();
	sfx.pause('web');
	selectSprite.isActive = false;

	scene.addToDisplay(stone);

	// rock starts animating
	const dir = Cool.choice(-1, 1);
	stone.position[0] = dir === 1 ? -stone.halfWidth : gme.width;
	stone.position[1] = -stone.halfHeight;
	stone.isActive = true;

	sfx.play('stone');
	sfx.play('rock');

	player.isActive = false;

	scene.updateFunc = () => {
		stone.position[0] += Cool.random(2, 1) * dir;
		stone.position[1] += Cool.random(-1, 2);

		sfx.loop('stone');
		sfx.loop('rock');

		if ((dir === -1 && stone.position[0] < -stone.width) || 
			dir === 1 && stone.position[0] > gme.width) {
			stone.isActive = false;
			stone.displayFunc = undefined;
			player.isActive = true;
			onRockRolled();
		}

		const shake = [
			Cool.randomInt(-shakeAmount, shakeAmount), 
			Cool.randomInt(-shakeAmount, shakeAmount)
		];
		trees.shake(shake);
		// player.shake(shake);
	};

	// trees and web start freaking out
	let animator = new Animator(trees.animation, {
		jiggleRange: [1, 1],
		segmentNum: [2, 3],
	});
	
	animator.update();
	
	trees.animation.onDraw = () => {
		
	};

	web.startOverride();
}

function onRockRolled() {
	trees.animation.cancelOverride();
	trees.animation.update(); // trees still on override ... 
	trees.animation.onDraw = undefined;
	web.clear();
	web.cancelOverride();
	narration.cancelSymbols();
	scoreDisplay.isActive = true;
	levelDisplay.isActive = true;

	let nextNarration = narrative[lastPointWinner][levelCount];
	levelCount++;
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
	sfx.play('level_start', true);
	gme.scenes.current = 'narration';
		
	return;
		
	// old crap 
	// let intro = `The ${lastPointWinner === 'spider' ? 'tale' : 'story'} of the ${lastPointWinner}`;
	if (!nextNarration) {
		// end of game/round
		// const winner = score.points.filter(p => p === 1).length > score.points.filter(p => p === 0).length ? 'spider' : 'rock';
		const winner = points.spider > points.rock ? 'a' : 'b';
		nextNarration = narrative.end[lastPointWinner][winner];
		nextLevel = 'end';
		narration.cancelSymbols();
	} else {
		// nextLevel = setupLevel(nextSymbolString);
		nextLevel = setupWalkLevel(nextSymbolString);
	}
	
	narration.add([intro, nextNarration]);
	gme.scenes.current = 'narration';
	sfx.play('level_start', true);
}

function setupWalkLevel(symbolString) {
	// console.clear(); // debug
	const { levels } = gme.data.data.level_bounds;
	const levelIndex = levelCount < levels.length ? levelCount : Cool.randomInt(0, levels.length - 1);
	const levelData = levels[levelIndex];
	const levelName = 'walk-' + levelCount;

	const scene = new Scene();
	scene.needsUpdate = true;
	const bg = new Sprite(0, 0, gme.anims.sprites.levels);
	bg.animation.frame = levelIndex;
	scene.addToDisplay(bg);
	scene.addSprite(player);
	scene.addToDisplay(moon);
	// scene.addToDisplay(score);

	const groundTexture = Cool.choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');
	const ground = new Texture({ animation: gme.anims.sprites[groundTexture] });
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
			const f = Cool.tileMap.indexOf(n);
			ground.addLocation(x * 64, y * 64, f);
		}
	}

	let moonAnim = new Counter(moonInterval);

	const end = levelData.end;
	// const ender = new ColliderEmpty(end[0] * 64, end[1] * 64, 64, 64);

	const ender = new ColliderSprite(end[0] * 64, end[1] * 64, gme.anims.sprites.end_web);
	scene.add(ender);

	scene.updateFunc = () => {
		for (let i = 0; i < colliders.length; i++) {
			if (player.collide(colliders[i])) player.back();
			// colliders[i].drawDebug();
		}
		// ender.drawDebug();
		
		if (player.collide(ender)) {
			sfx.play('level_start', true);
			gme.scenes.current = setupLevel(symbolString);
		}

		moonAnim.update();
		moon.position[1] = Cool.map(Math.sin(moonAnim.getRatio() * Math.PI), 0, 1, gme.height - 64, 0, true);
	};

	player.spawn([levelData.start[0] * 64 + 32, levelData.start[1] * 64 + 32]);
	gme.scenes.addScene(scene, levelName);
	return levelName;
}

function onNarrationFinished() {
	sfx.play('level_start', true);
	gme.scenes.current = nextLevel;
}

function resetGame() {
	levelCount = 0;
	gme.scenes.current = "splash";
	lastPointWinner = undefined;
	nextLevel = undefined;
	if (doodoo) {
		doodoo.stop();
		doodoo.play();
	}
}

gme.start = function() {
	document.getElementById('splash').remove();
	clearInterval(loadingInterval);

	symbolMatch = SymbolMatch(gme.data.data.shape_profiles);
	symbolMatch2 = SymbolMatch2(gme.data.data.shape_profiles_2);

	gme.setBounds('left', 0);
	gme.setBounds('top', 0);
	gme.setBounds('right', 13 * cellSize.w);
	gme.setBounds('bottom', 7 * cellSize.h);
	
	player = new Spider(gme.halfWidth + 64 * 3, gme.halfHeight, {
		up_left: 'up_left', 
		up_right: 'up_right', 
		down_left: 'down_left', 
		down_right: 'down_right',
	}, gme.bounds);
	// player.debug = true;
	player.setAnimation(gme.anims.sprites.spider);
	gme.scenes.add(player, ['instructionsMovement', 'instructionsWeb', 'instructionsSymbol', 'instructionsSymbol', 'game']);
	gme.scenes.instructionsMovement.needsUpdate = true;
	gme.scenes.instructionsWeb.needsUpdate = true;
	gme.scenes.instructionsSymbol.needsUpdate = true;
	gme.scenes.game.needsUpdate = true;
	
	spritesSetup();
	splashSetup();
	instructionsSetup();
	
	narration = Narration(gme, onNarrationFinished);
	gme.scenes.narration.addToDisplay(narration);
	
	gme.scenes.current = debug ? 'debug' : 'splash';

	if (debug) {
		gme.scenes.debug.add(new TextSprite({
			msg: "x to start debug",
			x: 64,
			y: 64,
			letters: gme.anims.sprites.letters,
			letterIndexString: things,
		}));
	}
};

gme.update = function(timeElapsed) {
	if (gme.scenes.current.needsUpdate) {
		player.update(timeElapsed, true);
		if (gme.scenes.current.updateFunc) gme.scenes.current.updateFunc();
	}
};

gme.draw = function() {
	gme.scenes.current.display();
	if (gme.scenes.current.needsUpdate) web.display();
};

gme.keyDown = function(key) {
	switch (key) {
		case 'left':
			player.inputKey('left', true);
		break;
		case 'up':
			player.inputKey('up', true);
		break;
		case 'right':
			player.inputKey('right', true);
		break;
		case 'down':
			player.inputKey('down', true);
		break;
		case 'x':
			if (gme.scenes.isCurrent('debug')) {
				return debugStart();
			}

			// suspend player movement ?
			if (gme.scenes.isCurrent('splash')) {
				return startGame(true);
			} else if (gme.scenes.isCurrent('instructionsMovement')) {
				// gotta be a better way to do this ... 
				gme.scenes.instructionsMovement.onXPress();
				return;
			}

			player.inputKey('x', true);

		break;

		case 'z':
			// suspend player movement ?
			if (gme.scenes.isCurrent('splash')) {
				return startGame(false);
			}
			player.inputKey('z', true);
		break;

		case 'c':
		case 'v':
		case 'b':
		case 'n':
		case 'm':
			player.inputKey(key, true);
		break;
	}
};

gme.keyUp = function(key) {
	switch (key) {
		case 'left':
			player.inputKey('left', false);
			break;
		case 'up':
			player.inputKey('up', false);
			break;
		case 'right':
			player.inputKey('right', false);
			break;
		case 'down':
			player.inputKey('down', false);
			break;

		case Strings.RESET_BTN:
			if (gme.scenes.isCurrent('end')) {
				sfx.play('next_button');
				resetGame();
			}
			break;

		case 'x':
			if (gme.scenes.isCurrent('narration')) {
				narration.next();
				player.resetInput();
				return;
			}
			player.inputKey('x', false);
			break;

		case 'z':
			player.inputKey('z', false);
			break;

		case 'c':
		case 'v':
		case 'b':
		case 'n':
		case 'm':
			player.inputKey(key, false);
		break;
	}
};