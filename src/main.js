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


class level1 {
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
    const far = 100.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000000);
    // this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

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
    this._active = true;

    this._monsterVision = [];
    this._playerVision = [];
    this._player2Vision = [];

    this._playerVision.push(plane);
    this._keyObject;
    this._playerFound = false;
    this._keyFound = false;
    this._params = {
      camera: this._camera,
      scene: this._scene,
      monsterVision: this._monsterVision,
      playerVision: this._playerVision,
      player2Vision: this._player2Vision,
      keyObject: this._keyObject,
      entityManager: this._entityManager,
      playerFound: this._playerFound,
      keyFound: this._keyFound,
    };

    var listener = new THREE.AudioListener();
    this._camera.add( listener );
  
    // create a global audio source
    var sound = new THREE.Audio( listener );
  
    var audioLoader = new THREE.AudioLoader();
  
    //Load a sound and set it as the Audio object's buffer
    audioLoader.load( '../resources/sounds/Juhani Junkala - Post Apocalyptic Wastelands [Loop Ready].ogg', function( buffer ) {
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

    this._LoadSky();
    this._LoadRoom();
    this._LoadPlayer();

    this._UIInit();
    this._previousRAF = null;
    this._RAF();
  }
  

  _LoadSky() {
    const hemiLight = new THREE.HemisphereLight(0x000000, 0x000000, 0.01);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this._scene.add(hemiLight);

    const uniforms = {
      "topColor": { value: new THREE.Color(0x000000) },
      "bottomColor": { value: new THREE.Color(0xffffff) },
      "offset": { value: 33 },
      "exponent": { value: 0.6 }
    };
    uniforms["topColor"].value.copy(hemiLight.color);

    // this._scene.fog.color.copy(uniforms["bottomColor"].value);

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

  _LoadLights(){
    const light = new THREE.PointLight( 0xffbb73, 0.1, 100 );
    light.position.set( 0, 11, -20 );
    light.castShadow = true;
    this._params.scene.add( light );
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 500; // default
    light.shadow.bias = -0.005;

    const sphereSize = 1;
    const pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
    this._params.scene.add( pointLightHelper );



    const light1 = new THREE.PointLight( 0xffbb73, 0.1, 100 );
    light1.position.set( 0, 11, -50 );
    light1.castShadow = true;
    this._params.scene.add( light1 );
    light1.shadow.mapSize.width = 512; // default
    light1.shadow.mapSize.height = 512; // default
    light1.shadow.camera.near = 0.5; // default
    light1.shadow.camera.far = 500; // default
    light1.shadow.bias = -0.005;

    const sphereSize1 = 1;
    const pointLightHelper1 = new THREE.PointLightHelper( light1, sphereSize1 );
    this._params.scene.add( pointLightHelper1 );

    const light2 = new THREE.PointLight( 0x09cc09, 0.1, 100 );
    light2.position.set( 25, 11, -50 );
    light2.castShadow = true;
    this._params.scene.add( light2 );
    light2.shadow.mapSize.width = 512; // default
    light2.shadow.mapSize.height = 512; // default
    light2.shadow.camera.near = 0.5; // default
    light2.shadow.camera.far = 500; // default
    light2.shadow.bias = -0.005;

    const sphereSize2 = 1;
    const pointLightHelper2 = new THREE.PointLightHelper( light2, sphereSize2 );
    this._params.scene.add( pointLightHelper2 );

    const light3 = new THREE.PointLight( 0xffbb73, 0.1, 100 );
    light3.position.set( -25, 11, -50 );
    light3.castShadow = true;
    this._params.scene.add( light3 );
    light3.shadow.mapSize.width = 512; 
    light3.shadow.mapSize.height = 512; 
    light3.shadow.camera.near = 0.5; 
    light3.shadow.camera.far = 500; 
    light3.shadow.bias = -0.005;

    const sphereSize3 = 1;
    const pointLightHelper3 = new THREE.PointLightHelper( light3, sphereSize3 );
    this._params.scene.add( pointLightHelper3 );
  
    // const spotLight    = new THREE.SpotLight( 0x090909 , 8 , 200 , Math.PI/10 )
    // spotLight.position.set(25, 13, -50)
    // spotLight.exponent    = 30
    // spotLight.intensity    = 0.
    // spotLight.target.position.set(25, 12, -52);
    // spotLight.target.updateMatrixWorld();
    // this._params.scene.add( spotLight  )
    // // this._params.scene.add( spotLight.target );

    const light4 = new THREE.PointLight( 0xffbb73, 0.1, 100 );
    light4.position.set( -20,25,-40 );
    light4.castShadow = true;
    this._params.scene.add( light4 );
    light4.shadow.mapSize.width = 512;
    light4.shadow.mapSize.height = 512; 
    light4.shadow.camera.near = 0.5; 
    light4.shadow.camera.far = 100; 
    light4.shadow.bias = -0.005;

    const sphereSize4 = 1;
    const pointLightHelper4 = new THREE.PointLightHelper( light4, sphereSize4 );
    this._params.scene.add( pointLightHelper4 );
  }

  _LoadRoom(){
    const mapLoader = new GLTFLoader();
    mapLoader.setPath('./resources/haunted_house/');
    mapLoader.load('map7.glb', (glb) => {

        this._params.scene.add(glb.scene);
        glb.scene.scale.setScalar(1);
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);
        });
      });

    
    this._LoadLights();

      

    const mirrorBack1 = new Reflector(
      new THREE.PlaneBufferGeometry(15, 10),
      {
          color: new THREE.Color(0x7f7f7f),
          textureWidth: window.innerWidth * window.devicePixelRatio,
          textureHeight: window.innerHeight * window.devicePixelRatio
      }
    )
    mirrorBack1.position.set(-2,18,-50 );
    mirrorBack1.rotateY(-Math.PI/4)
    this._scene.add(mirrorBack1);
    this._playerVision.push(mirrorBack1)

    //Load Key
    const loader = new FBXLoader();
    loader.setPath('./resources/key/');
    loader.load('key.fbx', (fbx) => {
      fbx.name = 'key'
      fbx.position.set(28,6,-9);
      fbx.scale.setScalar(2);
      this._scene.add(fbx);
      this._params.keyObject = fbx;
      fbx.traverse(c => {
        // c.castShadow = true;
        // c.receiveShadow = true;
        // c.metalness = 1

        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });
    });

    console.log(this._scene)

    // const loader1 = new FBXLoader();
    // loader1.setPath('./resources/Level1Rooms/');
    // loader1.load('Entrance_Door.fbx', (fbx) => {
    //   fbx.name = 'door'
    //   fbx.position.copy(new THREE.Vector3(3, 5, -9));
    //   fbx.scale.setScalar(0.04);
    //   this._scene.add(fbx);
    //   this._params.keyObject = fbx;
    //   fbx.traverse(c => {
    //     c.castShadow = true;
    //     c.receiveShadow = true;
    //     c.metalness = 1

    //     if (c.material && c.material.map) {
    //       c.material.map.encoding = THREE.sRGBEncoding;
    //     }
    //   });
    // });


    const keyLight= new THREE.PointLight(0xffd700, 1, 2);
    keyLight.position.set(28,6,-9);
    this._scene.add(keyLight)

    // const sphereSize = 1;
    // const pointLightHelper = new THREE.PointLightHelper( keyLight, sphereSize );
    // this._scene.add( pointLightHelper );

  }


  _LoadPlayer() {

    const player = new entity.Entity();
    player.SetPosition(new THREE.Vector3(-10,20,-23));
    const quaternionP = new THREE.Quaternion();
    quaternionP.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI );
    player.SetQuaternion(quaternionP);
    player.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'girl'));
    player.AddComponent(new player_entity.BasicCharacterController(this._params, 'girl' , true));
    this._entityManager.Add(player, 'player');

    const player2 = new entity.Entity();
    player2.SetPosition(new THREE.Vector3(-7,20,-23));
    player2.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'mouse'));
    player2.AddComponent(new player_entity.BasicCharacterController(this._params, 'mouse' , false));
    this._entityManager.Add(player2, 'player2');

    const camera = new entity.Entity();
    camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
            camera: this._camera,
            target: this._entityManager.Get('player'), 
            cameraVision : this._player2Vision,
            transition: true,
          }));
    this._entityManager.Add(camera, 'player-camera');

        const npc = new entity.Entity();
    npc.SetPosition(new THREE.Vector3(-35,14,-30));
    const quaternionM1 = new THREE.Quaternion();
    quaternionM1.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI );
    npc.SetQuaternion(quaternionM1);
    const points = [ 
      new THREE.Vector3( -33,15,-33 ), 
      new THREE.Vector3( -39, 15, -34 ),
      new THREE.Vector3( -36, 15,  -56),
      new THREE.Vector3( -33, 15, -53 ),
      ];
    npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points));
    this._entityManager.Add(npc, 'npc1');

    // const npc = new entity.Entity();
    // npc.SetPosition(new THREE.Vector3(3, 2.5, -20));
    // npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points1));
    // this._entityManager.Add(npc, 'npc1');



    const npc1 = new entity.Entity();
    npc1.SetPosition(new THREE.Vector3(3, 2.5, -20));
    const points1 = [ 
      new THREE.Vector3( 0, 2.5, -22 ), 
      new THREE.Vector3( 35, 2.5, -22 ),
      new THREE.Vector3( 35, 2.5, -24 ),
      new THREE.Vector3( 0, 2.5, -20 ),
      new THREE.Vector3( -2, 2.5, -35 ),
      new THREE.Vector3( 2, 2.5, -35 ),

      ];
    npc1.AddComponent(new npc_entity.NPCController(this._params , 'npc2', points1));
    this._entityManager.Add(npc1, 'npc2');
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
      this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(false);
    }else{
      this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(false);
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
    var Req = requestAnimationFrame((t) => {
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
            target: this._entityManager.Get('player2'),
            cameraVision : this._player2Vision,
            transition: true,
          });
        }else{
          this._active = true;
          this._entityManager.Get('player').GetComponent("BasicCharacterControllerInput").ResetR();
          this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(true);
          this._entityManager.Get('player-camera').GetComponent("ThirdPersonCamera").ChangePlayer({
            camera: this._camera,
            target: this._entityManager.Get('player'),
            cameraVision : this._playaer2Vision, 
            transition: true,
          });
        }
      }


      if(!this._params.playerFound){//if(!this._params.playerFound){
        this._RAF();
        this._threejs.render(this._scene, this._camera);
        this._Step(t - this._previousRAF);
        this._previousRAF = t;
      }else{
        // console.log(this._params.playerFound);
        cancelAnimationFrame(Req);
        document.getElementById('container').removeChild(document.getElementById('container').lastChild)
        _APP = new level1();
        return;
      }
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    this._entityManager.Update(timeElapsedS);
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new level1();
});


class level2 {
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
    this._active = true;

    this._monsterVision = [];
    this._playerVision = [];
    this._player2Vision = [];

    this._playerVision.push(plane);
    this._keyObject;
    this._playerFound = false;
    this._keyFound = false;
    this._params = {
      camera: this._camera,
      scene: this._scene,
      monsterVision: this._monsterVision,
      playerVision: this._playerVision,
      player2Vision: this._player2Vision,
      keyObject: this._keyObject,
      entityManager: this._entityManager,
      playerFound: this._playerFound,
      keyFound: this._keyFound,
    };

    var listener = new THREE.AudioListener();
    this._camera.add( listener );
  
    // create a global audio source
    var sound = new THREE.Audio( listener );
  
    var audioLoader = new THREE.AudioLoader();
  
    //Load a sound and set it as the Audio object's buffer
    audioLoader.load( '../resources/sounds/Juhani Junkala - Post Apocalyptic Wastelands [Loop Ready].ogg', function( buffer ) {
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

    this._LoadSky();
    this._LoadRoom();
    this._LoadPlayer();

    this._UIInit();
    this._previousRAF = null;
    this._RAF();
  }
  

  _LoadSky() {
    const hemiLight = new THREE.HemisphereLight(0xffbb73, 0xFFFFFFF, 0.05);
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
    const Hloader = new FBXLoader();
    Hloader.setPath('./resources/level2/');
    Hloader.load('Luxury_House.fbx', (fbx) => {
          fbx.name = 'map'
          this._target = fbx;
          this._target.scale.setScalar(0.03);
          this._scene.add(this._target);
          this._target.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.encoding = THREE.sRGBEncoding;
            }
            this._params.playerVision.push(c)

          });


        });

      const light = new THREE.PointLight( 0xffbb73, 0.1, 100 );
      light.position.set( 0, 13, -20 );
      light.castShadow = true;
      this._params.scene.add( light );
      light.shadow.mapSize.width = 512; // default
      light.shadow.mapSize.height = 512; // default
      light.shadow.camera.near = 0.5; // default
      light.shadow.camera.far = 500; // default
      light.shadow.bias = -0.005;

      const sphereSize = 1;
      const pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
      this._params.scene.add( pointLightHelper );

    const mirrorBack1 = new Reflector(
      new THREE.PlaneBufferGeometry(20, 20),
      {
          color: new THREE.Color(0x7f7f7f),
          textureWidth: window.innerWidth * window.devicePixelRatio,
          textureHeight: window.innerHeight * window.devicePixelRatio
      }
    )
    mirrorBack1.position.set(3, 10, -30);
    this._scene.add(mirrorBack1);
    this._playerVision.push(mirrorBack1)

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
        c.metalness = 1

        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });
    });


    const spotLight = new THREE.SpotLight( 0xffffff , 1 , 10 , Math.PI/10 );
    spotLight.position.set( 3, 10, -15);

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024/10;
    spotLight.shadow.mapSize.height = 1024/10;
    spotLight.shadow.bias = -0.005;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 20;
    spotLight.shadow.camera.fov = 1;

    this._scene.add( spotLight );

    const spotLightHelper = new THREE.SpotLightHelper( spotLight );
    this._scene.add( spotLightHelper );
  }


  _LoadPlayer() {

    const player = new entity.Entity();
    player.SetPosition(new THREE.Vector3(0, 3, -15));
    player.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'girl'));
    player.AddComponent(new player_entity.BasicCharacterController(this._params, 'girl' , true));
    this._entityManager.Add(player, 'player');

    const player2 = new entity.Entity();
    player2.SetPosition(new THREE.Vector3(3, 3, -15));
    player2.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'mouse'));
    player2.AddComponent(new player_entity.BasicCharacterController(this._params, 'mouse' , false));
    this._entityManager.Add(player2, 'player2');

    const camera = new entity.Entity();
    camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
            camera: this._camera,
            target: this._entityManager.Get('player'), 
            cameraVision : this._player2Vision,
            transition: true,
          }));
    this._entityManager.Add(camera, 'player-camera');

    const npc = new entity.Entity();
    npc.SetPosition(new THREE.Vector3(3, 2.5, -20));
    npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1'));
    this._entityManager.Add(npc, 'npc1');

    const npc1 = new entity.Entity();
    npc1.SetPosition(new THREE.Vector3(-3, 2.5, -20));
    npc1.AddComponent(new npc_entity.NPCController(this._params , 'npc2'));
    this._entityManager.Add(npc1, 'npc2');
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
      this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(false);
    }else{
      this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(false);
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
    var Req = requestAnimationFrame((t) => {
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
            target: this._entityManager.Get('player2'),
            cameraVision : this._player2Vision,
            transition: true,
          });
        }else{
          this._active = true;
          this._entityManager.Get('player').GetComponent("BasicCharacterControllerInput").ResetR();
          this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(true);
          this._entityManager.Get('player-camera').GetComponent("ThirdPersonCamera").ChangePlayer({
            camera: this._camera,
            target: this._entityManager.Get('player'),
            cameraVision : this._player2Vision, 
            transition: true,
          });
        }
      }

      // if(!this._params.playerFound){
        this._RAF();
        this._threejs.render(this._scene, this._camera);
        this._Step(t - this._previousRAF);
        this._previousRAF = t;
      // }else{
      //   // console.log(this._params.playerFound);
      //   cancelAnimationFrame(Req);
      //   document.getElementById('container').removeChild(document.getElementById('container').lastChild)
      //   _APP = new level1();
      //   return;
      // }
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    this._entityManager.Update(timeElapsedS);
  }
}
