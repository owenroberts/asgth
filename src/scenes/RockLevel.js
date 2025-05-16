import { choice } from '../../cool/cool.js';
import { Scene } from '../../lines/src/Engine.js';
import { Level } from '../classes/Level.js';
import { Trees } from '../Trees.js';
import { Web } from '../Web.js';
import { Sun } from '../Sun.js';
import { WebUpdater } from '../WebUpdater.js';
import { Consts } from '../Consts.js';
import { SymbolMatch } from '../SymbolMatch.js';
import { SymbolMatch2 } from '../SymbolMatch2.js';

export function RockLevel(gm, player, seq, sfx, symbolString, levelCount, points) {
	
	const scene = new Scene();

	const symbolMatch = SymbolMatch();
	const symbolMatch2 = SymbolMatch2();

	// rn all symbols are 1
	// min room size is size of room, 3+ is easiest/guaranteed
	let minNodeRoomSize = symbolString.length > 2 ? 2 : 1;
	// make at least one with 3 for each 3 symbol
	// or something more complex to make sure there are 3x3 grids for each symbol ... 
	if (levelCount === 0) minNodeRoomSize = 3;
	
	// maybe gonna change this a lot ... 
	// set max nodes based on level -- fewer nodes means bigger rooms
	// max 1x1 nodes 13x7 = 91, use 1/3 ish of that
	// const maxNodes = 16 - levelCount + (points.rock - points.spider);
	const maxNodes = Math.min(24, levelCount + 3 + (points.SPIDER - points.ROCK));

	const groundTexture = choice('tiles_grass', 'tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');
	const level = new Level(minNodeRoomSize, maxNodes, gm.anims.sprites[groundTexture]);
	scene.addSprite(level);

	const trees = Trees(gm.anims.sprites);
	scene.addSprite(trees.getSprites());
	level.locations.forEach(loc => trees.addLocation(...loc));

	player.spawn(choice(level.walls)); // no spawn on edge
	scene.addSprite(player);

	const sun = Sun(gm);
	scene.add(sun.getSprite());
	sun.setup();

	const web = Web();
	scene.addSprite(web);
	const webUpdater = WebUpdater(sfx);

	
	let symbolsMatched = [];
	let prevMatched = '';
	const finishString = symbolString.split('').sort().join('');

	function updateScore() {
		let point = prevMatched === finishString ? 1 : 0;
		lastPointWinner = point === 1 ? 'SPIDER' : 'ROCK'; // save who got this point
		points[lastPointWinner]++;
		let scoreX = gm.width - 64 * 1.125;
		let scoreY = 64 * 0.125 + (64 * (points.SPIDER + points.ROCK - 1));
		scoreDisplay.addLocation(scoreX, scoreY,  point);
		levelDisplay.addLocation(scoreX - 64, scoreY, levelCount);
		return lastPointWinner;
	}

	/* finish for them */
	let checkUnfinished = true;
	document.addEventListener('keydown', ev => {
		if (ev.code === 'KeyY') {
			checkUnfinished = !checkUnfinished;
			console.log('Check unfinished toggled', checkUnfinished);
		}
	});

	// dont kys on this, going to remove probably ... but also use in another scene ... 
	scene.onUpdate = () => {

		const connection = webUpdater.update(player, web, trees);
		if ((connection === Consts.WEB_CONNECTIONS.COMPLETED && checkUnfinished) || connection === Consts.WEB_CONNECTIONS.RELEASED) {

			const points = structuredClone(web.getPoints({ trimmed: connection === Consts.WEB_CONNECTIONS.COMPLETED }));
			
			const symbolMatches = symbolMatch.getMatch(points, 64, 32);

			// only adds if the first one didn't get it
			const symbolMatches2 = symbolMatch2.getMatch(points, 64, 32);
			
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
				if (connection === Consts.WEB_CONNECTIONS.COMPLETED) {
					web.cancel();
				}
				sfx.play('match', true, 0.9, 1.1);
			}
			prevMatched = matched.sort().join('');

			if (prevMatched === finishString) {
				// spider got it
				sun.end();
			}
		}

		if (web.isActive() && player.isMoving()) {
			sfx.play('web');
		} else {
			sfx.pause('web');
		}

		sun.update();
		if (sun.isDone()) {
			updateScore();
			seq.next(); 
		}
	};

	return scene;
}