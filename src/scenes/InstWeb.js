import { Counter, randomInt } from '../../cool/cool.js';
import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';

import { WebUpdater } from '../WebUpdater.js';

/**
 * practice using web to connect two trees
 * @param {Object} sprites - game sprites
 * @param {Spider} player - the player
 */
export function InstWeb(sprites, player, seq) {

	const scene = new Scene();
	let xBtn, instText;
	let trees, web, webUpdater;

	scene.setup = function(sfx) {

		trees = Trees(scene, sprites);
		web = Web();
		webUpdater = WebUpdater(sfx);

		scene.addSprite([player, web]);
		
		instText = scene.addToDisplay(new TextSprite({
			countForward: true,
			msg: Strings.INST_WEB_1,
			wrap: 22,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 1.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: sprites.letters,
		}));

		xBtn = scene.addToDisplay(new TextSprite({
			msg: Strings.X_BTN,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: sprites.letters_keyboard,
		}));

		trees.addLocation(
			randomInt(2 * Consts.CELL_SIZE.W, 4 * Consts.CELL_SIZE.W), 
			randomInt(3 * Consts.CELL_SIZE.W, 6 * Consts.CELL_SIZE.W), 
			randomInt(25)
		);

		trees.addLocation(
			randomInt(7 * 64, 12 * 64), 
			randomInt(3 * 64, 6 * 64), 
			randomInt(25)
		);
	};

	// after connecting trees and releasing web, go to practice symbol
	// [connect 1 tree, connect 2 tree, release web]
	const connections = [false, false, false];
	const delay = new Counter(120, () => {
		seq.next();
	});

	scene.onUpdate = () => {
		const connection = webUpdater.update(player, web, trees);

		if (connection === Consts.WEB_CONNECTIONS.STARTED) {
			if (!connections[0] && !connections[1] && !connections[2]) {
				connections[0] = true;
				instText.setMsg(Strings.INST_WEB_2);
			}
		}

		if (connection === Consts.WEB_CONNECTIONS.COMPLETED) {
			if (connections[0] && !connections[2]) {
				connections[1] = true;
				xBtn.setMsg(Strings.Z_BTN);
				instText.setMsg(Strings.INST_WEB_3);
			}
		}

		if (connection >= Consts.WEB_CONNECTIONS.RELEASE) {
			if (connections[0] && connections[1]) {
				connections[2] = true;
			}
		}
		
		if (connections.every(c => c)) {
			delay.update();
		}
	};

	return scene;
}