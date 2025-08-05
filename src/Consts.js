/**
 * game constants
 * @type {Object}
 */
const isDebug = import.meta.env.DEV; // consts isDebug

export const Consts = {
	CELL_SIZE: { W: 64, H: 64, W2: 32, H2: 32, W8: 16, H8: 16 },
	GRID_COLS: 14, /** columns in game layout grid */
	GRID_ROWS: 7,
	BG_COLOR: '#aeaaa6', //'#4a4047',
	
	NUM_LEVELS: isDebug ? 2 : 7,

	SPEED_TIME: 0.01,

	PRACTICE_PATTERN: [
		[[1,1],[2,2]],
		[[1,3],[2,2]],
		[[2,2],[3,1]],
		[[2,2],[3,3]],
	],

	INST_WEB_X1: 11,
	INST_WEB_X2: 8,
	INST_WEB_X3: 7,
	INST_WEB_X4: 7,
	INST_WEB_X5: 10,

	KEY_MAP: {
		"KeyX": "BTN_1",
		"KeyZ": "BTN_2",
		"KeyC":  "BTN_3",
		"KeyV": "BTN_4",
		"KeyR": "RESET",
		"ArrowUp": "UP",
		"ArrowDown": "DOWN",
		"ArrowRight": "RIGHT",
		"ArrowLeft": "LEFT",
	},

	KEY_DISPLAY: {
		"BTN_1": "x",
		"BTN_2": "z",
		"BTN_3": "c",
		"BTN_4": "v",
		"RESET": "r",
	},
	
	PRACTICE_DELAY: 180,
	PATTERN_DELAY: isDebug ? 50 : 300,
	WEBS_INTERVAL: 180,
	ROCK_SHAKE_AMOUNT: 2,
	SUN_FINISH_COUNT: 400,
	SUN_INTERVAL: isDebug ? 300 : 1280,
	MOON_INTERVAL: isDebug ? 300 : 1280,
	ROCK_SPEED: 1.8,
	TRACING_TIMEOUT: 1000,

	TEXT_MARGIN: { W: 0.25, H: 0.25 },
	
	LETTERS_TRACK: 24,
	LETTERS_LEAD: 56,
	TEXT_WRAP: 20,

	SYMBOLS_TRACK: 64,
	SYMBOLS_LEAD: 72,

	WALK_COLLIDER: [16, 16, 32, 32],
	ROCK_COLLIDER: [12, 12, 40, 40], // [8, 8, 48, 48],

	WEB_CONNECTS: {
		NONE: 0,
		STARTED: 1,
		COMPLETED: 2,
		RELEASED: 3,
		CANCELED: 4,
		CLEARED: 5,
	},

};