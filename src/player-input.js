import * as THREE from '../modules/three.module.js';
import {entity} from "./entity.js";

export const player_input = (() => {

  class PickableComponent extends entity.Component {
    constructor() {
      super();
    }

    InitComponent() {
    }
  };

  class BasicCharacterControllerInput extends entity.Component {
    constructor(params , active) {
      super();
      this._params = params;
      this._active = active;
      this._Init();
    }
  
    _Init() {
      this._keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        space: false,
        shift: false,
        switch: false
      };
      this._raycaster = new THREE.Raycaster();
      document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
      document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
      document.addEventListener('mouseup', (e) => this._onMouseUp(e), false);
    }
  
    _onMouseUp(event) {
      const rect = document.getElementById('threejs').getBoundingClientRect();
      const pos = {
        x: ((event.clientX - rect.left) / rect.width) * 2  - 1,
        y: ((event.clientY - rect.top ) / rect.height) * -2 + 1,
      };

      // let rey = new THREE.Raycaster();
      this._raycaster.far = 50;
      this._raycaster.setFromCamera(pos, this._params.camera);
      var int = this._raycaster.intersectObjects( this._params.scene.children, true);
      //console.log(int)

      if ( int.length > 0){
        if(int[0].object.name == "Key"){
          console.log("key found");
          const div = document.getElementById("inventory-1");
          div.style.backgroundImage = "url('./resources/icons/key.png')";
          this._params.scene.remove(this._params.keyObject);
          this._params.keyFound = true;
        }
        console.log(int[0].object)
        
        if(int[0].object.name == "Notepad_BAKED_Notepad_BAKED_0" ){

          console.log("key found");
          const div = document.getElementById("inventory-1");
          //console.log(div);
          div.style.backgroundImage = "url('./resources/icons/key.png')";
          this._params.scene.remove(this._params.keyObject);
          //this._params.scene.remove(this._params.keyLight);
          this._params.keyFound = true;
        }

        if((int[0].object.name == "map3door" || int[0].object.name == "Panel001_Door_inside_0" || int[0].object.name ==  "Panel_Door_inside_0")){ // && this._params.keyFound){
          this._params.openDoor = true;
          console.log("door");
        }
      }
    }

    _onKeyDown(event) {
      switch (event.keyCode) {
        case 87: // w
          this._keys.forward = true;
          break;
        case 65: // a
          this._keys.left = true;
          break;
        case 83: // s
          this._keys.backward = true;
          break;
        case 68: // d
          this._keys.right = true;
          break;
        case 32: // SPACE
          //this._keys.space = true;
          break;
        case 16: // SHIFT
          this._keys.shift = true;
          break;
        case 82: // r
        this._keys.switch = false;
        break;
      }
    }
  
    _onKeyUp(event) {
      switch(event.keyCode) {
        case 87: // w
          this._keys.forward = false;
          break;
        case 65: // a
          this._keys.left = false;
          break;
        case 83: // s
          this._keys.backward = false;
          break;
        case 68: // d
          this._keys.right = false;
          break;
        case 32: // SPACE
          this._keys.space = false;
          break;
        case 16: // SHIFT
          this._keys.shift = false;
          break;
        case 82: // r
          this._keys.switch = true;
          break;
      }
    }

    ResetR(){
      this._keys.switch = false;
    }
  };

  return {
    BasicCharacterControllerInput: BasicCharacterControllerInput,
    PickableComponent: PickableComponent,
  };

})();