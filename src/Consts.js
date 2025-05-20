/**
 * game constants
 * @type {Object}
 */
export const Consts = {
	CELL_SIZE: { W: 64, H: 64 },
	GRID_COLS: 14, /** columns in game layout grid */
	GRID_ROWS: 7,
	BG_COLOR: '#aeaaa6', //'#4a4047',
	
	LEVEL_ORDER: 'abcefglmn', // 'abcefglmn',
	NUM_LEVELS: 7, // 7
	SYMBOL_INDEX_STRING: "abcdefghijklmnopqrstuvwxyz",
	PRACTICE_SYMBOL: 'd',
	
	WEBS_INTERVAL: 180,
	ROCK_SHAKE_AMOUNT: 2,
	SUN_FINISH_COUNT: 400,
	SUN_INTERVAL: 1280 * 3,
	MOON_INTERVAL: 1280,
	ROCK_SPEED: 1.8,
	
	LETTERS_TRACK: 24,
	LETTERS_LEAD: 56,
	TEXT_WRAP: 20,

	SYMBOLS_TRACK: 64,
	SYMBOLS_LEAD: 72,

	WEB_CONNECTIONS: {
		NONE: 0,
		STARTED: 1,
		COMPLETED: 2,
		RELEASED: 3,
		CANCELED: 4,
	}

};