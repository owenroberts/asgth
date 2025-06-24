import { Sequencer } from '../cool/cool.js';
import { Doodoo } from '../doodoo/src/Doodoo.js';
import { Game, Sprite, TextSprite, SoundProvider, Scene, generateBSPMap } from '../lines/src/Engine.js';

import { Spider } from './components/Spider.js'; // not a scene?

import { splash } from './scenes/splash.js';
import { instMove } from './scenes/instMove.js';
import { instChoose } from './scenes/instChoose.js';
import { instWeb } from './scenes/instWeb.js';
import { instPattern } from './scenes/instPattern.js';
import { interWebs } from './scenes/interWebs.js';
import { rockLevel } from './scenes/rockLevel.js';
import { walkLevel } from './scenes/walkLevel.js';
import { narration } from './scenes/narration.js';
import { end } from './scenes/end.js';
import { pattern } from './scenes/pattern.js';

import { createPatternMaker } from './patternMaker.js';
import { patternMatch } from './patternMatch.js';
import { Strings } from './Strings.js';
import { Consts } from './Consts.js';

import themeFile from '../doodoo/compositions/inf3_theme_v.json';
import spritePaths from './data/sprites.json';

const gm = new Game({
	debug: true,
	drawInterval: 3,
	lineWidth: 1,
	// zoom: isMobile ? 1 : 1.5, --> fuck zoom doesn't work
	width: Consts.CELL_SIZE.W * Consts.GRID_COLS,
	height: Consts.CELL_SIZE.H * Consts.GRID_ROWS,
	multiColor: true,
	retina: true,
	bgColor: Consts.BG_COLOR,
	stats: true,
	suspend: true,
	events: ["keyboard"],
	scenes: ["loading", "walkLevel", "rockLevel"],
	// testPerformance: true,
});
gm.load({ animations: { sprites: spritePaths }, }, false);
if (gm.debug) console.log('game', gm);

// props that need to be tracked
gm.props = {
	levelCount: 0,
	points: { ROCK: 0, SPIDER: 0 },
	lastPointWinner: '',
	useSound: false,
	completedInst: false, // localStorage.getItem('spider-instructions-complete');
	repeatInst: false,
	skipInst: false,
	pattern: [], // sun extra time fix
};

let player; // can this be a component ... only if input moves to gm
let doodoo, sfx; // add sfx to gm

/* debug */
document.addEventListener('keydown', ev => {
	if (ev.code === 'KeyN' && gm.debug && import.meta.env.DEV) gm.sq.next();

	if (ev.code === "KeyS") sfx.play("next_button", true);
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
				{ key: 'skip_button', url: 'button_2.wav' },
				{ key: 'next_button', url: 'button_3.wav' },
				{ key: 'stone',  sequence: [1, 9] },
				{ key: 'rock',  sequence: [1, 9] },
				{ key: 'match', sequence: [1, 7] },
				{ key: 'level_start', sequence: [1, 3] },
				{ key: 'web_clear', sequence: [1, 3] },
				{ key: 'web_clear_web', url: "web_clear_web_fade.wav" },
				{ key: 'vis_on', url: "vis_on.wav" },
				{ key: 'vis_off', url: "vis_off.wav" },
				{ key: 'inter', sequence: [1, 4] },
				{ key: 'continue', url: "continue.wav" },

			]
		}, soundFiles => {
			gm.scenes.narration.addSFX(sfx);
			gm.sq.next(); // afterSetupOrSound();
		});
	} else {
		sfx = SoundProvider(); // empty sound provider plays nothing
		gm.scenes.narration.addSFX(sfx);
		gm.sq.next(); // afterSetupOrSound();
	}
}

function resetGame() {
	gm.props.levelCount = 0;
	gm.props.pattern = [];
	gm.props.lastPointWinner = "";
	gm.props.repeatInst = false;
	gm.props.skipInst = false;
	if (doodoo) {
		doodoo.stop();
		doodoo.play();
	}
	gm.scenes.setCurrent("splash");
}

gm.start = function() {

	gm.setBounds('left', 0);
	gm.setBounds('top', 0);
	gm.setBounds('right', (Consts.GRID_COLS - 1) * Consts.CELL_SIZE.W);
	gm.setBounds('bottom', Consts.GRID_ROWS * Consts.CELL_SIZE.H);
	
	player = Spider(gm);
	gm.sq = Sequencer();
	
	gm.scenes.splash = splash(gm);
	gm.scenes.instMove = instMove(gm, player);
	gm.scenes.instChoose = instChoose(gm);
	gm.scenes.instWeb = instWeb(gm, player);
	gm.scenes.instPattern = instPattern(gm, player);
	gm.scenes.interWebs = interWebs(gm);
	gm.scenes.end = end(gm);

	gm.scenes.narration = narration(gm);
	gm.scenes.narration.onKeyUp.x = function() {
		console.log('next', gm.scenes.narration.isDone())
		if (gm.scenes.narration.isDone()) {
			sfx.play('next_button', true);
			gm.sq.next();
		} else {
			gm.scenes.narration.next();
		}
		player.resetInput(); // need this? 
	};
	
	const loadingSprite = gm.scenes.loading.addSprite(new Sprite(gm.halfWidth, gm.halfHeight, gm.anims.sprites.loading_web));
	loadingSprite.center = true;
	loadingSprite.animation.play();

	const patternMaker = createPatternMaker();

	// debug start
	gm.sq.add(() => { 
		if (!gm.debug) return gm.sq.next();
		gm.scenes.debug = new Scene();
		console.log("%c *** debug hit X to start ***", "background: #000; color: #ff0;");
		gm.scenes.debug.onKeyDown.x = function() {
			gm.sq.next();	
		};
		gm.scenes.setCurrent("debug");
	});

	// debug loading
	gm.sq.add(() => {
		if (!gm.debug) return gm.sq.next();

		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(true);
	});

	// splash
	gm.sq.add(() => {
		if (gm.debug) return gm.sq.next();

		gm.scenes.splash.setup();
		gm.scenes.splash.onKeyDown.x = function() {
			gm.props.useSound = true;
			gm.sq.next();
		};
		gm.scenes.splash.onKeyUp.z = function() {
			gm.props.useSound = false;
			gm.sq.next();
		};
		gm.scenes.setCurrent("splash");
	});

	// loading
	gm.sq.add(() => {
		if (gm.debug) return gm.sq.next();

		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(gm.props.useSound);
	});

	// choose instructions
	gm.sq.add(() => {
		if (gm.debug) return gm.sq.next();
		if (!gm.props.completedInst) return gm.sq.next();

		gm.scenes.instChoose.setup();

		// skip instructions
		gm.scenes.instChoose.onKeyDown.x = function() {
			gm.props.skipInst = true;
			gm.sq.next();
			player.resetInput();
		};

		// repeat instructions
		gm.scenes.instChoose.onKeyDown.z = function() {
			gm.props.repeatInst = true;
			gm.sq.next();
			player.resetInput();
		};

		gm.scenes.setCurrent("instChoose");
	});

	// movement instructions
	gm.sq.add(() => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.skipInst) return gm.sq.next();

		sfx.play("level_start", true);
		gm.scenes.instMove.setup();
		gm.scenes.instMove.onKeyDown.x = function() {
			if (!gm.scenes.instMove.check()) return;
			sfx.play("next_button");
			gm.sq.next();
		};
		gm.scenes.setCurrent("instMove");
	});

	// web instructions
	gm.sq.add(() => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.skipInst) return gm.sq.next();
		
		gm.scenes.instWeb.setup(sfx);
		gm.scenes.setCurrent("instWeb");
	});

	// pattern practice setup
	gm.sq.add(() => {
		// if (gm.debug) return gm.sq.next();
		if (gm.props.skipInst) return gm.sq.next();

		gm.scenes.narration.add([Strings.INST_PATTERN_PRACTICE, Strings.INST_SUN]);
		gm.scenes.setCurrent("narration");
	});

	// show pattern practice
	gm.sq.add(() => {
		// if (gm.debug) return gm.sq.next();
		if (gm.props.skipInst) return gm.sq.next();

		gm.props.pattern = Consts.PRACTICE_PATTERN;
		gm.scenes.pattern = pattern(gm, sfx);
		gm.scenes.pattern.onKeyDown.x = function() {
			if (gm.scenes.pattern.canContinue) {
				sfx.play("next_button", true);
				gm.sq.next();
			}
		};
		gm.scenes.setCurrent('pattern');
	});

	// solve pattern practice
	gm.sq.add(() => {
		// if (gm.debug) return gm.sq.next();
		if (gm.props.skipInst) return gm.sq.next();

		gm.scenes.instPattern.setup(sfx);
		gm.scenes.setCurrent("instPattern");
	});

	// premise, edwards quotations
	gm.sq.add(() => {
		// if (gm.debug) return gm.sq.next();

		localStorage.setItem(Strings.LOCAL_STORAGE, true);
		gm.scenes.narration.add([Strings.EDWARDS_QUOTE_1, Strings.EDWARDS_QUOTE_2]);
		gm.scenes.setCurrent("narration");
	});

	// start game loop
	gm.sq.add(() => { gameLoop(); });

	function gameLoop() {

		// drawing instructions
		gm.sq.add(() => {
			// if (gm.debug) return gm.sq.next();
			gm.scenes.narration.add([Strings.INST_PATTERN]);
			gm.scenes.setCurrent("narration");
		});

		// pattern
		gm.sq.add(() => {
			gm.props.pattern = patternMaker.getPattern(gm.props.levelCount);
			gm.props.patternBounds = patternMaker.getBounds();
			gm.scenes.pattern = pattern(gm, sfx);
			gm.scenes.pattern.onKeyDown.x = function() {
				if (gm.scenes.pattern.canContinue) gm.sq.next();
			};
			gm.scenes.setCurrent('pattern');
		});

		// walk level
		gm.sq.add(() => {
			if (gm.props.levelCount === 0) return gm.sq.next();
			if (gm.props.levelCount > Consts.NUM_LEVELS) {
				return gm.sq.next();
			}
			gm.scenes.walkLevel = walkLevel(gm, player);
			gm.scenes.walkLevel.setup();
			gm.scenes.setCurrent("walkLevel");
		});

		// rock level
		gm.sq.add(() => {
			gm.scenes.rockLevel = rockLevel(gm, player, sfx);
			gm.scenes.rockLevel.setup();
			gm.scenes.setCurrent("rockLevel");
		});

		// webs or rock rolls based on score
		gm.sq.add(() => {
			if (gm.props.lastPointWinner === "SPIDER") {
				sfx.play("inter");
				gm.scenes.interWebs.setup();
				gm.scenes.setCurrent("interWebs");
			} else {
				gm.scenes.rockLevel.rock();
			}
		});

		// score narration
		gm.sq.add(() => {
			gm.props.levelCount++;
			gm.scenes.narration.add(Strings.NARRATIVE[gm.props.lastPointWinner][gm.props.levelCount]);
			gm.scenes.narration.setScore();
			sfx.play('level_start', true);
			gm.scenes.setCurrent("narration");
		});

		// next loop or end
		gm.sq.add(() => {
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

		gm.sq.next();
	}

	gm.sq.next(); // start ... clearer way to do this
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

	case 'c':
		gm
	}
};