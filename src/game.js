// loading animation pre lines render
const title = document.getElementById('title');
function loadingAnimation() {
	let t = '~' + title.textContent + '~';
	title.textContent = t;
}
let loadingInterval = setInterval(loadingAnimation, 1000 / 12);

const isMobile = Cool.mobilecheck();
if (isMobile) document.body.classList.add('mobile');

const { Game, GameAnim, Scene, Sprite, SpriteCollection, ColliderSprite, ColliderEntity, TextSprite, Texture, UI } = LinesEngine;
const { Drawing, Layer } = Lines;

/* this is the game part */
let scenes = ['game', 'splash', 'loading', 'narration', 'instructionsMovement', 'instructionsWeb'];
const gme = new Game({
	dps: 24,
	lineWidth: 1,
	// zoom: isMobile ? 1 : 1.5, --> fuck zoom doesn't work
	width: 64 * 13,
	height: 64 * 7,
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
let web = Web();
let currentLevel;
let levels = {};
let trees;
let goal;
let build;
let selectSprite;

/* debugging */
let mapAlpha = 0;
let mapCellSize = 12;
document.addEventListener('keydown', ev => {
	if (ev.code == 'Equal') mapAlpha = Math.min(1, mapAlpha + 0.5);
	else if (ev.code == 'Minus') mapAlpha = Math.max(0, mapAlpha - 0.5);
	// else if (ev.code == 'Enter') ui.message.continue.onClick(); // to move message without mouse
});

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
		msg: "z to start with sound",
		countForward: true,
		wrap: 24,
		track: lettersTrack,
		x: 32,
		y: gme.halfHeight,
		letters: sprites.letters,
	});
	gme.scenes.splash.addToDisplay(startSound);

	const startSilent = new TextSprite({
		msg: "x to start silent",
		countForward: true,
		wrap: 14,
		track: lettersTrack,
		x: 32 * 2,
		y: gme.halfHeight + 64,
		letters: sprites.letters,
	});
	gme.scenes.splash.addToDisplay(startSilent);
}

function startGame(withMusic) {
	if (withMusic) {
		// start doodoo
		// start sfx
	}
	gme.scenes.current = 'instructionsMovement';
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

	trees.addLocation(randomInt(2 * 64, 6 * 64), randomInt(3 * 64, 6 * 64), randomInt(25));
	trees.addLocation(randomInt(5 * 64, 12 * 64), randomInt(3 * 64, 6 * 64), randomInt(25));
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

function setupLevels(build, playerLetter) {
	if (!textGenerator.isReady()) {
		setTimeout(() => { setupLevels(build, playerLetter) }, 100);
		return;
	}
	const { food, goal, npcs, money } = build;
	
	// goal.init(playerLetter);
	// items.forEach(i => i.init(items));
	// npcs.forEach(n => { n.init(items, build.levels); });

	// debug give player a lot of money
	// player.addItem(money, 100);
	player.currencyCount = 100;

	build.levels.forEach(letter => {
		const level = new Level(letter);
		levels[letter] = level;
		level.addFood();

		const scene = new Scene();
		scene.needsUpdate = true;
		scene.addSprite(level);
		scene.addToDisplay(player);
		gme.scenes.addScene(scene, letter);
	});

	npcs.forEach(letter => {
		// let npc = new NPC(0, 0, letter, playerLetter);
		const level = choice(build.levels);
		const npc = levels[level].addNPC(letter);
		npc.prophecies = [
			textGenerator.getText('P'),
			textGenerator.getText('P'),
			textGenerator.getText('P'),
		];
		const scene = new Scene();
		scene.isNPCScene = true;
		scene.addToDisplay(frame);
		const npcSprite = new Sprite(gme.width - 100, 100, spriteMap[letter].sprite);
		scene.addToDisplay(npcSprite);

		const npcDialog = NPCDialog(npc, level, transform);
		scene.addSprite(npcDialog);

		gme.scenes.addScene(scene, letter);
	});

	startLevel(choice(build.levels));
	// console.log('levels', levels)
}

function startLevel(letter) {
	currentLevel = letter;
	player.spawn(levels[letter].map);
	gme.scenes.current = currentLevel;
}

function onNarrationFinished() {
	// gme.scenes.current = 'game';
	gme.scenes.current = currentLevel;
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

	trees = new Trees({ animation: sprites.trees, center: true });
	gme.scenes.instructionsWeb.addSprite(trees);
	console.log('trees', trees);

	selectSprite = new Sprite(0, 0, sprites.select);
	selectSprite.isActive = false;
	selectSprite.animation.isPlaying = true;
	gme.scenes.addToDisplay(selectSprite, ['instructionsWeb', 'game']);

	splashSetup();
	instructionsSetup();
	narration = Narration(onNarrationFinished);
	gme.scenes.narration.addToDisplay(narration);

	gme.scenes.current = 'instructionsWeb';

	console.log('gme', gme);
};

gme.update = function(timeElapsed) {
	// scenes vs "game" with maps
	if (gme.scenes.current.needsUpdate) {
		player.update(timeElapsed, true);

		if (web.isActive()) {
			if (!player.input.right && !player.input.left && !player.input.up && !player.input.up) {
				
			}
		}
		
		const treeLoc = trees.update(player);
		// console.log(treeLoc);
		if (treeLoc) {
			selectSprite.position = treeLoc;
			selectSprite.isActive = true;

			if (player.input.x) {

				player.resetInput();
				if (!web.isActive()) {
					web.start();
					web.addPoint([treeLoc[0] + 32, treeLoc[1] + 32]);
					web.addPoint(player.position);
				} else {
					web.insertPoint([treeLoc[0] + 32, treeLoc[1] + 32]);
					web.end();
				}
			}


		} else {
			selectSprite.isActive = false;
		}
	}
};

gme.draw = function() {
	gme.scenes.current.display();
	web.display();
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
			// suspend player movement ?
			if (gme.scenes.isCurrent('splash')) {
				return startGame(true);
			} else if (gme.scenes.isCurrent('instructionsMovement')) {
				narration.add('... and all your righteousness, would have no more influence to uphold you, and keep you out of hell ...');
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