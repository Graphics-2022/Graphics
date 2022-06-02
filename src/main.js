import * as THREE from '../modules/three.module.js';
import { third_person_camera } from './third-person-camera.js';
import { entity_manager } from './entity-manager.js';
import { player_entity } from './player-entity.js'
import { entity } from './entity.js';
import { player_input } from './player-input.js';
import { npc_entity } from './npc-entity.js';
import { GLTFLoader } from '../modules/GLTFLoader.js';
import { Reflector } from '../modules/Reflector.js';
import { FBXLoader } from '../modules/FBXLoader.js';
import { FontLoader } from '../modules/FontLoader.js';
import { TextGeometry } from '../modules/TextGeometry.js';
import { menu } from './menu.js';
import { gameOver } from './gameOver.js';
import { level1 } from './level1.js';
import { level2} from './level2.js';
import { level3} from './level3.js';

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new menu.menu(_APP);
  // _APP = new level3.level3(_APP);

});
