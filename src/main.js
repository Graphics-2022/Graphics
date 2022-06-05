import { menu } from './menu.js';
import { gameOver } from './gameOver.js';
import { level1 } from './level1.js';
import { level2} from './level2.js';
import { level3} from './level3.js';
import { levelPassed} from './levelPassed.js'
import {gameFinished} from './gameFinished.js'
import { credits } from './credits.js';

let _APP = null;

// Start the app in the menu page
window.addEventListener('DOMContentLoaded', () => {
  _APP = new level3.level3(_APP);
});
