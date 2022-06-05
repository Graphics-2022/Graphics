import { menu } from './menu.js';
import { gameOver } from './gameOver.js';
import { level1 } from './level1.js';
import { level2} from './level2.js';
import { level3} from './level3.js';
import { levelPassed} from './levelPassed.js'
import {gameFinished} from './gameFinished.js'
import { credits } from './credits.js';

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  //_APP = new menu.menu(_APP);
  // _APP = new gameOver.gameOver(_APP);
_APP=new menu.menu(_APP);
});
