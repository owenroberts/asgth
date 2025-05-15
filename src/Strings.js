/**
 * all the strings for the game
 * @type {Object}
 */
const Strings = {

	TITLE: "all spiders go to hell",
	
	INST_MOVE_YOU: "you are the spider",
	INST_MOVE_KEYS: "move with the arrow keys",

	INST_WEB_1: "connect your web to a tree",
	INST_WEB_2: "connect the trees",
	INST_WEB_3: "release the web",

	INST_SYMBOL_1: "practice drawing the symbol with your web",
	INST_SYMBOL_2: "try again to recreate the symbol",
	INST_SYMBOL_3: "create lines by connecting trees",
	INST_SYMBOL_4: "you can connect more than one line to a tree",

	INST_SUN: "finish before the sun sets",

	INST_CHOOSE: "press z to review instructions, press x to continue",

	X_BTN: "x", // primary and secondary button?
	Z_BTN: "z",
	RESET_BTN: "r",
	CONTINUE: "continue",

	EDWARDS_QUOTE_1: '"... and all your righteousness, would have no more influence to uphold you, and keep you out of hell ..."',
	EDWARDS_QUOTE_2: '"... than a spider\'s web would have to stop a falling rock."',

	INST_DRAW: "draw the symbol to defeat the rock",
	INST_RESTART: "play again",

	NARRATIVE: {
		SPIDER: [
			// "When I was a young spider, I overheard a bipeedo telling a story about a rock.",
			// "The bipeedo believed an invisible power was contained in or guided by the rock.",
			// "They rolled the rock to judge the lives of other bipeedos.",
			"Spiders have always considered humans to be irrational, primitive creatures.",
			"Spiders had long ceased believing in invisible forces.",
			"In spider stories, the fates were replaced by the whims of nature, and destinies with the hopes, flaws and disappointments of animals.",
			// "As a naive, young spider, I thought I could communicate with the bipeedo.",
			"Spiders feared humans and their brutal reliance on the cold, smooth rock.",
			"I studied the marks they made on rocks and leaves.",
			"I spun into my webs messages about the hazards of believing in stories.",
			"They interpreted my messages as an epistle from Satan, and rolled their rock across them.",
			// "What could I write that would make the bipeedo pause to read?",
		],
		ROCK: [
			"For thousands of years I was just a part of the vast earth.",
			"I was separated and smoothed by water.",
			"I sat motionless while plants grew around me.",
			// "The slow vibrations of the plants were joined by fast vibrations of moving creatures filled with liquid blood.",
			"One day, a creature standing on two legs lifted me into the air.",
			// "I felt the smooth, hairless skin of the two-legged creature twisting me around in the air.",
			"Then I was rolled across a patch of dirt. A long time later, I was rolled again.",
			"With each roll, the earth was flattened under my weight.",
			"At the end of each roll, I was covered in dirt, sticks, leaves and blood.",
			// "I felt vibrations in the air that pierced like screams.",
			"Over time, the wind blew away all the fragments until my surface was smooth again.",
			// "I had provided an answer to those animals with the strength to lift me.",
			// "Whatever I crushed beneath doesn't begin to scar my surface, only after thousands of rolls might a stick make a scratch, or blood a stain.",
		],
		END: {
			SPIDER: {
				A: "I wrote, look up, and they dropped the rock on their head.", // spider win
				B: "I can only continue trying new messages until one day they might pause.", // spider lose
			},
			ROCK: {
				A: "After the day I felt the two-legged creature's bones snap on my surface, the rolling ended.", // spider win
				B: "Whatever I crushed beneath doesn't begin to scar my surface, only after thousands of rolls might a stick make a scratch, or blood a stain.", // spider lose
			}
		}
	},
};

export { Strings };