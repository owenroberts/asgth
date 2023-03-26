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
let scenes = ['game', 'splash', 'loading', 'narration', 'instructionsMovement', 'instructionsWeb'];
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
	sprites: './public/data/sprites.json',
}, false);

let lettersTrack = 24, lettersLead = 52;
let narration;
let player;
let sun, moon, silk, selectSprite, stone;
let sunInterval = 120;
let web = Web();
let currentLevel;
let levels = {};
let trees;
let treeLoc, prevTreeLoc = [];
let goal;
let build;
let doodoo, sfx;
// let counters = []; // add counters to scenes? use object?
let counters = {};

const edwardsQuote = [
	'... and all your righteousness, would have no more influence to uphold you, and keep you out of hell ...',
	"... than a spider's web would have to stop a falling rock."
];



function splashSetup() {
	const { sprites } = gme.anims;
	const title = new TextSprite({
		center: true,
		countForward: true,
		msg: "infinite hell 3",
		wrap: 14,
		track: lettersTrack,
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
		player.addSFX(soundFiles);
		narration.addSFX(soundFiles);
		stone.sfx = Object.keys(soundFiles).filter(k => k.includes('stone')).map(f => soundFiles[f]);

	});
}

function instructionsSetup() {
	const { sprites } = gme.anims;
	gme.scenes.instructionsMovement.addToDisplay(new TextSprite({
		countForward: true,
		msg: "you are the spider",
		wrap: 14,
		track: lettersTrack,
		x: 32,
		y: 64 * 2,
		letters: sprites.letters,
	}));

	gme.scenes.instructionsMovement.addToDisplay(new TextSprite({
		countForward: true,
		msg: "move with the arrow keys",
		wrap: 24,
		track: lettersTrack,
		x: 32,
		y: 64 * 4,
		letters: sprites.letters,
	}));

	gme.scenes.instructionsMovement.addToDisplay(new TextSprite({
		countForward: true,
		msg: "x to continue",
		wrap: 24,
		track: lettersTrack,
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
		x: 32,
		y: 32,
		letters: sprites.letters,
	}));

	trees.addLocation(randomInt(2 * 64, 4 * 64), randomInt(3 * 64, 6 * 64), randomInt(25));
	trees.addLocation(randomInt(7 * 64, 12 * 64), randomInt(3 * 64, 6 * 64), randomInt(25));

	counters.xPressCounter = new Counter(2);
	
	counters.webInstructionsDelay = new Counter(180, () => {
		narration.add(edwardsQuote[1]);
		gme.scenes.current = 'narration';
		web.clear();
		setupLevels();
		currentLevel = 'a';
	});
}

function introDialog() {
	const dialogList = [
		`Welcome to hell.  You are in the land of ${spriteMap[levels[0]].plur}.`,
		`You are ${spriteMap[playerLetter].rtcl} ${spriteMap[playerLetter].sprite}, and you died from starvation.  In order to get to heaven you must find the evil ${spriteMap[build.goal].sprite} and change it into  ${spriteMap[goal.changeTo].rtcl} ${spriteMap[goal.changeTo].sprite}.`,
		`Look for ${spriteMap[food].plur}, you can eat them.`,
		`You will digest the ${spriteMap[food].plur} and poop out ${spriteMap[money].plur}.  Lucky for you, ${spriteMap[money].plur} are the primary currency in hell.`,
		`Good fucking luck.`,
	];
	narration.add(dialogList);
	gme.scenes.current = 'narration';
}

function setupLevels() {
	
	// text generator?

	console.log('build levels');
	const level = new Level('a', gme.anims.sprites.trees, randomInt(25));
	trees.locations = [];
	// trees.locations = level.locations;
	level.locations.forEach(loc => trees.addLocation(...loc));
	levels['a'] = level;
	player.spawn(choice(level.walls));
	// gme.scenes.current = 'game';
	const scene = new Scene();
	scene.needsUpdate = true;
	scene.addSprite(level);
	scene.addToDisplay(player);
	scene.addToDisplay(trees);
	scene.addToDisplay(selectSprite);
	scene.addToDisplay(sun);
	scene.addToDisplay(silk);
	scene.addToDisplay(stone);
	scene.sunCounter = new Counter(sunInterval, () => {
		startRock();
	});
	gme.scenes.addScene(scene, 'a');
	// startLevel('a');

	// console.log('level', 'a', level);
}

function startLevel(letter) {
	currentLevel = letter;
	gme.scenes.current = currentLevel;
}

function startRock() {
	console.log('start rock');
	console.log('trees', trees);
	let w = 1, s = 0.1;
	trees.animation.onDraw = () => {
		if (w < 16) {
			w += 0.004;
			s += 0.0004;
			trees.animation.overrideProperty('wiggleRange', w);
			trees.animation.overrideProperty('wiggleSpeed', s);
		}
	}

	stone.position = [gme.width, -stone.halfHeight];
	stone.isActive = true;

	let stoneSFX = choice(stone.sfx);
	stoneSFX.play();

	stone.displayFunc = () => {
		
		stone.position[0] += random(-5, -1);
		stone.position[1] += random(-2, 4);
		
		if (stoneSFX.paused) {
			stoneSFX = choice(stone.sfx);
			stoneSFX.play();
		}

		if (stone.position[0] < -stone.width) {
			console.log('stone over');
			stone.isActive = false;
			stone.displayFunc = undefined;
		}
	};

	// rock sound
	// wiggle texture
	// rock animation
	// cut to narration or something
	// next level
}

function onNarrationFinished() {
	// gme.scenes.current = 'game';
	gme.scenes.current = currentLevel;
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
	setupSound();
	setupLevels();
	gme.scenes.current = 'a';
	startLevel('a');
}

gme.start = function() {
	document.getElementById('splash').remove();
	clearInterval(loadingInterval);

	const { sprites } = gme.anims;

	gme.setBounds('left', 0);
	gme.setBounds('top', 0);
	gme.setBounds('right', 13 * cellSize.w);
	gme.setBounds('bottom', 7 * cellSize.h);
	
	player = new Player(gme.halfWidth + 64 * 3, gme.halfHeight);
	// player.debug = true;
	player.setAnimation(sprites.spider);
	gme.scenes.instructionsMovement.addSprite(player);
	gme.scenes.instructionsMovement.needsUpdate = true;
	gme.scenes.instructionsWeb.addSprite(player);
	gme.scenes.instructionsWeb.needsUpdate = true;
	gme.scenes.game.addSprite(player);
	gme.scenes.game.needsUpdate = true;

	trees = new Trees({ animation: sprites.trees });
	gme.scenes.instructionsWeb.addSprite(trees);
	gme.scenes.game.addSprite(trees);
	// console.log('trees', trees);

	selectSprite = new Sprite(0, 0, sprites.select);
	selectSprite.isActive = false;
	selectSprite.animation.isPlaying = true;
	gme.scenes.addToDisplay(selectSprite, ['instructionsWeb', 'game']);

	splashSetup();
	instructionsSetup();
	narration = Narration(onNarrationFinished);
	gme.scenes.narration.addToDisplay(narration);
	
	sun = new Sprite(13 * 64, 7 * 64, sprites.sun);
	silk = new Sprite(12 * 64, 7 * 64, sprites.silk);
	silk.length = silk.animation.drawings[0].length;
	silk.animation.overrideProperty('endIndex', silk.length);

	stone = new Sprite(gme.width, -sprites.stone.height, sprites.stone);
	stone.isActive = false;
	stone.animation.isPlaying = true;

	// gme.scenes.current = 'splash';
	gme.scenes.current = 'debug';
	

	console.log('gme', gme);
};

gme.update = function(timeElapsed) {
	// scenes vs "game" with maps
	if (gme.scenes.current.needsUpdate) {
		player.update(timeElapsed, true);
		
		treeLoc = trees.update(player);
		if (treeLoc) {
			selectSprite.position = treeLoc;
			selectSprite.isActive = true;

			if (player.input.x) {

				player.resetInput();
				// web update func?
				if (!web.isActive()) {
					web.start();
					web.addPoint([treeLoc[0] + 32, treeLoc[1] + 32]);
					prevTreeLoc = treeLoc;
					web.addPoint(player.position);
					player.playSFX('connect');
				} else if (prevTreeLoc[0] != treeLoc[0] || prevTreeLoc[1] != treeLoc[1]) {
					web.insertPoint([treeLoc[0] + 32, treeLoc[1] + 32]);
					web.end();
					player.playSFX('connect');
				} else {
					player.playSFX('cancel');
				}

				if (gme.scenes.isCurrent('instructionsWeb')) {
					counters.xPressCounter.update();
				}
			}
		} else {
			selectSprite.isActive = false;
		}

		if (web.isActive() && player.isMoving()) {
			silk.animation.override.endIndex -= 1;
			if (silk.animation.override.endIndex <= 0) {
				web.end();
				silk.animation.override.endIndex = 0;
				startRock();
			}
			player.playSFX('web');
		} else {
			player.stopSFX('web');
		}

		if (gme.scenes.isCurrent('instructionsWeb')) {
			if (counters.xPressCounter.isDone()) {
				counters.webInstructionsDelay.update();
			}
		}

		if (gme.scenes.current.sunCounter) {
			const counter = gme.scenes.current.sunCounter;
			const count = counter.update();
			sun.position[1] = map(Math.sin(count / counter.duration * Math.PI), 0, 1, gme.height - 64, 0);
		}
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
				currentLevel = 'instructionsWeb';
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
			if (gme.scenes.isCurrent('narration')) {
				narration.skip();
			}
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