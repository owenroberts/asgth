import { Consts } from './Consts.js';

/**
 * handles player input and web connections
 * @return {[type]} [description]
 */
export function WebUpdater(sfx) {

	let treeList = [];
	let treeLocation, prevTreeLocation; // location of tree under player

	/* testing (still?) continuous web vs segmented */
	let continuousWeb = true;
	let checkUnfinishedConnection = true;
	document.addEventListener('keydown', ev => {
		if (ev.code === 'KeyT') {
			continuousWeb = !continuousWeb;
			console.log('Continuous web toggled', continuousWeb);
		}
		if (ev.code === 'KeyY') {
			checkUnfinishedConnection = !checkUnfinishedConnection;
			console.log('Check unfinished toggled', checkUnfinishedConnection);
		}
		// else if (ev.code == 'Enter') ui.message.continue.onClick(); // to move message without mouse
	});

	/**
	 * test and return web connections
	 * @param  {Player} player - the player
	 * @param  {Web} web    - the web
	 * @param  {Trees} trees  - the trees
	 * @return {number}        connection type
	 */
	function update(player, web, trees) {

		// cancel web
		if (player.input.z) {
			player.resetInput();
			if (treeList.length > 1 && continuousWeb) {
				web.popPoint(); // last spider point
				web.end();
				treeList = [];
				sfx.play('cancel');
				return Consts.WEB_CONNECTIONS.RELEASE;
			}
			if (web.isActive()) {
				web.cancel();
				return 4;
			}
		}

		let connection = Consts.WEB_CONNECTIONS.NONE; // falsey no connection
		treeLocation = trees.isColliding(player); // player colliding with tree

		if (treeLocation) {
			// selectSprite.position = treeLocation; // move to trees? 
			// selectSprite.isActive = true;

			if (player.input.x) {
				player.resetInput();
				if (!web.isActive()) {

					// started a line
					connection = Consts.WEB_CONNECTIONS.STARTED;

					web.start();
					web.addPoint([
						treeLocation[0] + Consts.CELL_SIZE.W / 2, 
						treeLocation[1] + Consts.CELL_SIZE.H / 2
					]);
					web.addPoint(player.position);
					
					treeList.push(structuredClone(treeLocation));
					prevTreeLocation = structuredClone(treeLocation);
					sfx.play('connect');


				} else if (prevTreeLocation[0] !== treeLocation[0] || 
							prevTreeLocation[1] !== treeLocation[1]) {

					web.insertPoint([
						treeLocation[0] + Consts.CELL_SIZE.W / 2,
						treeLocation[1] + Consts.CELL_SIZE.H / 2
					]);
					
					if (!continuousWeb) {
						web.end();
						connection = Consts.WEB_CONNECTIONS.RELEASE;
					} else {
						web.insertEnd();
						web.insertPoint([treeLocation[0] + 32, treeLocation[1] + 32]); 
						prevTreeLocation = treeLocation;
						treeList.push([...treeLocation]);
						connection = Consts.WEB_CONNECTIONS.COMPLETED;
					}
					sfx.play('connect');
				} else {
					sfx.play('cancel');
				}
			}
		} else {
			// selectSprite.isActive = false;
		}

		return connection;
	}

	return { update };
}