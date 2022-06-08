import * as THREE from '../modules/three.module.js';
import { third_person_camera } from './third-person-camera.js';
import { entity_manager } from './entity-manager.js';
import { player2_entity } from './player2-entity.js'
import { player_entity } from './player-entity.js'
import { entity } from './entity.js';
import { player_input } from './player-input.js';
import { npc_entity } from './npc-entity.js';
import { GLTFLoader } from '../modules/GLTFLoader.js';
import { menu } from './menu.js';
import { gameOver } from './gameOver.js';
import { gameFinished } from './gameFinished.js';

export const level3 = (() => {
  // Level 3 class to load level 3
  class level3 {
    constructor(_APP) {
      this._APP = _APP;
      this._Initialize();
    }

    _Initialize() {
      // Set up WebGL renderer
      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
      this._threejs.outputEncoding = THREE.sRGBEncoding;
      this._threejs.shadowMap.enabled = true;
      this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
      this._threejs.setPixelRatio(window.devicePixelRatio);
      this._threejs.setSize(window.innerWidth, window.innerHeight);
      this._threejs.domElement.id = 'threejs';
      document.getElementById('container').appendChild(this._threejs.domElement);

      // Add a window resize listener 
      window.addEventListener('resize', () => {
        this._OnWindowResize();
      }, false);

      // Cameras
      // Set up main camera
      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 1.0;
      const far = 120.0;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);


      // Initialize the scene
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(0x000000);

      // Add lighting
      const light = new THREE.AmbientLight(0x060606); // soft white light
      this._scene.add(light);

      // Loading manager waits for all models to be loaded before starting the animation loop
      this.loadingManager = new THREE.LoadingManager()
      this.loadingManager.onLoad = () => {
        this._UIInit();
        this._RAF();
      }

      // Adding an audio listener to the scene
      var listener = new THREE.AudioListener();
      this._camera.add(listener);
      // Create a global audio source for the background sound
      this.sound = new THREE.Audio(listener);
      var audioLoader = new THREE.AudioLoader();
      //Load a sound and set it as the Audio object's buffer
      audioLoader.load( '../resources/sounds/Juhani Junkala - Post Apocalyptic Wastelands [Loop Ready].ogg', (buffer) => {
        this.sound.setBuffer( buffer );
        this.sound.setLoop(true);
        this.sound.setVolume(0.5);
        this.sound.play();
        }
      );
      // Create a global audio source for the screaming sound
      this.screamSound = new THREE.Audio(listener);
      var audioLoader1 = new THREE.AudioLoader();
      // Load a sound and set it as the Audio object's buffer
      audioLoader1.load('../resources/sounds/wscream_2.wav', (buffer) => {
        this.screamSound.setBuffer(buffer);
        this.screamSound.setLoop(false);
        this.screamSound.setVolume(0.8);
      });

      // Initializing global variables
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
      this._escapePress = false;
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
        esc: this._escapePress,
        keyFound: this._keyFound,
        keyLight: this._keyLight,
        loadingManager: this.loadingManager,
        openDoor: this.openDoor,
      };

      this.blockeddoor1;
      this.blockeddoor1islocked = false;
      this.blockeddoor1_activationPoint = new THREE.Vector3(39, 12, 40);
      this.blockeddoor2;
      this.blockeddoor2islocked = false;
      this.blockeddoor2_activationPoint = new THREE.Vector3(15, 5, -50);

      // Load all assets
      this._LoadRoom();
      this._LoadPlayer();

      this._previousRAF = null;
    }

    // Initializes the environment
    _LoadRoom() {
      // Load the level
      const mapLoader = new GLTFLoader(this.loadingManager);
      mapLoader.setPath('./resources/Level3/');
      mapLoader.load('level3maplowtriangles.glb', (glb) => {  //level3map1
        this._params.scene.add(glb.scene);
        glb.scene.scale.setScalar(2.5);
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          // Add this object to the "vision" of the corresponding models 
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
          // Add this object to the "vision" of the corresponding models 
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
        });
      });

      //Load the notebook into the map and store the object
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
        glb.scene.name = "level3blockdoor1";
        glb.scene.scale.setScalar(2.5);
        this.blockeddoor1 = glb.scene;
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
        });
      });

      const blockeddoor2Loader = new GLTFLoader(this.loadingManager);
      blockeddoor2Loader.setPath('./resources/Level3/');
      blockeddoor2Loader.load('level3blockdoor2.glb', (glb) => {
        glb.scene.name = "level3blockdoor2";
        glb.scene.scale.setScalar(2.5);
        this.blockeddoor2 = glb.scene;
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
        });
      });

      const blockeddoor3Loader = new GLTFLoader(this.loadingManager);
      blockeddoor3Loader.setPath('./resources/Level3/');
      blockeddoor3Loader.load('level3blockdoor3.glb', (glb) => {
        glb.scene.name = "level3blockdoor3";
        glb.scene.scale.setScalar(2.5);
        this._params.scene.add(glb.scene);
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          // Add this object to the "vision" of the corresponding models 
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);
        });
      });
    }

    // Load the main player (girl), second player (mouse), and the enemy (ghoul) 
    _LoadPlayer() {
      // Initialize the girl
      const player = new entity.Entity();
      player.SetPosition(new THREE.Vector3(-83, -3, -25));
      player.AddComponent(new player_input.BasicCharacterControllerInput(this._params));
      player.AddComponent(new player_entity.BasicCharacterController(this._params, true));
      this._entityManager.Add(player, 'player');
      this._camera.position.copy(player.Position);
      this._camera.position.y += 4;
      this._camera.position.z += 7;
      this._currentLookat = player.Position;

      // Initialize the mouse
      const player2 = new entity.Entity();
      player2.SetPosition(new THREE.Vector3(-80, -3, -25));
      player2.AddComponent(new player_input.BasicCharacterControllerInput(this._params));
      player2.AddComponent(new player2_entity.BasicCharacterController(this._params, false));
      this._entityManager.Add(player2, 'player2');

      // Initialize the main camera and set it to the girl
      const camera = new entity.Entity();
      camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
          camera: this._camera,
          target: this._entityManager.Get('player'),
          cameraVision: this._player2Vision,
          transition: true,
        }));
      this._entityManager.Add(camera, 'player-camera');

      // Loading manager which only allows other enemies to load after the first has been loaded, this allows for cloning    
      this.npcManager = new THREE.LoadingManager();

      // Initialize the enemies
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
          new THREE.Vector3(51, 5, -49),
          new THREE.Vector3(52, 5, 4),
          new THREE.Vector3(49, 5, 4),
          new THREE.Vector3(51, 5, -10),
          new THREE.Vector3(52, 5, -49),
        ];

        this.npc4 = new entity.Entity();
        this._entityManager.Add(this.npc4, 'npc4');
        this.npc4.SetPosition(new THREE.Vector3(-8, -6, -50));
        const points4 = [
          new THREE.Vector3(-18, -6, -50.5),
          new THREE.Vector3(-18, -6, -50),
          new THREE.Vector3(-38, -6, -50),
          new THREE.Vector3(-38, -6, -50.5),
        ];

        setTimeout(() => {
          npc1.AddComponent(new npc_entity.NPCController(this._params, 'npc2', points1, this.npcManager, 12));
          setTimeout(() => {
            this.npc4.AddComponent(new npc_entity.NPCController(this._params, 'npc4', points4, this.npcManager, 5));
          }, 1000);
        }, 1000);


      };
    }

    // Inisializes the UI component
    _UIInit() {
      // bottom midle icons
      this._iconBar = {
        inventory: document.getElementById('icon-bar-inventory'),
        switch: document.getElementById('icon-bar-switch'),
        hint: document.getElementById('icon-bar-hint'),
      };

      // pop up UI
      this._ui = {
        inventory: document.getElementById('inventory'),
        hint: document.getElementById('hint-ui')
      };

      // Setting on click events for the icons
      this._iconBar.inventory.onclick = (m) => { this._OnInventoryClicked(m); };
      this._iconBar.switch.onclick = (m) => { this._OnSwitchClicked(m); };
      this._iconBar.hint.onclick = (m) => { this._HintSetMessage("Hint", "Find the pass code in the office"); this._OnHintClicked() };

      // Setting the visibility 
      this._ui.inventory.style.visibility = 'hidden';
      this._ui.hint.style.visibility = 'hidden';
      this._iconBar.inventory.style.visibility = 'visible';
      this._iconBar.switch.style.visibility = 'visible';
      this._iconBar.hint.style.visibility = 'visible';
    }

    // function setting the message of the hint
    _HintSetMessage(heading, mess) {
      const title = document.getElementById('hint-text-title');
      title.innerText = heading;
      const text = document.getElementById('hint-text');
      text.innerText = mess;
    }

    // Hide all UI on screen
    _HideUI(){
      document.getElementById('icon-bar-inventory').style.visibility = 'hidden'
      document.getElementById('icon-bar-switch').style.visibility = 'hidden'
      document.getElementById('inventory').style.visibility = 'hidden'
      document.getElementById('icon-bar-hint').style.visibility = 'hidden'
    }

    // Function toggling the visibility of the hint
    _OnHintClicked(toggle) {
      const visibility = this._ui.hint.style.visibility;
      // console.log(this._autoHint)
      if (typeof toggle == 'undefined') {
        this._ui.hint.style.visibility = (visibility ? '' : 'hidden');
        this._autoHint = !this._autoHint;
        return;
      }

      if (this._autoHint) {
        return;
      }

      if ((toggle && visibility != '') || (!toggle && visibility == '')) {
        this._ui.hint.style.visibility = (visibility ? '' : 'hidden');
      }
    }

    // Switching the controls between girl and mouse
    _OnSwitchClicked() {
      if (this._active) {
        this._entityManager.Get('player').GetComponent("BasicCharacterController").SetActive(false);
      } else {
        this._entityManager.Get('player2').GetComponent("BasicCharacterController").SetActive(false);
      }
    }

    // Function toggling the visibility of the inventory
    _OnInventoryClicked() {
      const visibility = this._ui.inventory.style.visibility;
      // this._ui.inventory.style.visibility = 'hidden';
      this._ui.inventory.style.visibility = (visibility ? '' : 'hidden');
    }

    // Resizing the window
    _OnWindowResize() {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._threejs.setSize(window.innerWidth, window.innerHeight);
    }


    // Animation loop
    _RAF() {
      // Stop loop if the level ends
      if (!this._endGame) {
        // Timeout to restrict the frame per second to ensure enough time 
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
              this.npc4.GetComponent("NPCController")._AddToScene();
            }

            // if (!this.blockeddoor2islocked && this._entityManager.Get('player').Position.distanceTo(this.blockeddoor2_activationPoint) < 3 && this._keyFound){
            //   this._scene.add(this.blockeddoor2);
            //   this.blockeddoor2islocked = true;
            //   this.blockeddoor2.traverse(c => {
            //     this._params.playerVision.push(c);
            //     this._params.player2Vision.push(c);
            //   });
            //   this._entityManager.Delete("npc2");
            //   this._entityManager.Delete("npc3");
            // }

            // open door when activated
            if (this._params.openDoor) {
              if(this._params.keyFound){
                this.mainDoor.position.z += 0.1;
                if (this.mainDoor.position.z > 6) {
                  this._params.openDoor = false;
                }
              }else{
                this._params.openDoor = false;
              }
            }

            // Go to menu page if escape key is pressed
            if(this._params.esc){
              this._HideUI();
              document.getElementById('container').removeChild(document.getElementById('container').lastChild)
              this._APP = new menu.menu( this._APP);
              this.sound.pause();
              this._endGame = true;
            }
            // End game when the girl is seen by an enemy
            if (this._params.playerFound) {
              this._HideUI();
              document.getElementById('container').removeChild(document.getElementById('container').lastChild)
              this._APP = new gameOver.gameOver(3, this._APP);
              this.sound.pause();
              this.screamSound.play();
              this._endGame = true;
              return;
            } 
            // Check if the player has reached the end of the level
            if (this._entityManager.Get('player').Position.distanceTo(this._passPoint) < 5 && this._params.keyFound) {
              this._endGame = true;
              this._HideUI();
              document.getElementById('container').removeChild(document.getElementById('container').lastChild)
              this._APP = new gameFinished.gameFinished( this._APP);
              this.sound.pause();
              return;
            }
            this._RAF();
            this._threejs.render(this._scene, this._camera);
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
  return { level3: level3 };
})();