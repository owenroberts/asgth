import { Counter, randomInt, choice, tileMap, map } from '../../cool/cool.js';
import { ColliderSprite, ColliderEmpty, Scene, Texture, Sprite } from '../../lines/src/Engine.js';
import level_bounds from '../data/level_bounds.json';
import { Consts } from '../Consts.js';

// this whole thing needs a rewrite ... 
export function WalkLevel(gm, player, seq, sfx) {

	const scene = new Scene();

	const { levels } = level_bounds;
	const levelIndex = gm.props.levelCount < levels.length ? 
		gm.props.levelCount : 
		randomInt(0, levels.length - 1);
	const levelData = levels[levelIndex];
	const end = levelData.end;
	
	player.spawn([
		levelData.start[0] * Consts.CELL_SIZE.W + player.halfWidth, 
		levelData.start[1] * Consts.CELL_SIZE.H + player.halfHeight,
	]);
	scene.addSprite(player);

	const bg = scene.addToDisplay(new Sprite(0, 0, gm.anims.sprites.levels));
	bg.animation.frame = levelIndex;

	const moon = scene.addToDisplay(new Sprite(13 * Consts.CELL_SIZE.W, 7 * Consts.CELL_SIZE.H, gm.anims.sprites.moon));
	const moonAnim = new Counter(Consts.MOON_INTERVAL);

	const groundTexture = choice('tiles_stones', 'tiles_sparse_grass', 'tiles_dirt');
	const ground = new Texture({ animation: gm.anims.sprites[groundTexture] });
	scene.addToDisplay(ground);

	const ender = scene.add(new ColliderSprite(end[0] * 64, end[1] * 64, gm.anims.sprites.end_web));

	const matrix = [];
	for (let x = 0; x < 13; x++) {
		for (let y = 0; y < 8; y++) {
			matrix[x + y * 13] = 0;
		}
	}

	const colliders = levelData.bounds.map(b => {
		const [x, y, w, h] = b;
		for (let _x = x; _x < x + w; _x++) {
			for (let _y = y; _y < y + h; _y++) {
				matrix[_x + _y * 13] = 1;
			}
		}
		const c = new ColliderEmpty(x * 64, y * 64, w * 64, h * 64);
		c.debug = true;
		return c;
	});

	if (levelData.ground) {
		levelData.ground.map(g => {
			const [x, y, w, h] = g;
			for (let _x = x; _x < x + w; _x++) {
				for (let _y = y; _y < y + h; _y++) {
					matrix[_x + _y * 13] = 1;
				}
			}
		});
	}

	// should be in cool or game engine ...
	// where is this from? why don't i have notes?
	function getMatrixCellNum(x, y, includeEdges=false) {
		if (x < 0 || y < 0 || x >= 13 || y >= 8) {
			return -1;
		} else {
			return matrix[x + y * 13];
		}
	}

	function getWangBlobNum(binaryString) {
		let array = binaryString.split('').map(n => Boolean(+n));
		let [t, tr, r, br, b, bl, l, tl] = array;
		if (!(t && l)) tl = 0;
		if (!(t && r)) tr = 0;
		if (!(b && l)) bl = 0;
		if (!(b && r)) br = 0;

		let tot = 0;
		if (t) 	tot += (1 << 0);
		if (tr)	tot += (1 << 1);
		if (r)	tot += (1 << 2);
		if (br)	tot += (1 << 3);
		if (b) 	tot += (1 << 4);
		if (bl)	tot += (1 << 5);
		if (l)	tot += (1 << 6);
		if (tl)	tot += (1 << 7);

		return tot;
	}

	function getMatrixCell(x, y, n) {
		return [
			getMatrixCellNum(x    , y - 1) === n ? 1 : 0,
			getMatrixCellNum(x + 1, y - 1) === n ? 1 : 0,
			getMatrixCellNum(x + 1, y    ) === n ? 1 : 0,
			getMatrixCellNum(x + 1, y + 1) === n ? 1 : 0,
			getMatrixCellNum(x    , y + 1) === n ? 1 : 0,
			getMatrixCellNum(x - 1, y + 1) === n ? 1 : 0,
			getMatrixCellNum(x - 1, y    ) === n ? 1 : 0,
			getMatrixCellNum(x - 1, y - 1) === n ? 1 : 0,
		].join('').toString();
	}

	for (let i = 0; i < matrix.length; i++) {
		if (matrix[i] === 0) {
			const x = i % 13;
			const y = Math.floor(i / 13);
			const mt = getMatrixCell(x, y, 0);
			const n = getWangBlobNum(mt);
			const f = tileMap.indexOf(n);
			ground.addLocation(x * 64, y * 64, f);
		}
	}

	scene.onUpdate = () => {
		for (let i = 0; i < colliders.length; i++) {
			if (player.collide(colliders[i])) player.back();
		}
		
		if (player.collide(ender)) {
			seq.next();
		}

		moonAnim.update();
		moon.position[1] = map(Math.sin(moonAnim.getProgress() * Math.PI), 0, 1, gm.height - 64, 0, true);
	};

	return scene;
}