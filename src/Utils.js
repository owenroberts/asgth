// const { random, randomInt, choice, chance, shuffle, tileMap, map } = Cool;

const things = 'abcdefghijklmnopqrstuvwxyz';
const cellSize = { w: 64, h: 64 }; // stupid global map thing
const lettersTrack = 24, lettersLead = 56;
const sunFinish = 400;
const shakeAmount = 2;
const sunInterval = 1280 * 3, moonInterval = 1280;

const edwardsQuote = [
	'... and all your righteousness, would have no more influence to uphold you, and keep you out of hell ...',
	"... than a spider's web would have to stop a falling rock."
];

const narrative = {
	spider: [
		"When I was a young spider, I overheard a bipeedo telling a story about a rock.",
		"The bipeedo believed an invisible power was contained in or guided by the rock.",
		"They rolled the rock to judge the lives of other bipeedos.",
		"Among spiders, we considered the bipeedos irrational, primitive creatures.",
		"Spiders had long ceased believing in invisible forces.",
		"In spider stories, the fates had been replaced by the whims of nature, and destinies with the hopes, flaws and disappointments of animals.",
		"As a naive, young spider, I thought I could communicate with the bipeedo.",
		"I hoped to free them of their brutal reliance on the cold, smooth rock.",
		"I studied the marks they made on rocks and leaves.",
		"I spun into my webs messages about the hazards of believing in stories.",
		"They interpreted my messages as an epistle from Satan, and rolled their rock across them.",
		"What could I write that would make the bipeedo pause to read?",
	],
	rock: [
		"For thousands of years I was just a part of the vast earth.",
		"Over thousands of years more, I was separated and smoothed by water.",
		"For thousands of years more, I sat motionless while plants grew around me.",
		"The slow vibrations of the plants were joined by fast vibrations of moving creatures filled with liquid blood.",
		"Then one day, a creature standing on two legs lifted me into the air.",
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
};

function assignList(keys, list) {
	const obj = {};
	list = shuffle(list);
	let idx = 0;
	for (const k of keys) {
		obj[k] = list[idx];
		idx++;
	}
	return obj;
}

function getRange(min, max) {
	let a = randInt(min, max);
	let b = randInt(min, max);
	return a < b ? [a, b] : [b, a];
}

export { sunFinish, shakeAmount, sunInterval, moonInterval, edwardsQuote, narrative, lettersTrack, lettersLead, things, cellSize, assignList, getRange };