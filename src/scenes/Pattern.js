import { random, Counter } from '../../cool/cool.js';
import { Sprite, Scene, GameAnim, TextSprite } from '../../lines/src/Engine.js';
import { Drawing, Layer, Style, Points, Animator } from '../../lines/src/Lines.js';
import { Consts } from '../Consts.js';
import { Strings } from '../Strings.js';
import { ContinueUI } from '../components/ContinueUI.js';

export class Pattern extends Scene {

	constructor(gm) {
		super();

		const animation = new GameAnim(gm);
		const drawing = new Drawing();
		animation.drawings.push(drawing);
		animation.layers.push(new Layer());
		animation.styles.push(new Style({
			color: "#FFFFFF",
			segmentNum: 4,
			wiggleRange: 1,
			wiggleSegments: true,
		}));
		animation.setFrames(); // needs this for game anim that isn't loaded...

		// little sprite hack
		this.add({ display() { animation.draw(); } });

		this.add(new TextSprite({
			message: Strings.INST_DRAW_PATTERN,
			track: Consts.LETTERS_TRACK,
			lead: Consts.LETTERS_LEAD,
			x: Consts.CELL_SIZE.W * Consts.TEXT_MARGIN.W,
			y: Consts.CELL_SIZE.H * Consts.TEXT_MARGIN.H,
			letters: gm.anims.sprites.letters,
			wrap: 24,
		}));

		const continueUI = this.add(new ContinueUI(gm));
		continueUI.isActive = false;
		
		this.isNextReady = false;

		this.nextDelay = new Counter(Consts.PATTERN_DELAY, () => {
			gm.sfx.play("continue", { randomRate: true });
			continueUI.isActive = true;
			this.isNextReady = true;
		});

		const sX = Consts.CELL_SIZE.W; // consts?
		const sY = Consts.CELL_SIZE.H * 2; 

		// pattern[lines[points[xy]]]
		// [[[x1, y1], [x2, y2]]]
		for (let i = 0; i < gm.states.pattern.length; i++) {
			drawing.add([
				sX + gm.states.pattern[i][0][0] * Consts.CELL_SIZE.W2, 
				sY + gm.states.pattern[i][0][1] * Consts.CELL_SIZE.H2,
			]);
			drawing.add([
				sX + gm.states.pattern[i][1][0] * Consts.CELL_SIZE.W2,
				sY + gm.states.pattern[i][1][1] * Consts.CELL_SIZE.H2,
			]);
			drawing.add(Points.END);
		}
	}

	update() {
		this.nextDelay.update();
	}
}