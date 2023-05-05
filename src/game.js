// loading animation pre lines render
const title = document.getElementById('title');
function loadingAnimation() {
	let t = '~' + title.textContent + '~';
	title.textContent = t;
}
let loadingInterval = setInterval(loadingAnimation, 1000 / 12);

const isMobile = Cool.mobilecheck();
if (isMobile) document.body.classList.add('mobile');

const { Game, GameAnim, Scene, Sprite, SpriteCollection, ColliderSprite, ColliderEntity, TextSprite, Texture, UI, Counter, SoundProvider } = LinesEngine;
const { Drawing, Layer } = Lines;

/* this is the game part */
const scenes = ['game', 'splash', 'loading', 'narration', 'instructionsMovement', 'instructionsWeb', 'instructionsSymbol'];
scenes.push('debug');
const gme = new Game({
	dps: 24,
	lineWidth: 1,
	// zoom: isMobile ? 1 : 1.5, --> fuck zoom doesn't work
	width: 64 * 14,
	height: 64 * 8,
	multiColor: true,
	retina: true,
	bgColor: '#aeaaa6', //'#4a4047',
	// debug: true,
	// stats: true,
	suspend: true,
	events: isMobile ? ['touch'] : ['keyboard', 'mouse'],
	scenes: scenes,
	bounds: {
		left: -1024,
		top: 1024,
		right: 1024,
		bottom: 1024,
	}
});

gme.load({
	animations: {
		sprites: './public/data/sprites.json',	
	},
	data: {
		shape_profiles: './public/data/shape_profiles.json'
	}
}, false);

let lettersTrack = 24, lettersLead = 56;
let player;
let sun, moon, silk, selectSprite, stone, score;
let sunInterval = 1280;
let web = Web();
let symbolMatch;
let trees;
let treeLoc, prevTreeLoc = [], allTrees = [];
let narration; // handles text scenes
let doodoo, sfx;
// let counters = []; // add counters to scenes? use object?
let counters = {};

const edwardsQuote = [
	'... and all your righteousness, would have no more influence to uphold you, and keep you out of hell ...',
	"... than a spider's web would have to stop a falling rock."
];

const narrative = [
	'This is the first sentence in the narrative.',
];
let levelCount = 0; // counts levels, also used to advance narrative
let nextLevel; // save value of next level following dialog

function splashSetup() {
	const { sprites } = gme.anims;
	const title = new TextSprite({
		center: true,
		countForward: true,
		msg: "infinite hell 3",
		wrap: 14,
		track: lettersTrack,
		lead: lettersLead,
		x: gme.halfWidth,
		y: gme.halfHeight - 64 * 2,
		letters: sprites.letters,
	});
	gme.scenes.splash.addToDisplay(title);

	const startSound = new TextSprite({
		msg: "x to start with sound",
		countForward: true,
		wrap: 24,
		track: lettersTrack,
		lead: lettersLead,
		x: 32,
		y: gme.halfHeight,
		letters: sprites.letters,
	});
	gme.scenes.splash.addToDisplay(startSound);

	const startSilent = new TextSprite({
		msg: "z to start silent",
		countForward: true,
		wrap: 14,
		track: lettersTrack,
		lead: lettersLead,
		x: 32 * 2,
		y: gme.halfHeight + 64,
		letters: sprites.letters,
	});
	gme.scenes.splash.addToDisplay(startSilent);
}

function startGame(withSound) {
	if (withSound) setupSound();
	gme.scenes.current = 'instructionsMovement';
}

function setupSound() {
	// start doodoo
	fetch('./doodoo/compositions/inf3_theme.json')
		.then(res => res.json())
		.then(json => {
			// doodoo = new Doodoo({
			// 	...json,
			// 	samplesURL: './doodoo/samples/',
			// 	volume: -6,
			// });
		});

	// start sfx
	sfx = SoundProvider({
		audioFiles: [
			{ key: 'zip_lock', url: 'zip_lock.wav', },
			{ key: 'connect', sequence: [1, 6] },
			{ key: 'cancel', url: 'cancel.wav', },
			{ key: 'button', sequence: [1, 3] },
			{ key: 'stone',  sequence: [1, 9] },
		]
	}, soundFiles => {
		web.addSFX(soundFiles);
		narration.addSFX(soundFiles);
		
		// add only stone sfx to sfx prop in stone sprite
		stone.sfx = Object.keys(soundFiles)
			.filter(k => k.includes('stone'))
			.map(f => soundFiles[f]);
	});
}

function instructionsSetup() {
	const { sprites } = gme.anims;

	gme.scenes.instructionsMovement.addToDisplay(new TextSprite({
		countForward: true,
		msg: "you are the spider",
		wrap: 14,
		track: lettersTrack,
		lead: lettersLead,
		x: 32,
		y: 64 * 2,
		letters: sprites.letters,
	}));

	gme.scenes.instructionsMovement.addToDisplay(new TextSprite({
		countForward: true,
		msg: "move with the arrow keys",
		wrap: 24,
		track: lettersTrack,
		lead: lettersLead,
		x: 32,
		y: 64 * 4,
		letters: sprites.letters,
	}));

	gme.scenes.instructionsMovement.addToDisplay(new TextSprite({
		countForward: true,
		msg: "x to continue",
		wrap: 24,
		track: lettersTrack,
		lead: lettersLead,
		x: 32,
		y: 64 * 5,
		letters: sprites.letters,
	}));

	// instructionsWeb
	
	gme.scenes.instructionsWeb.addToDisplay(new TextSprite({
		countForward: true,
		msg: "press x over an object to connect a web",
		wrap: 22,
		track: lettersTrack,
		lead: lettersLead,
		x: 32,
		y: 32,
		letters: sprites.letters,
	}));

	trees.addLocation(randomInt(2 * 64, 4 * 64), randomInt(3 * 64, 6 * 64), randomInt(25));
	trees.addLocation(randomInt(7 * 64, 12 * 64), randomInt(3 * 64, 6 * 64), randomInt(25));

	const xPressCounter = new Counter(2);
	
	
	const webInstructionsDelay = new Counter(180, () => {
	
		setupPractice();
	});

	gme.scenes.instructionsWeb.updateFunc = () => {
		const madeConnection = webUpdate();
		if (madeConnection) xPressCounter.update();
		if (xPressCounter.isDone()) {
			webInstructionsDelay.update();
		}
	};
}

function setupPractice(practiceAttemptCount=0) {
	const practiceSymbol = random('g'.split(''));
	console.log('practiceSymbol', practiceSymbol)
	if (practiceAttemptCount === 0) narration.add('Now practice drawing the symbol with your web.');	
	if (practiceAttemptCount > 0) {
		narration.add('Try again. Try to recrate the symbol on the right using the spider web. Create lines by connecting trees. You can connect more than one line to a tree.');
	}
	narration.addSymbols(practiceSymbol);
	gme.scenes.current = 'narration';
	web.clear();
	setupLevel();
	nextLevel = 'instructionsSymbol';

	// set up for instructions symbol
	trees.clear();
	for (let x = 1 * 64; x < 12 * 64; x += 64) {
		for (let y = 1 * 64; y < 6 * 64; y += 64) {
			if ((x + y) % 128) continue; // every other tree
			trees.addLocation(x, y, randomInt(25));
		}
	}

	const sym = gme.scenes.instructionsSymbol;
	let attemptCount = 0;
	sym.updateFunc = () => {
		const madeConnection = webUpdate();
		if (madeConnection) {
			const symbol = symbolMatch.getMatch(web.getPoints(), 64, 32);
			console.log('symbol', symbol);
			if (symbol) console.log('is match', symbol);
			if (symbol === practiceSymbol) {
				web.clear();
				trees.clear();
				narration.cancelSymbols();
				narration.add(edwardsQuote[1]);
				gme.scenes.current = 'narration';
				nextLevel = 'level-' + levelCount;
				setupLevel();
			}
			if (attemptCount >= 12) {
				setupPractice(practiceAttemptCount + 1);
			}
		}
	}
}

function setupLevel() {
	
	// text generator?
	const levelName = 'level-' + levelCount;
	const level = new Level(levelName, gme.anims.sprites.trees, randomInt(25));
	console.log(levelName, level);
	trees.locations = [];
	level.locations.forEach(loc => trees.addLocation(...loc));
	player.spawn(choice(level.walls));
	
	const scene = new Scene();
	scene.needsUpdate = true;
	scene.addSprite(level);
	scene.addToDisplay(player);
	scene.addToDisplay(trees);
	scene.addToDisplay(selectSprite);
	scene.addToDisplay(sun);
	scene.addToDisplay(silk);
	scene.addToDisplay(score);

	scene.sunCounter = new Counter(sunInterval, () => {
		startRockScene();
	});

	scene.updateFunc = () => {

		const madeConnection = webUpdate();
		if (madeConnection) {
			const symbol = symbolMatch.getMatch(web.getPoints(), 64, 32);
			console.log('symbol', symbol);
			if (symbol) console.log('is match', symbol);
		}

		if (web.isActive() && player.isMoving()) {
			silk.animation.override.endIndex -= 1;
			if (silk.animation.override.endIndex <= 0) {
				silk.animation.override.endIndex = 0;
				startRockScene();
			}
			web.playSFX('web');
		} else {
			web.stopSFX('web');
		}

		const counter = gme.scenes.current.sunCounter;
		const count = counter.update();
		sun.position[1] = map(Math.sin(count / counter.duration * Math.PI), 0, 1, gme.height - 64, 0);
	};

	gme.scenes.addScene(scene, levelName);
	return levelName;
	
}

function webUpdate() {

	// cancel web
	if (player.input.z) {
		player.resetInput();
		if (web.isActive()) {
			web.cancel();
		}
	}

	let madeConnection = false;
	treeLoc = trees.update(player); // player colliding with tree

	if (treeLoc) {
		selectSprite.position = treeLoc;
		selectSprite.isActive = true;

		if (player.input.x) {
			player.resetInput();
			if (!web.isActive()) {
				web.start();
				web.addPoint([treeLoc[0] + 32, treeLoc[1] + 32]);
				web.addPoint(player.position);
				allTrees.push([...treeLoc]);
				web.playSFX('connect');
				prevTreeLoc = treeLoc;
				madeConnection = true;
			} else if (prevTreeLoc[0] != treeLoc[0] || prevTreeLoc[1] != treeLoc[1]) {
				web.insertPoint([treeLoc[0] + 32, treeLoc[1] + 32]);
				web.end();
				web.playSFX('connect');
				allTrees.push([...treeLoc]);
				madeConnection = true;
			} else {
				web.playSFX('cancel');
			}
		}
	} else {
		selectSprite.isActive = false;
	}
	return madeConnection;
}

function startLevel(letter) {
	nextLevel = letter;
	gme.scenes.current = nextLevel;
}

function startRockScene() {
	
	// unset web scene
	web.end();
	web.stopSFX('web');
	selectSprite.isActive = false;

	const sceneName = 'rock-' + levelCount;
	const scene = new Scene();
	scene.needsUpdate = true;
	scene.addToDisplay(player);
	scene.addToDisplay(trees);
	scene.addToDisplay(moon);
	scene.addToDisplay(stone);
	scene.addToDisplay(score);

	// rock starts animating
	stone.position = [gme.width, -stone.halfHeight];
	stone.isActive = true;

	let stoneSFX = choice(stone.sfx);
	if (stoneSFX) stoneSFX.play();

	scene.updateFunc = () => {
		stone.position[0] += random(-2, -1);
		stone.position[1] += random(-1, 2);

		if (stoneSFX) {
			if (stoneSFX.paused) {
				stoneSFX = choice(stone.sfx);
				stoneSFX.play();
			}
		}

		if (stone.position[0] < -stone.width) {
			stone.isActive = false;
			stone.displayFunc = undefined;
			onRockRolled();
		}

		moon.position[1] = map(Math.sin(Math.min(gme.width, (gme.width - stone.position[0])) / gme.width * Math.PI), 0, 1, gme.height - 64, 0);
	};

	// trees and web start freaking out
	let w = 1, s = 0.1;
	trees.animation.onDraw = () => {
		if (w < 32) {
			w += 0.004;
			s += 0.0004;
			trees.animation.overrideProperty('wiggleRange', w);
			trees.animation.overrideProperty('wiggleSpeed', s);
		}
	}
	web.startOverride();

	gme.scenes.addScene(scene, sceneName);
	gme.scenes.current = sceneName;
}

function onRockRolled() {
	trees.animation.cancelOverride();
	trees.animation.onDraw = undefined;
	web.clear();
	web.cancelOverride();

	keepScore();
	
	levelCount++;
	narration.add(narrative[0]);
	gme.scenes.current = 'narration';
	const sceneName = setupLevel();
	nextLevel = sceneName;
}

function keepScore() {
	const point = chance(0.5) ? 0 : 1;
	score.points.push(point);
	score.addLocation((64 * (score.points.length - 1)), gme.height - 64, point);
}

function onNarrationFinished() {
	// gme.scenes.current = 'game';
	gme.scenes.current = nextLevel;
}

/* debugging */
let mapAlpha = 0;
let mapCellSize = 24;
document.addEventListener('keydown', ev => {
	if (ev.code == 'Equal') mapAlpha = Math.min(1, mapAlpha + 0.5);
	else if (ev.code == 'Minus') mapAlpha = Math.max(0, mapAlpha - 0.5);
	// else if (ev.code == 'Enter') ui.message.continue.onClick(); // to move message without mouse
});

function debugStart() {
	setupPractice();
}

gme.start = function() {
	document.getElementById('splash').remove();
	clearInterval(loadingInterval);

	const { sprites } = gme.anims;

	symbolMatch = SymbolMatch(gme.data.data.shape_profiles);

	gme.setBounds('left', 0);
	gme.setBounds('top', 0);
	gme.setBounds('right', 13 * cellSize.w);
	gme.setBounds('bottom', 7 * cellSize.h);
	
	player = new Spider(gme.halfWidth + 64 * 3, gme.halfHeight, {
		up_left: 'up_left', 
		up_right: 'up_right', 
		down_left: 'down_left', 
		down_right: 'down_right',
	});
	// player.debug = true;
	player.setAnimation(sprites.spider);
	gme.scenes.instructionsMovement.addSprite(player);
	gme.scenes.instructionsMovement.needsUpdate = true;
	gme.scenes.instructionsWeb.addSprite(player);
	gme.scenes.instructionsWeb.needsUpdate = true;
	gme.scenes.instructionsSymbol.addSprite(player);
	gme.scenes.instructionsSymbol.needsUpdate = true;
	gme.scenes.game.addSprite(player);
	gme.scenes.game.needsUpdate = true;

	trees = new Trees({ animation: sprites.trees });
	gme.scenes.instructionsWeb.addSprite(trees);
	gme.scenes.instructionsSymbol.addSprite(trees);
	gme.scenes.game.addSprite(trees);
	// console.log('trees', trees);

	selectSprite = new Sprite(0, 0, sprites.select);
	selectSprite.isActive = false;
	selectSprite.animation.isPlaying = true;
	gme.scenes.addToDisplay(selectSprite, ['instructionsWeb', 'game', 'instructionsSymbol']);

	splashSetup();
	instructionsSetup();
	narration = Narration(onNarrationFinished);
	gme.scenes.narration.addToDisplay(narration);
	
	sun = new Sprite(13 * 64, 7 * 64, sprites.sun);
	moon = new Sprite(13 * 64, 7 * 64, sprites.moon);

	silk = new Sprite(12 * 64, 7 * 64, sprites.silk);
	silk.length = silk.animation.drawings[0].length;
	silk.animation.overrideProperty('endIndex', silk.length);

	stone = new Sprite(gme.width, -sprites.stone.height, sprites.stone);
	stone.isActive = false;
	stone.animation.isPlaying = true;

	score = new Texture({ animation: sprites.score });
	score.points = [];
	gme.scenes.narration.addToDisplay(score);

	// gme.scenes.current = 'instructionsWeb';
	// gme.scenes.current = 'debug';
	debugStart();

	console.log('gme', gme);
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
				narration.add(edwardsQuote[0]);
				gme.scenes.current = 'narration';
				nextLevel = 'instructionsWeb';
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

		case 'x':
			if (gme.scenes.isCurrent('narration')) {
				narration.next();
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

gme.mouseDown = function(x, y) {
	gme.scenes.current.mouseDown(x, y);
};

gme.mouseUp = function(x, y) {
	gme.scenes.current.mouseUp(x, y);
};

gme.mouseMoved = function(x, y) {
	gme.scenes.current.mouseMoved(x, y);
};