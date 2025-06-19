import { Counter, randomInt } from '../../cool/cool.js';
import { Scene, TextSprite } from '../../lines/src/Engine.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';

import { Trees } from '../components/Trees.js';
import { Web } from '../components/Web.js';

/**
 * practice using web to connect two trees
 * @param {Object} gm - game manager
 * @param {Spider} player - the player
 */
export function instWeb(gm, player) {

	const scene = new Scene();
	let xBtn, instText;
	let trees, web, webUpdater;

	scene.setup = function(sfx) {

		trees = Trees(gm);
		web = Web(sfx);

		scene.addSprite([player, web, trees.getSprites()]);
		
		instText = scene.addToDisplay(new TextSprite({
			countForward: true,
			msg: Strings.INST_WEB_1,
			wrap: 22,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * 1.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: gm.anims.sprites.letters,
		}));

		xBtn = scene.addToDisplay(new TextSprite({
			msg: Strings.X_BTN,
			x: Consts.CELL_SIZE.W * 0.5,
			y: Consts.CELL_SIZE.H * 0.5,
			letters: gm.anims.sprites.letters_keyboard,
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
	// conditions? some kind of condition manager?
	const connections = {
		firstTree: false,
		secondTree: false,
		releasedWeb: false,
		clearedWeb: false,
	};

	const delay = new Counter(120, () => {
		gm.sq.next();
	});

	scene.onUpdate = function() {
		// const connection = webUpdater.update(player, web, trees);
		const treeLocation = trees.isColliding(player);
		const connection = web.getConnection(player, treeLocation);

		if (connection === Consts.WEB_CONNECTIONS.STARTED) {
			if (!connections.firstTree && !connections.secondTree && !connections.releasedWeb) {
				connections.firstTree = true;
				instText.setMsg(Strings.INST_WEB_2);
			}
		}

		if (connection === Consts.WEB_CONNECTIONS.COMPLETED) {
			if (connections.firstTree && !connections.releasedWeb) {
				connections.secondTree = true;
				xBtn.setMsg(Strings.Z_BTN);
				instText.setMsg(Strings.INST_WEB_3);
			}
		}

		if (connection === Consts.WEB_CONNECTIONS.RELEASED ||
			connection === Consts.WEB_CONNECTIONS.CANCELED) {
			if (connections.firstTree && connections.secondTree) {
				connections.releasedWeb = true;
				xBtn.setMsg(Strings.C_BTN);
				instText.setMsg(Strings.INST_WEB_4);
			}
		}

		if (connection === Consts.WEB_CONNECTIONS.CLEARED) {
			if (connections.firstTree && connections.secondTree && connections.releasedWeb) {
				connections.clearedWeb = true;
			}
		}


		
		if (connections.firstTree && connections.secondTree && connections.releasedWeb && connections.clearedWeb) {
			delay.update();
		}
	};

	return scene;
}