import * as THREE from '../modules/three.module.js';
// import {OrbitControls} from '../modules/OrbitControls.js';
import {third_person_camera} from './third-person-camera.js';
import {entity_manager} from './entity-manager.js';
import {player_entity} from './player-entity.js'
import {entity} from './entity.js';
// import {gltf_component} from './gltf-component.js';
//import {health_component} from './health-component.js';
import {player_input} from './player-input.js';
import {npc_entity} from './npc-entity.js';
// import {math} from './math.js';
// import {spatial_hash_grid} from './spatial-hash-grid.js';
// import {ui_controller} from './ui-controller.js';
// import {health_bar} from './health-bar.js';
// import {level_up_component} from './level-up-component.js';
// import {quest_component} from './quest-component.js';
// import {spatial_grid_controller} from './spatial-grid-controller.js';
// import {inventory_controller} from './inventory-controller.js';
// import {equip_weapon_component} from './equip-weapon-component.js';
//  import {attack_controller} from './attacker-controller.js';
 import {GLTFLoader} from '../modules/GLTFLoader.js';
 import { Reflector } from '../modules/Reflector.js';
// import {inventory_controller} from './inventory-controller.js';
// import {OBJLoader} from '../modules/OBJLoader.js';
// import {MTLLoader} from '../modules/MTLLoader.js';
import {FBXLoader} from '../modules/FBXLoader.js';



const _VS = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;

var level=1;

class myDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    //this._threejs.gammaFactor = 2.2;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.id = 'threejs';

    document.getElementById('container').appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 10000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xFFFFFF);
    this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    // let light = new THREE.DirectionalLight(0xFFFFFF, 0.01);
    // light.position.set(-10, 500, 10);
    // light.target.position.set(0, 0, 0);
    // light.castShadow = true;
    // light.shadow.bias = -0.001;
    // light.shadow.mapSize.width = 4096;
    // light.shadow.mapSize.height = 4096;
    // light.shadow.camera.near = 0.1;
    // light.shadow.camera.far = 1000.0;
    // light.shadow.camera.left = 100;
    // light.shadow.camera.right = -100;
    // light.shadow.camera.top = 100;
    // light.shadow.camera.bottom = -100;
    // this._scene.add(light);

    // this._sun = light;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000, 10, 10),
      new THREE.MeshStandardMaterial({
          color: 0x1e601c,
        }));
      plane.name = "plane"
      plane.receiveShadow = true;
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = 0.01;
      this._scene.add(plane);

    this._entityManager = new entity_manager.EntityManager();
    // this._grid = new spatial_hash_grid.SpatialHashGrid([[-1000, -1000], [1000, 1000]], [100, 100]);
    this._active = true;

    this._monsterVision = [];
    this._playerVision = [];
    this._player2Vision = [];

    //this._objects.push(plane)
    this._playerVision.push(plane);
    //this._keyFound = false;
    this._keyObject;
    //console.log(this._objects)
    this._params = {
      camera: this._camera,
      scene: this._scene,
      monsterVision: this._monsterVision,
      playerVision: this._playerVision,
      player2Vision: this._player2Vision,

      keyObject: this._keyObject,
      entityManager: this._entityManager,
    };

    // this.controls = new OrbitControls(this._camera, this._threejs.domElement);
    // this.controls.enableDamping = true;
    // this.controls.dampingFactor = 0.05;
    // this.controls.maxDistance = 1000;
    //this._LoadControllers();
    this._LoadPlayer();
    this._LoadSky();
    this._LoadRoom();
    this._UIInit();
  //   //}
  
  //   // if (level==2){
  //   //   while(this._scene.children.length > 0){ 
  //   //     this._scene.remove(this._scene.children[0]); 
  //   // }
  //   this._clearThree(this._scene);
  // const geometry = new THREE.BoxGeometry();
  // const material = new THREE.MeshNormalMaterial();
  // let mesh = new THREE.Mesh( geometry, material );
  // this._scene.add( mesh );
  // console.log('level 2')
  // console.log(this._scene.children)

  //   //}
    
    this._previousRAF = null;
    this._RAF();
  }

  _clearThree(obj){
    while(obj.children.length > 0){ 
      this._clearThree(obj.children[0]);
      obj.remove(obj.children[0]);
      //this._threejs.deallocateObject(obj)
      obj.deallocate()
    }
    if(obj.geometry) obj.geometry.dispose();
  
    if(obj.material){ 
      //in case of map, bumpMap, normalMap, envMap ...
      Object.keys(obj.material).forEach(prop => {
        if(!obj.material[prop])
          return;
        if(obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')                                  
          obj.material[prop].dispose();                                                      
      })
      obj.material.dispose();
    }
  }   
  

  // _LoadControllers() {
  //   const ui = new entity.Entity();
  //   ui.AddComponent(new ui_controller.UIController());
  //   this._entityManager.Add(ui, 'ui');
  // }

  _LoadSky() {
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this._scene.add(hemiLight);

    const uniforms = {
      "topColor": { value: new THREE.Color(0x0077ff) },
      "bottomColor": { value: new THREE.Color(0xffffff) },
      "offset": { value: 33 },
      "exponent": { value: 0.6 }
    };
    uniforms["topColor"].value.copy(hemiLight.color);

    this._scene.fog.color.copy(uniforms["bottomColor"].value);

    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _FS,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this._scene.add(sky);
  }

  _LoadRoom(){
    const mapLoader = new GLTFLoader();
    mapLoader.setPath('./resources/haunted_house/');
    mapLoader.load('scene.gltf', (glb) => {
        this._params.playerVision.push(glb.scene);
        this._params.player2Vision.push(glb.scene);

        this._params.scene.add(glb.scene);
        glb.scene.scale.setScalar(1);
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
        });
      });

    // const mirrorBack1 = new Reflector(
    //   new THREE.PlaneBufferGeometry(20, 20),
    //   {
    //       color: new THREE.Color(0x7f7f7f),
    //       textureWidth: window.innerWidth * window.devicePixelRatio,
    //       textureHeight: window.innerHeight * window.devicePixelRatio
    //   }
    // )
    // mirrorBack1.position.copy(new THREE.Vector3(3, 10, -30));
    // this._scene.add(mirrorBack1);
    // this._playerVision.push(mirrorBack1)

    //Load Key
    const loader = new FBXLoader();
    loader.setPath('./resources/key/');
    loader.load('key.fbx', (fbx) => {
      fbx.name = 'key'
      fbx.position.copy(new THREE.Vector3(3, 5, -9));
      fbx.scale.setScalar(2);
      this._scene.add(fbx);
      this._params.keyObject = fbx;
      fbx.traverse(c => {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });
    });
  }



  _LoadPlayer() {

    const player = new entity.Entity();
    player.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'girl'));
    player.AddComponent(new player_entity.BasicCharacterController(this._params, 'girl' , true));
    this._entityManager.Add(player, 'player');

    const player2 = new entity.Entity();
    player2.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'mouse'));
    player2.AddComponent(new player_entity.BasicCharacterController(this._params, 'mouse' , false));
    this._entityManager.Add(player2, 'player2');

    const camera = new entity.Entity();
    camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
            camera: this._camera,
            target: this._entityManager.Get('player'), 
            cameraVision : this._player2Vision}));
    this._entityManager.Add(camera, 'player-camera');

    const npc = new entity.Entity();
      npc.AddComponent(new npc_entity.NPCController(this._params));
      //npc.AddComponent(new attack_controller.AttackController({timing: 0.35}));
      this._entityManager.Add(npc, 'npc1');
  }

  _UIInit(){
      this._iconBar = {
        stats: document.getElementById('icon-bar-stats'),
        inventory: document.getElementById('icon-bar-inventory'),
        quests: document.getElementById('icon-bar-quests'),
      };

      this._ui = {
        inventory: document.getElementById('inventory'),
        quests: document.getElementById('quest-journal'),
      };

      this._iconBar.inventory.onclick = (m) => { this._OnInventoryClicked(m); };
      this._iconBar.quests.onclick = (m) => { this._OnSwitchClicked(m); };
      this._ui.inventory.style.visibility = 'hidden';

  }

  _OnSwitchClicked() {
    if(this._active){
      // this._active = false;
      this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(false);
      // this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(true);
    }else{
      // this._active = true;
      this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(false);
      // this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(false);
    }
  }

  _OnInventoryClicked() {
    const visibility = this._ui.inventory.style.visibility;
    // this._ui.inventory.style.visibility = 'hidden';
    this._ui.inventory.style.visibility = (visibility ? '' : 'hidden');
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _UpdateSun() {
    const player = this._entityManager.Get('player');
    const pos = player._position;

    this._sun.position.copy(pos);
    this._sun.position.add(new THREE.Vector3(-10, 500, -10));
    this._sun.target.position.copy(pos);
    this._sun.updateMatrixWorld();
    this._sun.target.updateMatrixWorld();
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }
      
      if(!this._entityManager.Get('player').GetComponent("BasicCharacterController").GetActive() && !this._entityManager.Get('player2').GetComponent("BasicCharacterController").GetActive()){
        if(this._active ){
          this._active = false;
          this._entityManager.Get('player2').GetComponent("BasicCharacterControllerInput").ResetR();
          this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(true);
          this._entityManager.Get('player-camera').GetComponent("ThirdPersonCamera").ChangePlayer({
            camera: this._camera,
            target: this._entityManager.Get('player2')});
        }else{
          this._active = true;
          this._entityManager.Get('player').GetComponent("BasicCharacterControllerInput").ResetR();
          this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(true);
          this._entityManager.Get('player-camera').GetComponent("ThirdPersonCamera").ChangePlayer({
            camera: this._camera,
            target: this._entityManager.Get('player')
          });
        }
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

    //this._UpdateSun();

    this._entityManager.Update(timeElapsedS);
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new myDemo();
});
