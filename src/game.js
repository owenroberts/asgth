import { Sequencer } from '../cool/cool.js';
import { Doodoo } from '../doodoo/src/Doodoo.js';
import { Game, Sprite, TextSprite, SoundProvider, Scene } from '../lines/src/Engine.js';

import { Spider } from './components/Spider.js'; // not a scene?

import { Splash } from './scenes/Splash.js';
import { InstMove } from './scenes/InstMove.js';
import { InstChoose } from './scenes/InstChoose.js';
import { InstWeb } from './scenes/InstWeb.js';
import { InstSymbol } from './scenes/InstSymbol.js';
import { InterWebs } from './scenes/InterWebs.js';
import { RockLevel } from './scenes/RockLevel.js';
import { WalkLevel } from './scenes/WalkLevel.js';
import { Narration } from './scenes/Narration.js';
import { End } from './scenes/End.js';

import { Strings } from './Strings.js';
import { Consts } from './Consts.js';

import themeFile from '../doodoo/compositions/inf3_theme_v.json';
import spritePaths from './data/sprites.json';

const gm = new Game({
	debug: true,
	dps: 24,
	lineWidth: 1,
	// zoom: isMobile ? 1 : 1.5, --> fuck zoom doesn't work
	width: Consts.CELL_SIZE.W * Consts.GRID_COLS,
	height: Consts.CELL_SIZE.H * Consts.GRID_ROWS,
	multiColor: true,
	retina: true,
	bgColor: Consts.BG_COLOR,
	stats: true,
	suspend: true,
	events: ['keyboard'],
	scenes: ["loading"],
	// testPerformance: true,
});
gm.load({ animations: { sprites: spritePaths }, }, false);
if (gm.debug) console.log('game', gm);

// props that need to be tracked
gm.props = {
	levelCount: 0,
	points: { ROCK: 0, SPIDER: 0 },
	lastPointWinner: '',
	nextSymbolString: "", // maybe don't need this if not setting up rock thing
	useSound: false,
	hasCompletedInstructions: false, // localStorage.getItem('spider-instructions-complete');
	choseRepeatInstructions: false,
};

let player; // can this be a component ... only if input moves to gm
let doodoo, sfx; // add sfx to gm

/* debug */
document.addEventListener('keydown', ev => {
	if (ev.code === 'KeyN' && gm.debug) gm.seq.next();
});

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
			gm.scenes.narration.addSFX(sfx);
			gm.seq.next(); // afterSetupOrSound();
		});
	} else {
		sfx = SoundProvider(); // empty sound provider plays nothing
		gm.scenes.narration.addSFX(sfx);
		gm.seq.next(); // afterSetupOrSound();
	}
}

function getNextSymbolString(len) {
	return Consts.LEVEL_ORDER.charAt(gm.props.levelCount);
}

function resetGame() {
	gm.props.levelCount = 0;
	gm.scenes.current = "splash";
	lastPointWinner = undefined;
	nextLevel = undefined;
	if (doodoo) {
		doodoo.stop();
		doodoo.play();
	}
}

gm.start = function() {

	gm.setBounds('left', 0);
	gm.setBounds('top', 0);
	gm.setBounds('right', (Consts.GRID_COLS - 1) * Consts.CELL_SIZE.W);
	gm.setBounds('bottom', Consts.GRID_ROWS * Consts.CELL_SIZE.H);
	
	player = Spider(gm);
	gm.seq = Sequencer();
	
	gm.scenes.splash = Splash(gm);
	gm.scenes.inst_move = InstMove(gm, player);
	gm.scenes.inst_choose = InstChoose(gm);
	gm.scenes.inst_web = InstWeb(gm, player);
	gm.scenes.inst_symbol = InstSymbol(gm, player);
	gm.scenes.inter_webs = InterWebs(gm);
	gm.scenes.end = End(gm);

	gm.scenes.narration = Narration(gm);
	gm.scenes.narration.onKeyUp['x'] = function() {
		if (gm.scenes.narration.isDone()) {
			sfx.play('next_button', true);
			gm.seq.next();
		} else {
			gm.scenes.narration.next();
		}
		player.resetInput(); // need this? 
	};
	
	const loadingSprite = gm.scenes.loading.addSprite(new Sprite(gm.halfWidth, gm.halfHeight, gm.anims.sprites.loading_web));
	loadingSprite.center = true;
	loadingSprite.animation.play();

	gm.seq.add(() => { 
		if (!gm.debug) return gm.seq.next();
		gm.scenes.debug = new Scene();
		gm.scenes.debug.add(new TextSprite({
			msg: Strings.DEBUG_START,
			x: Consts.CELL_SIZE.W,
			y: Consts.CELL_SIZE.H,
			letters: gm.anims.sprites.letters,
			letterIndexString: Consts.SYMBOL_INDEX_STRING,
		}));
		gm.scenes.setCurrent("debug");
		gm.scenes.debug.onKeyDown['x'] = () => {
			gm.seq.next();	
		};
	});

	gm.seq.add(() => {
		if (!gm.debug) return gm.seq.next();
		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(true);
	});

	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();

		gm.scenes.splash.setup();
		gm.scenes.splash.onKeyDown['x'] = function() {
			gm.useSound = true;
			gm.seq.next();
		};
		gm.scenes.splash.onKeyUp['z']= function() {
			gm.props.useSound = false;
			gm.seq.next();
		};
		gm.scenes.setCurrent("splash");
	});

	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();
		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(gm.props.useSound);
	});

	// test instructions thing
	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();
		if (!gm.props.hasCompletedInstructions) return gm.seq.next();

		gm.scenes.inst_choose.setup();

		// skip instructions
		gm.scenes.inst_choose.onKeyDown['x'] = () => {
			gm.seq.next();
			player.resetInput();
		};

		// repeat instructions
		gm.scenes.inst_choose.onKeyDown['z'] = () => {
			gm.props.choseRepeatInstructions = true;
			gm.seq.next();
			player.resetInput(); // need this?
		};

		gm.scenes.setCurrent("inst_choose");
	});

	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();
		if (gm.props.hasCompletedInstructions && !gm.props.choseRepeatInstructions) {
			return gm.seq.next();
		}

		sfx.play("level_start", true);
		gm.scenes.inst_move.setup();
		gm.scenes.inst_move.onKeyDown['x'] = function() {
			if (!gm.scenes.inst_move.check()) return;
			sfx.play("next_button");
			gm.seq.next();
		};

		gm.scenes.setCurrent("inst_move");
	});

	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();
		if (gm.props.hasCompletedInstructions && !gm.props.choseRepeatInstructions) {
			return gm.seq.next();
		}
		
		gm.scenes.inst_web.setup(sfx);
		gm.scenes.setCurrent("inst_web");
	});

	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();
		if (gm.props.hasCompletedInstructions && !gm.props.choseRepeatInstructions) {
			return gm.seq.next();
		}
		gm.scenes.narration.addSymbols(Consts.PRACTICE_SYMBOL);
		gm.scenes.narration.add([Strings.INST_WEB_4, Strings.INST_SUN]);
		gm.scenes.setCurrent("narration");
	});

	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();
		if (gm.props.hasCompletedInstructions && !gm.props.choseRepeatInstructions) {
			return gm.seq.next();
		}
		gm.scenes.inst_symbol.setup(sfx);
		gm.scenes.setCurrent("inst_symbol");
	});

	gm.seq.add(() => {
		if (gm.debug) return gm.seq.next();
		localStorage.setItem(Strings.LOCAL_STORAGE, true);
		gm.scenes.narration.add([Strings.EDWARDS_QUOTE_1, Strings.EDWARDS_QUOTE_2]);
		gm.scenes.setCurrent("narration");
	});

	gm.seq.add(() => { gameLoop(); });

	function gameLoop() {

		const levelName = `level-${gm.props.levelCount}`;
		gm.props.nextSymbolString = getNextSymbolString();

		gm.seq.add(() => {
			if (gm.debug) return gm.seq.next();
			gm.scenes.narration.addSymbols(gm.props.nextSymbolString);
			gm.scenes.narration.add([Strings.INST_DRAW]);
			gm.scenes.setCurrent("narration");
		});
		gm.seq.add(() => {
			gm.scenes[levelName] = RockLevel(gm, player, sfx);
			gm.scenes.setCurrent(levelName);
		});

		gm.seq.add(() => {
			if (gm.props.lastPointWinner === "SPIDER") {
				gm.scenes.inter_webs.setup();
				gm.scenes.setCurrent("inter_webs");
			} else {
				gm.scenes[levelName].rock();
			}
		});

		gm.seq.add(() => {
			gm.props.levelCount++;
			gm.scenes.narration.add(Strings.NARRATIVE[gm.props.lastPointWinner][gm.props.levelCount]);
			gm.scenes.narration.setScore();
			sfx.play('level_start', true);
			gm.scenes.setCurrent("narration");
		});

		gm.seq.add(() => {
			if (gm.props.levelCount > Consts.NUM_LEVELS) return gm.seq.next();

			const walkLevelName = 'walk-' + gm.props.levelCount;
			gm.scenes[walkLevelName] = WalkLevel(gm, player);
			gm.scenes.setCurrent(walkLevelName);
		});

		gm.seq.add(() => {
			sfx.play('level_start', true);
			gm.scenes.narration.hideScore();
			if (gm.props.levelCount > Consts.NUM_LEVELS) {
				gm.scenes.end.onKeyUp[Strings.RESET_BTN] = function() {
					sfx.play('next_button');
					resetGame();
				};
				gm.scenes.setCurrent("end");
			} else {
				gameLoop();
			}
		});

		gm.seq.next();
	}

	gm.seq.next();
};

gm.update = function(timeElapsed) {
	player.update(timeElapsed, true);
	gm.scenes.current.update();
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