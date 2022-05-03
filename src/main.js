import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {third_person_camera} from './third-person-camera.js';
import {entity_manager} from './entity-manager.js';
import {player_entity} from './player-entity.js'
import {entity} from './entity.js';
import {gltf_component} from './gltf-component.js';
//import {health_component} from './health-component.js';
import {player_input} from './player-input.js';
import {npc_entity} from './npc-entity.js';
import {math} from './math.js';
import {spatial_hash_grid} from './spatial-hash-grid.js';
import {ui_controller} from './ui-controller.js';
// import {health_bar} from './health-bar.js';
// import {level_up_component} from './level-up-component.js';
// import {quest_component} from './quest-component.js';
import {spatial_grid_controller} from './spatial-grid-controller.js';
// import {inventory_controller} from './inventory-controller.js';
// import {equip_weapon_component} from './equip-weapon-component.js';
 import {attack_controller} from './attacker-controller.js';
 import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';


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



class myDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.gammaFactor = 2.2;
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
    var listener = new THREE.AudioListener();
  this._camera.add( listener );

  // create a global audio source
  var sound = new THREE.Audio( listener );

  var audioLoader = new THREE.AudioLoader();

  //Load a sound and set it as the Audio object's buffer
  audioLoader.load( 'resources/sounds/Juhani Junkala - Post Apocalyptic Wastelands [Loop Ready].ogg', function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
  },
  // onProgress callback
  function ( xhr ) {
    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  },

  // onError callback
    function ( err ) {
      console.log( 'An error occured' );
    }

);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xFFFFFF);
    this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-10, 500, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 1000.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    this._sun = light;

    //const plane = new THREE.Mesh(
        //new THREE.PlaneGeometry(100, 100, 10, 10),
        //new THREE.MeshStandardMaterial({
            //color: 0x1e601c,
          //}));
    //plane.castShadow = false;
    //plane.receiveShadow = true;
    //plane.rotation.x = -Math.PI / 2;
    //this._scene.add(plane);

    this._entityManager = new entity_manager.EntityManager();
    this._grid = new spatial_hash_grid.SpatialHashGrid([[-1000, -1000], [1000, 1000]], [100, 100]);
    this._active = true;

    this._LoadControllers();
    this._LoadPlayer();
    //this._LoadFoliage();
    //dthis._LoadClouds();
    //this._LoadSky();
    //this._LoadRoom();
    
    this._previousRAF = null;
    this._RAF();
  }

   _LoadControllers() {
     const ui = new entity.Entity();
     ui.AddComponent(new ui_controller.UIController());
     this._entityManager.Add(ui, 'ui');
   }

  _LoadSky() {
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
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
    const e=new entity.Entity();
    const pos= new THREE.Vector3(0,0,0);
    e.AddComponent(new gltf_component.StaticModelComponent({
      scene: this._scene,
      resourcePath: './resources/Level1Rooms/',
      resourceName: 'dungeon_001.glb',
      position: pos,
      scale: 4.5,
      //emissive: new THREE.Color(0x808080),
    }));
    e.SetPosition(pos);
    this._entityManager.Add(e);
    e.SetActive(false);
    e.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
  }

  _LoadPlayer() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    };
   
    const player = new entity.Entity();
    player.AddComponent(new player_input.BasicCharacterControllerInput(params, 'girl'));
    player.AddComponent(new player_entity.BasicCharacterController(params, 'girl' , true));
    player.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid})); // keep track of anything nearby
    //player.AddComponent(new attack_controller.AttackController({timing: 0.7}));
    //trying to place girl in space
    player.SetPosition(new THREE.Vector3(-400,700,0))
    this._entityManager.Add(player, 'player');
    

    const player2 = new entity.Entity();
    player2.AddComponent(new player_input.BasicCharacterControllerInput(params, 'mouse'));
    player2.AddComponent(new player_entity.BasicCharacterController(params, 'mouse' , false));
    player2.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid})); // keep track of anything nearby
    //player.AddComponent(new attack_controller.AttackController({timing: 0.7}));
    player2.SetPosition(new THREE.Vector3(30, 30, 0)); //(30, 0, 0)
    
    this._entityManager.Add(player2, 'player2');

    const camera = new entity.Entity();
    camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
            camera: this._camera,
            target: this._entityManager.Get('player')}));
    this._entityManager.Add(camera, 'player-camera');
    
    const npc = new entity.Entity();
      npc.AddComponent(new npc_entity.NPCController({
          camera: this._camera,
          scene: this._scene,
      }));
      
      npc.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      npc.AddComponent(new attack_controller.AttackController({timing: 0.35}));
      // npc.SetPosition(new THREE.Vector3(
      //     (Math.random() * 2 - 1) * 10,
      //     0,
      //     (Math.random() * 2 - 1) * 10));
      npc.SetPosition(new THREE.Vector3(70,0,10))
      this._entityManager.Add(npc, 'npc1');
    
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
    this._sun.position.add(new THREE.Vector3(0, 500, 0)); //(-10, 500, -10)
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

    this._UpdateSun();

    this._entityManager.Update(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new myDemo();
});
