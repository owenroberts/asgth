import { randomInt, choice, random } from '../../cool/cool.js';

import { Scene, Sprite, Texture, TileMap } from '../../lines/src/Engine.js';
import { BSPMap } from "../../hellmaps/src/Map.js";
import { Consts } from '../Consts.js';

import { Level } from '../classes/Level.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';
import { Sun } from '../components/Sun.js';

import { SymbolMatch } from '../SymbolMatch.js';
import { SymbolMatch2 } from '../SymbolMatch2.js';

export function RockLevel(gm, player, sfx) {
	
	const scene = new Scene();

	let trees, web, sun, rock;

	const dir = choice(-1, 1); // rock starts animating
	let rockRolled = false;		

	const finishString = gm.props.nextSymbolString.split('').sort().join('');
	let symbolsMatched = [];
	let prevMatched = '';
	const symbolMatch = SymbolMatch();
	const symbolMatch2 = SymbolMatch2();

	scene.setup = function() {

		// rn all symbols are 1
		// min room size is size of room, 3+ is easiest/guaranteed
		let minNodeRoomSize = gm.props.nextSymbolString.length > 2 ? 2 : 1;
		// make at least one with 3 for each 3 symbol
		// or something more complex to make sure there are 3x3 grids for each symbol ... 
		if (gm.props.levelCount === 0) minNodeRoomSize = 3;
		
		// maybe gonna change this a lot ... 
		// set max nodes based on level -- fewer nodes means bigger rooms
		// max 1x1 nodes 13x7 = 91, use 1/3 ish of that
		// const maxNodes = 16 - levelCount + (points.rock - points.spider);
		const maxNodes = Math.min(24, gm.props.levelCount + 3 + (gm.props.points.SPIDER - gm.props.points.ROCK));


		const map = new BSPMap(13, 7, minNodeRoomSize, 6, minNodeRoomSize);
		map.build({ w: 0, h: 0 }, { w: 0, h: 0 }, maxNodes, Consts.CELL_SIZE, false);

		trees = Trees(gm);
		scene.addSprite(trees.getSprites());
		trees.clearAnimator();

		map.nodes
			.filter(n => n.room)
			.forEach(n => {
				const i = randomInt(25 - 3); // random tree clusters
				const r = n.room;
				for (let x = r.x; x < r.x + r.w; x++) {
					for (let y = r.y; y < r.y + r.h; y++) {
						trees.addLocation(
							x * Consts.CELL_SIZE.W, 
							y * Consts.CELL_SIZE.H, 
							randomInt(i, i + 3)
						);
					}
				}
			});

		const groundTexture = choice('tiles_grass', 'tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');
		const ground = scene.add(new Texture({ animation: gm.anims.sprites[groundTexture] }));
		const tileMap = new TileMap(13, 7);
		tileMap.matrix = structuredClone(map.matrix);
		console.log({map, tileMap})

		const walls = [];

		for (let i = 0; i < map.matrix.length; i++) {
			if (map.matrix[i] === 0) {
				const { x, y } = tileMap.getIndexPosition(i);
				walls.push([x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H]);
				const f = tileMap.getTextureByPosition(x, y, 0);
				ground.addLocation(x * Consts.CELL_SIZE.W, y * Consts.CELL_SIZE.H, f);
			}
		}		
		
		player.spawn(choice(walls)); // no spawn on edge
		scene.addSprite(player);

		sun = Sun(gm);
		scene.add(sun.getSprite());
		sun.setup();

		rock = scene.addSprite(new Sprite(gm.width, -gm.anims.sprites.rock.height, gm.anims.sprites.rock));
		rock.isActive = false;
		rock.animation.play();

		web = Web(sfx);
		scene.addSprite(web);		
	}

	function updateScore() {
		let point = prevMatched === finishString ? 1 : 0;
		gm.props.lastPointWinner = point === 1 ? 'SPIDER' : 'ROCK'; // save who got this point
		gm.props.points[gm.props.lastPointWinner]++;
	}

	/* release web when a shape is made */
	let checkUnfinished = true;
	document.addEventListener('keydown', ev => {
		if (ev.code === 'KeyY') {
			checkUnfinished = !checkUnfinished;
			console.log('Check unfinished toggled', checkUnfinished);
		}
	});

	// dont kys on this, going to remove probably ... but also use in another scene ... 
	scene.onUpdate = function() {
		if (rockRolled) rockUpdate();
		else webUpdate();
	};

	function webUpdate() {
		const treeLocation = trees.isColliding(player);
		const connection = web.getConnection(player, treeLocation);
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
			gm.sq.next();
		}
	}

	scene.rock = function() {
		
		web.end(); // unset web scene
		sfx.pause('web');
		trees.startRock();
		sun.getSprite().isActive = false;
		
		rock.position[0] = dir === 1 ? -rock.halfWidth : gm.width;
		rock.position[1] = -rock.halfHeight;
		rock.isActive = true;

		sfx.play('stone');
		sfx.play('rock');

		player.isActive = false;
		web.startOverride();
		rockRolled = true;
	};

	function rockUpdate() {
		rock.position[0] += random(2, 1) * dir * Consts.ROCK_SPEED;
		rock.position[1] += random(-1, 2) * Consts.ROCK_SPEED;

		sfx.loop('stone');
		sfx.loop('rock');

		if ((dir === -1 && rock.position[0] < -rock.width) || 
			dir === 1 && rock.position[0] > gm.width) {
			rock.isActive = false;
			rock.displayFunc = undefined;
			player.isActive = true;
			gm.sq.next();
		}
		trees.shake();
	}

	return scene;
}