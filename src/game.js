import { Sequencer } from '../cool/cool.js';
import { Doodoo } from '../doodoo/src/Doodoo.js';
import { Game, Sprite, TextSprite, Scene, generateBSPMap } from '../lines/src/Engine.js';

import { Spider } from './components/Spider.js'; // not a scene?

import { Splash } from './scenes/Splash.js';
import { InstMove } from './scenes/InstMove.js';
import { InstChoose } from './scenes/InstChoose.js';
import { InstWeb } from './scenes/InstWeb.js';
import { InstPattern } from './scenes/InstPattern.js';
import { InterWebs } from './scenes/InterWebs.js';
import { RockLevel } from './scenes/RockLevel.js';
import { WalkLevel } from './scenes/WalkLevel.js';
import { Narration } from './scenes/Narration.js';
import { End } from './scenes/End.js';
import { Pattern } from './scenes/Pattern.js';

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
	keyMap: Consts.KEY_MAP,
	// testPerformance: true,
});
gm.load({ animations: { sprites: spritePaths }, }, false);
if (gm.debug) console.log('game', gm);

// props that need to be tracked
gm.props = {
	levelCount: 0,
	points: { ROCK: 0, SPIDER: 0 },
	lastPointWinner: '',
	pattern: [], // sun extra time fix
	isSoundActive: false,
	isInstructionsCompleted: JSON.parse(localStorage.getItem('spider-instructions-complete')),
	isRepeatInstructions: false,
	isSkipInstructions: false,
	isPracticePatternSolved: false,
	isPracticeRestart: false,
	isWalkLevelExited: false,
};

let doodoo;

/* debug */
document.addEventListener('keydown', ev => {
	if (ev.code === 'KeyN' && gm.debug) gm.sq.next();
	if (ev.code === "KeyS" && gm.debug) sfx.play("next_button", { randomRate: true });
});

function soundSetup(withSound) {
	if (withSound) {
		doodoo = new Doodoo({
			...themeFile,
			samplesURL: './doodoo/samples/',
			volume: -12,
			autoStart: false // !debug
		});

		gm.sfx.load(
			[
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
				{ key: 'walk', sequence: [1, 3] },
				{ key: 'continue', url: "continue.wav" },
			],
			() => { 
				gm.sq.next(); 
			}
		);
	} else {
		gm.sq.next(); // afterSetupOrSound();
	}
}

function resetGame() {
	gm.props.levelCount = 0;
	gm.props.pattern = [];
	gm.props.lastPointWinner = "";
	gm.props.isRepeatInstructions = false;
	gm.props.isSkipInstructions = false;
	if (doodoo) {
		doodoo.stop();
		doodoo.play();
	}
	gm.scenes.setCurrent("splash");
}

gm.onSetup = function() {

	gm.player = new Spider(gm);

	gm.bounds.set(
		gm.player.bbox.halfWidth,
		gm.player.bbox.halfHeight,
		((Consts.GRID_COLS - 1) * Consts.CELL_SIZE.W) - gm.player.bbox.width,
		(Consts.GRID_ROWS * Consts.CELL_SIZE.H) - gm.player.bbox.height,
	);
	
	gm.sq = new Sequencer();
	gm.scenes.splash = new Splash(gm);
	gm.scenes.instMove = new InstMove(gm);
	gm.scenes.instChoose = new InstChoose();
	gm.scenes.instWeb = new InstWeb(gm);
	gm.scenes.instPattern = new InstPattern(gm);
	gm.scenes.interWebs = new InterWebs(gm);
	gm.scenes.end = new End(gm);

	gm.scenes.narration = new Narration(gm);
	gm.scenes.narration.onKeyUp["BTN_1"] = function() {
		if (gm.scenes.narration.isDone) {
			gm.sfx.play('next_button', { randomRate: true });
			gm.sq.next();
		} else {
			gm.scenes.narration.next();
		}
		gm.input.reset();
	};
	
	const loadingSprite = gm.scenes.loading.add(new Sprite(gm.window.halfWidth, gm.window.halfHeight, gm.anims.sprites.loading_web));
	loadingSprite.bbox.center();
	loadingSprite.animation.play();

	const patternMaker = createPatternMaker();

	// debug start
	gm.sq.add({ fn: () => {
		if (!gm.debug) return gm.sq.next();
		gm.scenes.debug = new Scene();
		console.log("%c *** debug hit X to start ***", "background: #000; color: #ff0;");
		gm.scenes.debug.onKeyDown['BTN_1'] = function() {
			gm.sq.next();
		};
		gm.scenes.setCurrent("debug");
	}});

	// debug loading
	gm.sq.add({ fn: () => {
		if (!gm.debug) return gm.sq.next();

		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(true);
	}});

	// splash
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		gm.scenes.splash.onKeyDown['BTN_1'] = function() {
			gm.props.isSoundActive = true;
			gm.sq.next();
		};
		gm.scenes.splash.onKeyUp['BTN_2'] = function() {
			gm.props.isSoundActive = false;
			gm.sq.next();
		};
		gm.scenes.setCurrent("splash");
	}});

	// loading
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();

		loadingSprite.animation.frame = 0;
		gm.scenes.setCurrent("loading");
		soundSetup(gm.props.isSoundActive);
	}});

	// choose instructions
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		if (!gm.props.isInstructionsCompleted) return gm.sq.next();

		gm.scenes.instChoose.setup(gm);

		// skip instructions
		gm.scenes.instChoose.onKeyDown["BTN_1"] = function() {
			if (!gm.scenes.instChoose.isDone()) return;
			gm.props.isSkipInstructions = true;
			gm.sq.next();
			gm.input.reset();
		};

		// repeat instructions
		gm.scenes.instChoose.onKeyDown["BTN_2"] = function() {
			gm.props.isRepeatInstructions = true;
			gm.sq.next();
			gm.input.reset();
		};

		gm.scenes.setCurrent("instChoose");
	}});

	// movement instructions
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.isSkipInstructions) return gm.sq.next();

		gm.sfx.play("level_start", { randomRate: true });
		gm.scenes.instMove.setup();
		gm.scenes.instMove.onKeyDown["BTN_1"] = function() {
			if (!gm.scenes.instMove.isNextReady) return;
			gm.sfx.play("next_button");
			gm.sq.next();
		};
		gm.scenes.setCurrent("instMove");
	}});

	// web instructions
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.isSkipInstructions) return gm.sq.next();
		
		gm.scenes.instWeb.setup();
		gm.scenes.setCurrent("instWeb");
	}});

	// pattern practice setup
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.isSkipInstructions) return gm.sq.next();

		gm.scenes.narration.addDialog([Strings.INST_PATTERN_PRACTICE, Strings.INST_SUN]);
		gm.scenes.setCurrent("narration");
	}});

	// pattern practice restart
	gm.sq.add({ label: "practice-pattern-restart", fn: () => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.isSkipInstructions) return gm.sq.next();
		if (!gm.props.isPracticeRestart) return gm.sq.next();

		gm.scenes.narration.addDialog([Strings.INST_PATTERN_RESET]);
		gm.scenes.setCurrent("narration");
	}});

	// show pattern practice
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.isSkipInstructions) return gm.sq.next();

		gm.props.pattern = Consts.PRACTICE_PATTERN;
		gm.scenes.pattern = new Pattern(gm);
		gm.scenes.pattern.onKeyDown["BTN_1"] = function() {
			if (gm.scenes.pattern.isNextReady) {
				gm.sfx.play("next_button", { randomRate: true });
				gm.sq.next();
			}
		};
		gm.scenes.setCurrent('pattern');
	}});

	// solve pattern practice
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		if (gm.props.isSkipInstructions) return gm.sq.next();

		if (gm.props.isPracticeRestart) gm.scenes.instPattern.reset();
		else gm.scenes.instPattern.setup();
		gm.scenes.setCurrent("instPattern");
	}});

	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();
		
		if (!gm.props.isPracticePatternSolved) {
			gm.props.isPracticeRestart = true;
			gm.sq.set("practice-pattern-restart");
		}
		gm.sq.next();	
	}});
	
	// premise, edwards quotations
	gm.sq.add({ fn: () => {
		if (gm.debug) return gm.sq.next();

		localStorage.setItem(Strings.LOCAL_STORAGE, true);
		gm.scenes.narration.addDialog([Strings.EDWARDS_QUOTE_1, Strings.EDWARDS_QUOTE_2]);
		gm.scenes.setCurrent("narration");
	}});

	// start game loop
	
	// drawing instructions
	gm.sq.add({ label: "game-loop-start", fn: () => {
		// if (gm.debug) return gm.sq.next();
		gm.scenes.narration.addDialog([Strings.INST_PATTERN]);
		gm.scenes.setCurrent("narration");
	}});

	// pattern
	gm.sq.add({ fn: () => {
		gm.props.pattern = patternMaker.getPattern(gm.props.levelCount);
		gm.props.patternBounds = patternMaker.getBounds();
		gm.scenes.pattern = new Pattern(gm, gm.sfx);
		gm.scenes.pattern.onKeyDown["BTN_1"] = function() {
			if (gm.scenes.pattern.isNextReady) {
				gm.sfx.play("next_button", { randomRate: true });
				gm.sq.next();
			}
		};
		gm.scenes.setCurrent('pattern');
	}});

	// walk level
	gm.sq.add({ label: "walk-level", fn: () => {
		if (gm.props.levelCount === 0) return gm.sq.next();
		gm.props.isWalkLevelExited = false;
		gm.scenes.walkLevel = new WalkLevel(gm);
		gm.scenes.setCurrent("walkLevel");
	}});

	// repeat walk level
	gm.sq.add({ fn: () => {
		if (gm.props.levelCount === 0) return gm.sq.next();
		if (!gm.props.isWalkLevelExited) gm.sq.set("walk-level");
		gm.sq.next();
	}});

	// rock level
	gm.sq.add({ fn: () => {
		gm.scenes.rockLevel = new RockLevel(gm);
		gm.scenes.setCurrent("rockLevel");
	}});

	// webs or rock rolls based on score
	gm.sq.add({ fn: () => {
		if (gm.props.lastPointWinner === "SPIDER") {
			gm.sfx.play("inter");
			gm.scenes.interWebs.setup();
			gm.scenes.setCurrent("interWebs");
		} else {
			gm.scenes.rockLevel.rockSetup();
		}
	}});

	// score narration
	gm.sq.add({ fn: () => {
		gm.scenes.narration.addDialog(Strings.NARRATIVE[gm.props.lastPointWinner][gm.props.levelCount]);
		gm.scenes.narration.setScore();
		gm.sfx.play('level_start', { randomRate: true });
		gm.props.levelCount++;
		gm.scenes.setCurrent("narration");
	}});

	// end dialog
	gm.sq.add({ fn: () => {
		if (gm.props.levelCount < Consts.NUM_LEVELS) return gm.sq.next();
		const winner = gm.props.points.SPIDER > gm.props.points.ROCK ? "SPIDER" : "ROCK"; 
		gm.scenes.narration.addDialog(Strings.NARRATIVE.END[winner]);
		gm.scenes.setCurrent("narration");
	}});

	// next loop or end
	gm.sq.add({ fn: () => {
		gm.scenes.narration.hideScore();
		if (gm.props.levelCount >= Consts.NUM_LEVELS) {
			gm.scenes.end.onKeyUp["RESET"] = function() {
				gm.sfx.play('next_button');
				resetGame();
			};
			gm.scenes.setCurrent("end");
		} else {
			gm.sq.set("game-loop-start");
			gm.sq.next();
		}
	}});

	gm.sq.next(); // start ... clearer way to do this
};

gm.onUpdate = function(timeElapsed) {
	gm.player.update(timeElapsed, true);
	if (gm.scenes.current.update) {
		gm.scenes.current.update();
	}
};

gm.onDraw = function() {
	gm.scenes.current.display();
};

gm.onKeyDown = function(key) {
	if (gm.scenes.current.onKeyDown[key]) {
		gm.scenes.current.onKeyDown[key]();
		// gm.input.setKey(key, false);
	}
};

gm.onKeyUp = function(key) {
	if (gm.scenes.current.onKeyUp[key]) {
		gm.scenes.current.onKeyUp[key]();
		// gm.input.setKey(key, false);
	}
};