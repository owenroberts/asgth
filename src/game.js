// loading animation pre lines render
const title = document.getElementById('title');
function loadingAnimation() {
	let t = '~' + title.textContent + '~';
	title.textContent = t;
}
let loadingInterval = setInterval(loadingAnimation, 1000 / 12);

const isMobile = Cool.mobilecheck();
if (isMobile) document.body.classList.add('mobile');

const playedInstructions = localStorage.getItem('spider-instructions-complete');

const { Game, GameAnim, Scene, Sprite, SpriteCollection, ColliderSprite, ColliderEntity, TextSprite, Texture, UI, Counter, SoundProvider, ColliderEmpty } = LinesEngine;
const { Drawing, Layer } = Lines;

/* this is the game part */
const scenes = ['game', 'splash', 'loading', 'narration', 'instructionsMovement', 'instructionsWeb', 'instructionsSymbol', 'webs', 'end', 'chooseInstructions'];
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
	stats: true,
	suspend: true,
	events: isMobile ? ['touch'] : ['keyboard', 'mouse'],
	scenes: scenes,
	// testPerformance: true,
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
		shape_profiles: './public/data/shape_profiles.json',
		shape_profiles_2: './public/data/shape_profiles_2.json',
		level_bounds: './public/data/level_bounds.json'
	}
}, false);

let lettersTrack = 24, lettersLead = 56;
let player;
let sun, moon, silk, selectSprite, stone, score;
let points = { rock: 0, spider: 0 };
let lastPoint;
let sunInterval = 1280 * 3, moonInterval = 1280;
let sunFinish = 400;
let shakeAmount = 2;
let web = Web();
let symbolMatch, symbolMatch2;
let trees;
let treeLoc, prevTreeLoc = [], allTrees = [];
let narration; // handles text scenes
let doodoo, sfx;

const edwardsQuote = [
	'... and all your righteousness, would have no more influence to uphold you, and keep you out of hell ...',
	"... than a spider's web would have to stop a falling rock."
];

const narrative = {
	spider: [
		"When I was a young spider, I overheard a two-legged telling a story about a rock.",
		"The two-legged believed an invisible power was contained in or guided by the rock.",
		"They rolled the rock to judge the lives of other two-leggeds.",
		"Among spiders, we considered the two-leggeds irrational, primitive creatures.",
		"Spiders had long ceased believing in invisible forces.",
		"In spider stories, the fates had been replaced by the whims of nature, and destinies with the hopes, flaws and disappointments of animals.",
		"As a naive, young spider, I thought I could communicate with the two-legged.",
		"I hoped to free them of their brutal reliance on the cold, smooth rock.",
		"I studied the marks they made on rocks and leaves.",
		"I spun into my webs messages about the hazards of believing in stories.",
		"They interpreted my messages as an epistle from Satan, and rolled their rock across them.",
		"What could I write that would make the two-legged pause to read?",
	],
	rock: [
		"For thousands of years I was just a part of the vast earth.",
		"Over thousands of years more, I was separated and smoothed by water.",
		"For thousands of years more, I sat motionless while plants grew around me.",
		"The slow vibrations of the plants were joined by fast vibrations of moving creatures filled with liquid blood.",
		"Then one day, a two-legged creature lifted me into the air.",
		"I felt the smooth, hairless skin of the two-legged creature twisting me around in the air.",
		"Then I was rolled across a patch of dirt. A long time later, I was rolled again.",
		"With each roll, the earth was flattened under my weight.",
		"At the end of each roll, I was covered in dirt, sticks, leaves and blood.",
		"I felt vibrations in the air that pierced like screams.",
		"Over time, the wind blew away all the fragments until my surface was smooth again.",
		"I had provided an answer to those animals with the strength to lift me.",
		"Whatever I crushed beneath doesn't begin to scar my surface, only after thousands of rolls might a stick make a scratch, or blood a stain.",
	],
	end: {
		spider: {
			a: "I wrote, look up, and they dropped the rock on their head.", // spider win
			b: "I can only continue trying new messages until one day they might pause.", // spider lose
		},
		rock: {
			a: "After the day I felt the two-legged creature's bones snap on my surface, the rolling ended.", // spider win
			b: "Whatever I crushed beneath doesn't begin to scar my surface, only after thousands of rolls might a stick make a scratch, or blood a stain.", // spider lose
		}
	}
}

let levelCount = 0; // counts levels, also used to advance narrative
let nextLevel; // save value of next level following dialog

function splashSetup() {
	const { sprites } = gme.anims;
	const title = new TextSprite({
		center: true,
		countForward: true,
		msg: "all spiders go to hell",
		wrap: 20,
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
	if (withSound) {
		setupSound();
	} else {
		sfx = SoundProvider(); // empty sound provider plays nothing
		web.addSFX(sfx); // error w no sfx
		narration.addSFX(sfx);
	}
	if (playedInstructions) {
		chooseInstructions();
	} else {
		gme.scenes.current = 'instructionsMovement';
	}
}

function setupSound() {
	// start doodoo
	fetch('./doodoo/compositions/inf3_theme.json')
		.then(res => res.json())
		.then(json => {
			doodoo = new Doodoo({
				...json,
				samplesURL: './doodoo/samples/',
				volume: -12,
				// autoStart: false
			});
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
		]
	}, soundFiles => {
		web.addSFX(sfx);
		narration.addSFX(sfx);
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

	const xToContinue = gme.scenes.instructionsMovement.addToDisplay(new TextSprite({
		msg: "x to continue",
		wrap: 24,
		track: lettersTrack,
		lead: lettersLead,
		x: 32,
		y: 64 * 5,
		letters: sprites.letters,
	}));
	xToContinue.isActive = false;

	let arrowsPressed = { up: false, left: false, right: false };
	const nextInstructionDelay = new Counter(120, () => {
		xToContinue.isActive = true;
		gme.scenes.instructionsMovement.xReady = true;
	});

	gme.scenes.instructionsMovement.updateFunc = () => {
		let allArrowsPressed = true;
		for (const dir in arrowsPressed) {
			if (player.input[dir]) arrowsPressed[dir] = true;
			if (!arrowsPressed[dir]) allArrowsPressed = false;
		}
		if (allArrowsPressed) nextInstructionDelay.update();
	};


	// instructionsWeb
	gme.scenes.instructionsWeb.addToDisplay(new TextSprite({
		countForward: true,
		msg: "press x over a tree to connect a web, press z to cancel",
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
		if (xPressCounter.isDone()) webInstructionsDelay.update();
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
		x: 32,
		y: 64 * 2,
		letters: sprites.letters,
	}));

	gme.scenes.chooseInstructions.updateFunc = () => {
		if (player.input.x) startAfterPractice();
		if (player.input.z) gme.scenes.current = 'instructionsMovement';
		player.resetInput();
	};
}

function startAfterPractice() {
	// play quick web scene and then load first level
	gme.scenes.current = 'webs';
	const webSprite = random(gme.scenes.webs.displaySprites.sprites);
	// console.log(webSprite);
	webSprite.animation.currentFrame = 0;
	webSprite.animation.play();
	webSprite.animation.onPlayedOnce = () => {
		web.clear();
		trees.clear();
		narration.cancelSymbols();
		const nextSymbolString = getNextSymbolString();
		narration.addSymbols(nextSymbolString);
		narration.add(["The premise", edwardsQuote[0], edwardsQuote[1]]);
		gme.scenes.current = 'narration';
		nextLevel = setupLevel(nextSymbolString);
		localStorage.setItem('spider-instructions-complete', true);
	};
}

function setupPractice(practiceAttemptCount=0, practiceSymbolPrevious) {
	const practiceSymbol = practiceSymbolPrevious ?? random('abcdefghijklm'.split(''));
	if (practiceAttemptCount === 0) {
		narration.add([
			'practice drawing the symbol with your web',
			// 'press z to cancel a web'
		]);	
	}
	if (practiceAttemptCount > 0) {
		narration.add([
			'try again to recreate the symbol',
			'create lines by connecting trees', 
			'you can connect more than one line to a tree'
		]);
	}
	// what to do after multiple attempts?
	// console.log('practiceSymbol', practiceSymbol)
	narration.addSymbols(practiceSymbol);
	gme.scenes.current = 'narration';
	web.clear();
	setupLevel(getNextSymbolString(2));
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
	let gotSymbol = false; // so they can't fuck it up after
	let attemptCount = 0;
	const finishDelay = new Counter(120, () => {
		startAfterPractice();
	});

	sym.updateFunc = () => {
		const madeConnection = webUpdate();
		if (madeConnection === 2) {
			const symbolMatches = symbolMatch.getMatch(web.getPoints(), 64, 32);
			const symbolMatches2 = symbolMatch2.getMatch(web.getPoints(), 64, 32);
			// console.log('symbol matches', symbolMatches.flatMap(m => m).map(m => m.symbol), symbolMatches2.flatMap(m => m));

			if (symbolMatches.flatMap(m => m).map(m => m.symbol).includes(practiceSymbol)) gotSymbol = true;
			if (symbolMatches2.flatMap(m => m).includes(practiceSymbol)) gotSymbol = true;

			if (gotSymbol) {
				sfx.play('match', true, 0.9, 1.1);
			}

			attemptCount++;
			// console.log(attemptCount);
			if (attemptCount >= 12) {
				setupPractice(practiceAttemptCount + 1, practiceSymbol);
			}
		}
		// console.log(gotSymbol, finishDelay.isDone(), finishDelay.ratio())
		if (gotSymbol) {
			finishDelay.update();
		}
	}
}

function getNextSymbolString(len) {
	// console.log(levelCount, points);
	len = len ?? Math.min(3, Math.max(1, levelCount - points.rock));
	let str = '';
	for (let i = 0; i < len; i++) {
		str += random('abcdefghijklm'.split(''));
	}
	return str;
}

function setupLevel(symbolString) {
	// console.clear(); // debug
	// console.log('symbolString', symbolString);

	// text generator?
	const levelName = 'level-' + levelCount;
	
	// random ground texture
	const groundTexture = choice('tiles_grass', 'tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');

	// min room size is size of room, 3+ is easiest/guaranteed
	let minNodeRoomSize = symbolString.length > 2 ? 2 : 1; 

	// set max nodes based on level -- fewer nodes means bigger rooms
	// max 1x1 nodes 13x7 = 91, use 1/3 ish of that
	// const maxNodes = 16 - levelCount + (points.rock - points.spider);
	const maxNodes = Math.min(24, levelCount + 3 + (points.spider - points.rock));
	// console.log('room', minNodeRoomSize, 'nodes', maxNodes, 16, levelCount, points.rock - points.spider);
	if (levelCount === 0) minNodeRoomSize = 3;
	const level = new Level(minNodeRoomSize, maxNodes, gme.anims.sprites[groundTexture]);
	// console.log('level', levelName, symbolString);


	let symbolsMatched = [];
	trees.locations = [];
	level.locations.forEach(loc => trees.addLocation(...loc));
	player.spawn(choice(level.walls));
	silk.animation.overrideProperty('endIndex', silk.length);
	
	const scene = new Scene();
	scene.needsUpdate = true;
	scene.addSprite([level, player, trees, selectSprite, sun, silk, score]);

	function updateScore() {
		let point = prevMatched === finishString ? 1 : 0;
		// console.log(symbolString, symbolsMatched, point);
		lastPoint = point === 1 ? 'spider' : 'rock';
		points[lastPoint]++;
		// score.points.push(point);
		score.addLocation((64 * (points.spider + points.rock - 1)), gme.height - 64, point);
	}

	const sunCounter = new Counter(sunInterval, () => {
		updateScore();
		startRockScene(scene);
	});
	let sunAnimation = new Counter(sunInterval);
	
	let prevMatched = '';
	const finishString = symbolString.split('').sort().join('');

	scene.updateFunc = () => {

		const madeConnection = webUpdate();
		if (madeConnection === 2) {
			// const matched = [];
			const symbolMatches = symbolMatch.getMatch(web.getPoints(), 64, 32);

			// only adds if the first one didn't get it
			const symbolMatches2 = symbolMatch2.getMatch(web.getPoints(), 64, 32);
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
				sfx.play('match', true, 0.9, 1.1);
			}
			prevMatched = matched.sort().join('');

			if (prevMatched === finishString) {
				// spider got it
				const { count, duration } = sunCounter;
				const ratio = sunCounter.getRatio();
				sunCounter.set(-sunFinish);
				const a = sunFinish * (duration / (duration - count));
				sunAnimation = new Counter(a);
				sunAnimation.set(ratio * a);
			}

		}

		if (web.isActive() && player.isMoving()) {
			silk.animation.override.endIndex -= 1;
			if (silk.animation.override.endIndex <= 0) {
				silk.animation.override.endIndex = 0;
				updateScore();
				startRockScene();
			}
			sfx.play('web');
		} else {
			sfx.pause('web');
		}

		sunCounter.update();
		sunAnimation.update();
		sun.position[1] = map(Math.sin(sunAnimation.getRatio() * Math.PI), 0, 1, gme.height - 64, 0, true);
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

	let madeConnection = 0; // falsey no connection
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
				// web.playSFX('connect');
				if (sfx) sfx.play('connect');
				prevTreeLoc = treeLoc;
				madeConnection = 1; // truthy 1 connect (started line)
			} else if (prevTreeLoc[0] != treeLoc[0] || prevTreeLoc[1] != treeLoc[1]) {
				web.insertPoint([treeLoc[0] + 32, treeLoc[1] + 32]);
				web.end();
				// web.playSFX('connect');
				if (sfx) sfx.play('connect');
				allTrees.push([...treeLoc]);
				madeConnection = 2; // truthy 2 connect (finished line)
			} else {
				// web.playSFX('cancel');
				if (sfx) sfx.play('cancel');
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
	const dir = choice(-1, 1);
	stone.position[0] = dir === 1 ? -stone.halfWidth : gme.width;
	stone.position[1] = -stone.halfHeight;
	stone.isActive = true;

	sfx.play('stone');
	sfx.play('rock');

	scene.updateFunc = () => {
		stone.position[0] += random(2, 1) * dir;
		stone.position[1] += random(-1, 2);

		sfx.keepPlaying('stone');
		sfx.keepPlaying('rock');

		if ((dir === -1 && stone.position[0] < -stone.width) || 
			dir === 1 && stone.position[0] > gme.width) {
			stone.isActive = false;
			stone.displayFunc = undefined;
			onRockRolled();
		}

		const shake = [randomInt(-shakeAmount, shakeAmount), randomInt(-shakeAmount, shakeAmount)];
		trees.shake(shake);
		player.shake(shake);
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

	// gme.scenes.addScene(scene, sceneName);
	// gme.scenes.current = sceneName;
}

function onRockRolled() {
	trees.animation.cancelOverride();
	trees.animation.update(); // trees still on override ... 
	trees.animation.onDraw = undefined;
	web.clear();
	web.cancelOverride();
	
	const nextSymbolString = getNextSymbolString();
	narration.addSymbols(nextSymbolString);
	// const lastPoint = score.points.slice(-1)[0] === 0 ? 'rock' : 'spider';
	let nextNarration = narrative[lastPoint][levelCount];
	// let intro = 'The tale of the ' + lastPoint;
	let intro = `the ${lastPoint === 'spider' ? 'tale' : 'story'} of the ${lastPoint}`;

	
	if (!nextNarration) {
		// end of game/round
		// const winner = score.points.filter(p => p === 1).length > score.points.filter(p => p === 0).length ? 'spider' : 'rock';
		const winner = points.spider > points.rock ? 'a' : 'b';
		nextNarration = narrative.end[lastPoint][winner];
		nextLevel = 'end';
		narration.cancelSymbols();
	} else {
		// nextLevel = setupLevel(nextSymbolString);
		nextLevel = setupWalkLevel(nextSymbolString);
	}
	levelCount++;
	narration.add([intro, nextNarration]);
	gme.scenes.current = 'narration';
}

function setupWalkLevel(symbolString) {
	// console.clear(); // debug
	const { levels } = gme.data.data.level_bounds;
	const levelIndex = levelCount < levels.length ? levelCount : randomInt(0, levels.length - 1);
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

	const groundTexture = choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');
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
			const f = tileMap.indexOf(n);
			ground.addLocation(x * 64, y * 64, f);
		}
	}

	let moonAnim = new Counter(moonInterval);

	const end = levelData.end;
	const ender = new ColliderEmpty(end[0] * 64, end[1] * 64, 64, 64);

	scene.updateFunc = () => {
		for (let i = 0; i < colliders.length; i++) {
			if (player.collide(colliders[i])) player.back();
			// colliders[i].drawDebug();
		}
		// ender.drawDebug();
		
		if (player.collide(ender)) {
			gme.scenes.current = setupLevel(symbolString)
		}

		moonAnim.update();
		moon.position[1] = map(Math.sin(moonAnim.getRatio() * Math.PI), 0, 1, gme.height - 64, 0, true);
	};

	player.spawn([levelData.start[0] * 64 + 32, levelData.start[1] * 64 + 32]);
	gme.scenes.addScene(scene, levelName);
	return levelName;
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

gme.start = function() {
	document.getElementById('splash').remove();
	clearInterval(loadingInterval);

	const { sprites } = gme.anims;

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
	gme.scenes.narration.addToDisplay(score);

	gme.scenes.webs.addToDisplay(new Sprite(0, 0, sprites.webs_1));
	const ending = new Sprite(0, 0, sprites.ending, animation => {
		animation.play();
	});
	gme.scenes.end.addToDisplay(ending);

	gme.scenes.current = 'splash';
	// gme.scenes.current = 'debug'; // x to debugStart();
	// console.log('gme', gme);
};

function debugStart() {
	setupSound();
	// const nextSymbolString = getNextSymbolString();
	// narration.addSymbols(nextSymbolString);
	// narration.add([edwardsQuote[0], edwardsQuote[1]]);
	// gme.scenes.current = 'narration';
	// // levelCount = 2;
	// // gme.scenes.current = setupWalkLevel(nextSymbolString);
	// nextLevel = setupLevel(nextSymbolString);
	// gme.scenes.current = setupLevel('a');
	gme.scenes.current = setupWalkLevel('a');
}

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
			} else if (gme.scenes.isCurrent('instructionsMovement') && 
				gme.scenes.instructionsMovement.xReady) {
				gme.scenes.current = 'instructionsWeb';
				sfx.play('next_button');
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

gme.mouseDown = function(x, y) {
	gme.scenes.current.mouseDown(x, y);
};

gme.mouseUp = function(x, y) {
	gme.scenes.current.mouseUp(x, y);
};

gme.mouseMoved = function(x, y) {
	gme.scenes.current.mouseMoved(x, y);
};