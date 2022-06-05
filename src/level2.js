import * as THREE from '../modules/three.module.js';
import { third_person_camera } from './third-person-camera.js';
import { entity_manager } from './entity-manager.js';
import { player_entity } from './player-entity.js'
import { player2_entity } from './player2-entity.js'

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
import { levelPassed } from './levelPassed.js';

export const level2 = (() => {

  class level2 {
    constructor(_APP) {
      this._APP = _APP;
      this._Initialize();
    }

    _Initialize() {
      //   level=2;
      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        // autoClear: true
      });
      this._threejs.outputEncoding = THREE.sRGBEncoding;
      // this._threejs.gammaFactor = 2.2;
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
      const far = 1000.0;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(0x000000);
      // this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

      const light = new THREE.AmbientLight(0x020202); // soft white light
      this._scene.add(light);

      this.loadingManager = new THREE.LoadingManager()

      // this.loadingManager.onProgress = function(item , loaded, total){
      //   console.log(item, loaded , total)
      // }

      this.loadingManager.onLoad = () => {
        // console.log(this._loaded)

        // this._loaded = true;
        this._UIInit();
        this._RAF();
      }


      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0x000000,
        }));
      plane.name = "plane"
      plane.receiveShadow = true;
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -20;
      this._scene.add(plane);
      // this._playerVision.push(plane);

      this.mapCamera = new THREE.OrthographicCamera(
        window.innerWidth / -20,		// Left
        window.innerWidth / 20,		// Right
        window.innerHeight / 20,		// Top
        window.innerHeight / -20,	// Bottom
        // window.innerWidth / -2,		// Left
        // window.innerWidth / 2,		// Right
        // window.innerHeight / 2,		// Top
        // window.innerHeight / -2,	// Bottom
        0,            			// Near 
        100);           			// Far 

      // this.mapCamera = new THREE.PerspectiveCamera(
      //   90, aspect , 0.01,500
      // )

      this.mapCamera.up = new THREE.Vector3(0, 0, -1);
      this.mapCamera.lookAt(new THREE.Vector3(0, -1, 0));
      this.mapCamera.position.set(0, 20, -30)  // h = 9  
      // this.mapCamera.position.set(0,20,0);

      this._entityManager = new entity_manager.EntityManager();
      this._active = true;

      this._monsterVision = [];
      this._playerVision = [];
      this._player2Vision = [];
      this._mouseMaxDistance = 30;
      this._keyObject;
      this._doorObject;
      this._doorFrameObject;
      this._playerFound = false;
      this._keyFound = false;
      this._keyLight;
      this._autoHint = false;
      this._endGame = false;
      this._passPoint = new THREE.Vector3(36, 20, -11);
      this._params = {
        camera: this._camera,
        scene: this._scene,
        monsterVision: this._monsterVision,
        playerVision: this._playerVision,
        player2Vision: this._player2Vision,
        mouseMaxDistance: this._mouseMaxDistance,
        keyObject: this._keyObject,
        doorObject: this._doorObject,
        doorFrameObject: this._doorFrameObject,
        entityManager: this._entityManager,
        playerFound: this._playerFound,
        keyFound: this._keyFound,
        keyLight: this._keyLight,
        loadingManager: this.loadingManager,
      };

      var listener = new THREE.AudioListener();
      this._camera.add(listener);

      // create a global audio source
      var sound = new THREE.Audio(listener);

      var audioLoader = new THREE.AudioLoader();

      //Load a sound and set it as the Audio object's buffer
      // audioLoader.load( '../resources/sounds/Juhani Junkala - Post Apocalyptic Wastelands [Loop Ready].ogg', function( buffer ) {
      //   sound.setBuffer( buffer );
      //   sound.setLoop(true);
      //   sound.setVolume(0.5);
      //   sound.play();
      //   },
      //   // onProgress callback
      //   function ( xhr ) {
      //     //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
      //   },

      //   // onError callback
      //   function ( err ) {
      //     console.log( 'An error occured' );
      //   }
      // );

      this._LoadRoom();
      this._LoadPlayer();

      this._previousRAF = null;
    }

    _LoadLights() {

      const posLights = [[-31, 20, -80], [40, 20, 1], [35, 9, -10], [-10, 9, -55]]; //,[ 8,20,-51]
      // console.log(posLights)
      posLights.forEach((posLight) => {
        // console.log(posLight)
        const light = new THREE.PointLight(0xffbb73, 0.1, 100);
        light.position.x = posLight[0];
        light.position.y = posLight[1];
        light.position.z = posLight[2];
        light.castShadow = true;
        this._params.scene.add(light);
        light.shadow.mapSize.width = 512; // default
        light.shadow.mapSize.height = 512; // default
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 100; // default
        light.shadow.bias = -0.005;
        const sphereSize = 1;
        const pointLightHelper = new THREE.PointLightHelper(light, sphereSize);
        this._params.scene.add(pointLightHelper);
      })

      const light2 = new THREE.PointLight(0x09cc09, 0.1, 100);
      light2.position.set(69, 9, -5);
      light2.castShadow = true;
      this._params.scene.add(light2);
      light2.shadow.mapSize.width = 512; // default
      light2.shadow.mapSize.height = 512; // default
      light2.shadow.camera.near = 0.5; // default
      light2.shadow.camera.far = 100; // default
      light2.shadow.bias = -0.005;


      const light3 = new THREE.PointLight(0x09cc09, 0.1, 100);
      light3.position.set(37, 22, -11);
      light3.castShadow = true;
      this._params.scene.add(light3);
      light3.shadow.mapSize.width = 512; // default
      light3.shadow.mapSize.height = 512; // default
      light3.shadow.camera.near = 0.5; // default
      light3.shadow.camera.far = 100; // default
      light3.shadow.bias = -0.005;
    }

    _LoadRoom() {
      const mapLoader = new GLTFLoader(this.loadingManager);
      mapLoader.setPath('./resources/Level2/');
      mapLoader.load('FancyHouse1.glb', (glb) => {

        this._params.scene.add(glb.scene);
        // glb.scene.position.set(0,-2.5,0);
        glb.scene.scale.setScalar(3);
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);
        });
      });

      //Load Key
      const loader = new GLTFLoader(this.loadingManager);
      loader.setPath('./resources/level2/');
      loader.load('key.glb', (glb) => {
        glb.name = 'key'
        glb.scene.scale.setScalar(3);
        this._scene.add(glb.scene);
        this._params.keyObject = glb.scene;

        glb.scene.traverse(c => {
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);

          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });
      });

      let materialArray = [];
      let texture_ft = new THREE.TextureLoader().load('../resources/Level2/skybox/zpos.png');
      let texture_bk = new THREE.TextureLoader().load('../resources/Level2/skybox/zneg.png');
      let texture_up = new THREE.TextureLoader().load('../resources/Level2/skybox/ypos.png');
      let texture_dn = new THREE.TextureLoader().load('../resources/Level2/skybox/yneg.png');
      let texture_rt = new THREE.TextureLoader().load('../resources/Level2/skybox/xpos.png');
      let texture_lf = new THREE.TextureLoader().load('../resources/Level2/skybox/xneg.png');

      materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
      materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
      materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
      materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
      materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
      materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));

      for (let i = 0; i < 6; i++)
        materialArray[i].side = THREE.BackSide;

      let skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
      let skybox = new THREE.Mesh(skyboxGeo, materialArray);
      // skybox.position.set(0,100,0)
      this._scene.add(skybox);


    }


    _LoadPlayer() {

      const player = new entity.Entity();
      player.SetPosition(new THREE.Vector3(-31, 11, -80));
      const quaternionP = new THREE.Quaternion();
      quaternionP.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3);
      player.SetQuaternion(quaternionP);
      player.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'girl'));
      player.AddComponent(new player_entity.BasicCharacterController(this._params, 'girl', true));
      this._entityManager.Add(player, 'player');
      this._camera.position.copy(player.Position);
      this._camera.position.y += 4;
      this._camera.position.z += 7;
      this._currentLookat = player.Position;


      const player2 = new entity.Entity();
      player2.SetPosition(new THREE.Vector3(-31, 11, -84));
      player2.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'mouse'));
      player2.AddComponent(new player2_entity.BasicCharacterController(this._params, 'mouse', false));
      this._entityManager.Add(player2, 'player2');

      const camera = new entity.Entity();
      camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
          camera: this._camera,
          target: this._entityManager.Get('player'),
          cameraVision: this._player2Vision,
          transition: true,
        }));
      this._entityManager.Add(camera, 'player-camera');

      this.npcManager = new THREE.LoadingManager();

      const npc = new entity.Entity();
      npc.SetPosition(new THREE.Vector3(-29, 11, -50));
      const quaternionM1 = new THREE.Quaternion();
      quaternionM1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      npc.SetQuaternion(quaternionM1);
      const points = [
        new THREE.Vector3(-26, 11, -43),
        new THREE.Vector3(6, 11, -48),
        new THREE.Vector3(-13, 11, -26),
        new THREE.Vector3(-13, 11, 0),
        new THREE.Vector3(1, 11, -7),
      ];
      npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points, this.npcManager, 12));
      this._entityManager.Add(npc, 'npc1');

      this.npcManager.onLoad = () => {

        const npc2 = new entity.Entity();
        this._entityManager.Add(npc2, 'npc3');

        npc2.SetPosition(new THREE.Vector3(0, 0, 0));
        const points2 = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(5, 0, 25),
          new THREE.Vector3(34, 0, 29),
          new THREE.Vector3(43, 0, 1),
        ];
        npc2.AddComponent(new npc_entity.NPCController(this._params, 'npc3', points2, this.npcManager, 15));

        const npc1 = new entity.Entity();
        this._entityManager.Add(npc1, 'npc2');

        npc1.SetPosition(new THREE.Vector3(50, 11, -30));
        const points1 = [
          new THREE.Vector3(50, 11, -30),
          new THREE.Vector3(68, 11, -20),
          new THREE.Vector3(68, 11, 24),
          new THREE.Vector3(65, 11, -19),
        ];

        setTimeout(() => {
          npc1.AddComponent(new npc_entity.NPCController(this._params, 'npc2', points1, this.npcManager, 12));
        }, 1000);
      };



    }

    _UIInit() {
      this._iconBar = {
        inventory: document.getElementById('icon-bar-inventory'),
        switch: document.getElementById('icon-bar-quests'),
        hint: document.getElementById('icon-bar-hint'),
      };

      this._ui = {
        inventory: document.getElementById('inventory'),
        hint: document.getElementById('hint-ui')
      };

      this._iconBar.inventory.onclick = (m) => { this._OnInventoryClicked(m); };
      this._iconBar.switch.onclick = (m) => { this._OnSwitchClicked(m); };
      this._iconBar.hint.onclick = (m) => { this._HintSetMessage("Hint", "Find a gap to collect the key and escape on the roof"); this._OnHintClicked() };

      this._ui.inventory.style.visibility = 'hidden';
      this._ui.hint.style.visibility = 'hidden';

      this._iconBar.inventory.style.visibility = 'visible';
      this._iconBar.switch.style.visibility = 'visible';
      this._iconBar.hint.style.visibility = 'visible';

    }

    _OnSwitchClicked() {
      if (this._active) {
        this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(false);
      } else {
        this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(false);
      }

    }

    _HintSetMessage(heading, mess) {
      const title = document.getElementById('hint-text-title');
      title.innerText = heading;

      const text = document.getElementById('hint-text');
      text.innerText = mess;
    }

    _OnHintClicked(toggle) {
      const visibility = this._ui.hint.style.visibility;

      if (typeof toggle == 'undefined') {
        this._ui.hint.style.visibility = (visibility ? '' : 'hidden');
        this._autoHint = !this._autoHint;
        return;
      }

      if (!this._autoHint) {
        return;
      }

      if ((toggle && visibility != '') || (!toggle && visibility == '')) {
        this._ui.hint.style.visibility = (visibility ? '' : 'hidden');
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

    // _UpdateSun() {
    //   const player = this._entityManager.Get('player');
    //   const pos = player._position;

    //   this._sun.position.copy(pos);
    //   this._sun.position.add(new THREE.Vector3(-10, 500, -10));
    //   this._sun.target.position.copy(pos);
    //   this._sun.updateMatrixWorld();
    //   this._sun.target.updateMatrixWorld();
    // }



    _RAF() {
      if (!this._endGame) {
        setTimeout(() => {
          requestAnimationFrame((t) => {

            if (this._previousRAF === null) {
              this._previousRAF = t;
            }
            // controls which character the camera will follow
            if (!this._entityManager.Get('player').GetComponent("BasicCharacterController").GetActive() && !this._entityManager.Get('player2').GetComponent("BasicCharacterController").GetActive()) {
              if (this._active) {
                this._active = false;
                this._entityManager.Get('player2').GetComponent("BasicCharacterControllerInput").ResetR();
                this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(true);
                this._entityManager.Get('player-camera').GetComponent("ThirdPersonCamera").ChangePlayer({
                  camera: this._camera,
                  target: this._entityManager.Get('player2'),
                  cameraVision: this._player2Vision,
                  transition: true,
                });
              } else {
                this._active = true;
                this._entityManager.Get('player').GetComponent("BasicCharacterControllerInput").ResetR();
                this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(true);
                this._entityManager.Get('player-camera').GetComponent("ThirdPersonCamera").ChangePlayer({
                  camera: this._camera,
                  target: this._entityManager.Get('player'),
                  cameraVision: this._player2Vision,
                  transition: true,
                });
              }
            }

            if (this._params.playerFound) {
              document.getElementById('icon-bar-inventory').style.visibility = 'hidden'
              document.getElementById('icon-bar-quests').style.visibility = 'hidden'
              document.getElementById('inventory').style.visibility = 'hidden'
              document.getElementById('icon-bar-hint').style.visibility = 'hidden'
              document.getElementById('container').removeChild(document.getElementById('container').lastChild)
              this._APP = new gameOver.gameOver(2, this._APP);
              this._endGame = true;
              return;
            }

            if (this._entityManager.Get('player').Position.distanceTo(this._passPoint) < 5) {
              if (this._params.keyFound) {
                this._endGame = true;
                document.getElementById('icon-bar-inventory').style.visibility = 'hidden'
                document.getElementById('icon-bar-quests').style.visibility = 'hidden'
                document.getElementById('inventory').style.visibility = 'hidden'
                document.getElementById('icon-bar-hint').style.visibility = 'hidden'
                document.getElementById('container').removeChild(document.getElementById('container').lastChild)
                this._APP = new levelPassed.levelPassed(2, this._APP);
                return;
              } else {
                this._HintSetMessage("Hint", "You need to find the key first! Tip: go swimming!");
                this._OnHintClicked(true);

              }
            } else {
              this._OnHintClicked(false);
            }
            if (this._entityManager.Get('player').Position.y > 5) {
              this.mapCamera.position.y = 20;
            } else {
              this.mapCamera.position.y = 8;
            }
            this._RAF();
            this._threejs.setViewport(0, 0, window.innerWidth, window.innerHeight);
            this._threejs.clear();
            this._threejs.render(this._scene, this._camera);

            this._threejs.clearDepth();
            this._threejs.setScissorTest(true);
            this._threejs.setScissor(
              0,
              0,
              window.innerWidth / 6,
              window.innerWidth / 6,
            )

            this._threejs.setViewport(0, 0, window.innerWidth / 6, window.innerWidth / 6);
            this._threejs.render(this._scene, this.mapCamera);
            this._threejs.setScissorTest(false);
            this._Step(t - this._previousRAF);
            this._previousRAF = t;
          });
        }, 1000 / 30);
      }
    }

    _Step(timeElapsed) {
      const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
      this._entityManager.Update(timeElapsedS);
    }
  }
  return { level2: level2 };
})();