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

export const level3 = (() => {

  class level3 {
    constructor() {
      this._Initialize();
    }


    _Initialize() {
      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        // autoClear: true
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
      const far = 120.0;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);


      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(0x000000);
      // this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

      const light = new THREE.AmbientLight(0x060605); // soft white light
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

      this._entityManager = new entity_manager.EntityManager();
      this._active = true;

      this._monsterVision = [];
      this._playerVision = [];
      this._player2Vision = [];

      this._keyObject;
      this._doorObject;
      this._doorFrameObject;
      this._playerFound = false;
      this._keyFound = false;
      this._keyLight;
      this._endGame = false;
      this.openDoor = false;
      this._passPoint = new THREE.Vector3(-92, -17, 13);
      this._params = {
        camera: this._camera,
        scene: this._scene,
        monsterVision: this._monsterVision,
        playerVision: this._playerVision,
        player2Vision: this._player2Vision,
        keyObject: this._keyObject,
        doorObject: this._doorObject,
        doorFrameObject: this._doorFrameObject,
        entityManager: this._entityManager,
        playerFound: this._playerFound,
        keyFound: this._keyFound,
        keyLight: this._keyLight,
        loadingManager: this.loadingManager,
        openDoor: this.openDoor,
      };

      this.blockeddoor1;
      this.blockeddoor1islocked = false;
      this.blockeddoor1_activationPoint = new THREE.Vector3(36.8, 12, 40);

      this.blockeddoor2;
      this.blockeddoor2islocked = false;
      this.blockeddoor2_activationPoint = new THREE.Vector3(15, 5, -50);


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
      //   function ( err ) {dwaaaa
      //     console.log( 'An error occured' );
      //   }
      // );

      // this._LoadSky();
      this._LoadRoom();
      this._LoadPlayer();

      this._previousRAF = null;
      // this._RAF();
      // console.log("Textures in Memory", this._threejs.info.memory.textures)
    }


    //   _LoadSky() {
    //     const hemiLight = new THREE.HemisphereLight(0x210606, 0x210606, 0.01);
    //     hemiLight.color.setHSL(0, 0.69, 0.08);
    //     hemiLight.groundColor.setHSL(0, 0.69, 0.08);
    //     this._scene.add(hemiLight);

    //     const uniforms = {
    //       "topColor": { value: new THREE.Color(0x0077ff) },
    //       "bottomColor": { value: new THREE.Color(0xffffff) },
    // //       "topColor": { value: new THREE.Color(0x210606) },
    // //       "bottomColor": { value: new THREE.Color(0x210606) },
    // // >>>>>>> 929fd97a243c8a0d8f0d29e250dc28c7e7b517b1
    //       "offset": { value: 33 },
    //       "exponent": { value: 0.6 }
    //     };
    //     uniforms["topColor"].value.copy(hemiLight.color);

    //     this._scene.fog.color.copy(uniforms["bottomColor"].value);

    //     // this._scene.fog.color.copy(uniforms["bottomColor"].value);

    //     const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    //     const skyMat = new THREE.ShaderMaterial({
    //         uniforms: uniforms,
    //         vertexShader: _VS,
    //         fragmentShader: _FS,
    //         side: THREE.BackSide
    //     });

    //     const sky = new THREE.Mesh(skyGeo, skyMat);
    //     this._scene.add(sky);
    //   }

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
      // const spotLight    = new THREE.SpotLight( 0x09dd09 , 8 , 200 , Math.PI/10 )
      // spotLight.position.set( 30,10,-75)
      // spotLight.exponent    = 30
      // spotLight.intensity    = 5
      // spotLight.target.position.set(30,0,-75)
      // this._params.scene.add( spotLight.target );

      // this._params.scene.add( spotLight  )

    }

    _LoadRoom() {
      const mapLoader = new GLTFLoader(this.loadingManager);
      mapLoader.setPath('./resources/Level3/');
      mapLoader.load('level3map.glb', (glb) => {
        this._params.scene.add(glb.scene);
        // glb.scene.position.set(0,-2.5,0);
        glb.scene.scale.setScalar(2.5);
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);
        });
      });

      const doorLoader = new GLTFLoader(this.loadingManager);
      doorLoader.setPath('./resources/Level3/');
      doorLoader.load('map3door.glb', (glb) => {
        this._params.scene.add(glb.scene);
        this.mainDoor = glb.scene;
        glb.scene.scale.setScalar(2.5);
        glb.scene.traverse(c => {
          c.name = "map3door";
          c.receiveShadow = true;
          c.castShadow = true;
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          // this._params.monsterVision.push(c);
        });
      });


      const noteBookLoader = new GLTFLoader(this.loadingManager);
      noteBookLoader.setPath('./resources/Level3/');
      noteBookLoader.load('level3notebook.glb', (glb) => {
        this._params.scene.add(glb.scene);
        glb.scene.scale.setScalar(2.5);
        this._params.keyObject = glb.scene;
      });


      const blockeddoorLoader = new GLTFLoader(this.loadingManager);
      blockeddoorLoader.setPath('./resources/Level3/');
      blockeddoorLoader.load('level3blockdoor1.glb', (glb) => {
        // this._params.scene.add(glb.scene);
        // glb.scene.position.set(0,-2.5,0);
        glb.scene.name = "level3blockdoor1";
        glb.scene.scale.setScalar(2.5);
        this.blockeddoor1 = glb.scene;
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          // this._params.playerVision.push(c);
          // this._params.player2Vision.push(c);
          // this._params.monsterVision.push(c);
        });
      });

      const blockeddoor2Loader = new GLTFLoader(this.loadingManager);
      blockeddoor2Loader.setPath('./resources/Level3/');
      blockeddoor2Loader.load('level3blockdoor2.glb', (glb) => {
        // this._params.scene.add(glb.scene);
        // glb.scene.position.set(0,-2.5,0);
        glb.scene.name = "level3blockdoor2";
        glb.scene.scale.setScalar(2.5);
        this.blockeddoor2 = glb.scene;
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          // this._params.playerVision.push(c);
          // this._params.player2Vision.push(c);
          // this._params.monsterVision.push(c);
        });
      });

      const blockeddoor3Loader = new GLTFLoader(this.loadingManager);
      blockeddoor3Loader.setPath('./resources/Level3/');
      blockeddoor3Loader.load('level3blockdoor3.glb', (glb) => {
        // this._params.scene.add(glb.scene);
        // glb.scene.position.set(0,-2.5,0);
        glb.scene.name = "level3blockdoor3";
        glb.scene.scale.setScalar(2.5);
        this._params.scene.add(glb.scene);

        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);
        });
      });

    }


    _LoadPlayer() {

      const player = new entity.Entity();
      player.SetPosition(new THREE.Vector3(-83, -3, -20));
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
      player2.SetPosition(new THREE.Vector3(-83, -3, -23));
      player2.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'mouse'));
      player2.AddComponent(new player_entity.BasicCharacterController(this._params, 'mouse', false));
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
      npc.SetPosition(new THREE.Vector3(-54, 19, 32));
      const quaternionM1 = new THREE.Quaternion();
      quaternionM1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      npc.SetQuaternion(quaternionM1);
      const points = [
        new THREE.Vector3(-54, 20, 32),
        new THREE.Vector3(-24, 20, 33),
        new THREE.Vector3(-23, 20, 52),
        new THREE.Vector3(-23, 20, 47),
        new THREE.Vector3(-23, 20, 52),
        new THREE.Vector3(-24, 20, 33),
        new THREE.Vector3(-54, 20, 32),
        new THREE.Vector3(-54, 20, 46),
        new THREE.Vector3(-54, 20, 32),

      ];
      npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points, this.npcManager, 13));
      this._entityManager.Add(npc, 'npc1');

      this.npcManager.onLoad = () => {

        const npc2 = new entity.Entity();
        this._entityManager.Add(npc2, 'npc3');

        npc2.SetPosition(new THREE.Vector3(59, 12, 40));
        const points2 = [
          new THREE.Vector3(59, 13, 40),
          new THREE.Vector3(59, 13, -19),
          new THREE.Vector3(58, 13, 40),

        ];
        npc2.AddComponent(new npc_entity.NPCController(this._params, 'npc3', points2, this.npcManager, 13));

        const npc1 = new entity.Entity();
        this._entityManager.Add(npc1, 'npc2');
        npc1.SetPosition(new THREE.Vector3(52, 4, -49));
        const points1 = [
          new THREE.Vector3(52, 5, -49),
          new THREE.Vector3(51.5, 5, -49),
          new THREE.Vector3(52, 5, 2),
          new THREE.Vector3(51.5, 5, 2),
          new THREE.Vector3(52, 5, -49),

        ];

        const npc4 = new entity.Entity();
        this._entityManager.Add(npc4, 'npc4');
        npc4.SetPosition(new THREE.Vector3(-8, -6, -50));
        const points4 = [
          new THREE.Vector3(-18, -6, -50.5),
          new THREE.Vector3(-18, -6, -50),
          new THREE.Vector3(-38, -6, -50),
          new THREE.Vector3(-38, -6, -50.5),

        ];

        setTimeout(() => {
          npc1.AddComponent(new npc_entity.NPCController(this._params, 'npc2', points1, this.npcManager, 12));
          setTimeout(() => {
            npc4.AddComponent(new npc_entity.NPCController(this._params, 'npc4', points4, this.npcManager, 5));
          }, 1000);
        }, 1000);


      };
    }

    _UIInit() {
      this._iconBar = {
        inventory: document.getElementById('icon-bar-inventory'),
        switch: document.getElementById('icon-bar-quests'),
      };

      this._ui = {
        inventory: document.getElementById('inventory'),
        quests: document.getElementById('quest-journal'),
      };

      this._iconBar.inventory.onclick = (m) => { this._OnInventoryClicked(m); };
      this._iconBar.switch.onclick = (m) => { this._OnSwitchClicked(m); };
      this._ui.inventory.style.visibility = 'hidden';
      this._iconBar.inventory.style.visibility = 'visible';
      this._iconBar.switch.style.visibility = 'visible';

    }

    _OnSwitchClicked() {
      if (this._active) {
        this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(false);
      } else {
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

            if (!this.blockeddoor1islocked && this._entityManager.Get('player').Position.distanceTo(this.blockeddoor1_activationPoint) < 5) {
              this._scene.add(this.blockeddoor1);
              this.blockeddoor1islocked = true;
              this.blockeddoor1.traverse(c => {
                this._params.playerVision.push(c);
                this._params.player2Vision.push(c);
              });
              this._entityManager.Delete("npc1");
            }

            if (!this.blockeddoor2islocked && this._entityManager.Get('player').Position.distanceTo(this.blockeddoor2_activationPoint) < 3 && this._keyFound) {
              this._scene.add(this.blockeddoor2);
              this.blockeddoor2islocked = true;
              this.blockeddoor2.traverse(c => {
                this._params.playerVision.push(c);
                this._params.player2Vision.push(c);
              });
              this._entityManager.Delete("npc2");
              this._entityManager.Delete("npc3");
            }

            // open door when activated
            if (this._params.openDoor) {
              this.mainDoor.position.z += 0.1;
              if (this.mainDoor.position.z > 6) {
                this._params.openDoor = false;
              }
            }

            if (!this._params.playerFound) {
              this._RAF();
              this._threejs.render(this._scene, this._camera);
              this._Step(t - this._previousRAF);
              this._previousRAF = t;
            } else {
              document.getElementById('container').removeChild(document.getElementById('container').lastChild)
              document.getElementById('icon-bar-inventory').style.visibility = 'hidden'
              document.getElementById('icon-bar-quests').style.visibility = 'hidden'
              document.getElementById('inventory').style.visibility = 'hidden'
              _APP = new gameOver.gameOver(3);
              this._endGame = true;
              return;
            }

            if (this._entityManager.Get('player').Position.distanceTo(this._passPoint) < 5 && this._params.keyFound) {
              this._endGame = true;
              document.getElementById('container').removeChild(document.getElementById('container').lastChild)
              document.getElementById('icon-bar-inventory').style.visibility = 'hidden'
              document.getElementById('icon-bar-quests').style.visibility = 'hidden'
              document.getElementById('inventory').style.visibility = 'hidden'
              _APP = new menu.menu();
              return;
            }
          });
        }, 1000 / 30);
      }
    }

    _Step(timeElapsed) {
      const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
      this._entityManager.Update(timeElapsedS);
    }
  }
  return { level3: level3 };
})();