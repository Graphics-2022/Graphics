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
import { gameOver } from './gameOver.js';
import { menu } from './menu.js';
import { levelPassed } from './levelPassed.js';

export const level1 = (() => {
  // Level 1 class to load level 1
  class level1 {
    constructor(_APP) {
      this._Initialize();
      this._APP = _APP;
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
      const far = 100.0;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

      // Set up the mini-map camera
      this.mapCamera = new THREE.OrthographicCamera(
        window.innerWidth / -40,		// Left
        window.innerWidth / 40,		// Right
        window.innerHeight / 40,		// Top
        window.innerHeight / -40,	// Bottom
        0,            			// Near 
        100);           			// Far 
      this.mapCamera.up = new THREE.Vector3(0, 0, -1);
      this.mapCamera.lookAt(new THREE.Vector3(0, -1, 0));
      this.mapCamera.position.set(0, 20, -38); 

      // Initialize the scene
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(0x000000);

      // Add lighting
      const light = new THREE.AmbientLight(0x070707); // soft white light
      this._scene.add(light);

      // Loading manager waits for all models to be loaded before starting the animation loop
      this.loadingManager = new THREE.LoadingManager()
      this.loadingManager.onLoad = () => {
        this._RAF();
        this._UIInit();
      }

      // Add a plane to the world
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
      this._autoHint = false;
      this._playerVision.push(plane);
      this._keyObject;
      this._doorObject;
      this._doorFrameObject;
      this._playerFound = false;
      this._keyFound = false;
      this._keyLight;
      this.openDoor = false;
      this._endGame = false;
      this._passPoint = new THREE.Vector3(27, 0, -76);
      this._mouseMaxDistance = 30;
      this._previousRAF = null;
      this._escapePress = false;
      // params used in different classes
      this._params = {
        camera: this._camera,
        miniMapCam: this.mapCamera,
        scene: this._scene,
        monsterVision: this._monsterVision,
        playerVision: this._playerVision,
        player2Vision: this._player2Vision,
        mouseMaxDistance: this._mouseMaxDistance,
        keyObject: this._keyObject,
        doorObject: this._doorObject,
        entityManager: this._entityManager,
        playerFound: this._playerFound,
        keyFound: this._keyFound,
        esc: this._escapePress,
        loadingManager: this.loadingManager,
      };

      // Load all assets
      this._LoadRoom();
      this._LoadPlayer();
    }

    // Initializes the environment
    _LoadRoom() {
      // Load the house
      const mapLoader = new GLTFLoader(this.loadingManager);
      mapLoader.setPath('./resources/Level1/');
      mapLoader.load('map2.glb', (glb) => {
        this._params.scene.add(glb.scene);
        glb.scene.position.set(0, -2.5, 0);
        glb.scene.traverse(c => {
          c.receiveShadow = true;
          c.castShadow = true;
          // Add this object to the "vision" of the corresponding models 
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);
        });

        // Load a mirror into the map
        const mirrorBack1 = new Reflector(
        new THREE.PlaneBufferGeometry(7, 4),
          {
            color: new THREE.Color(0x7f7f7f),
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio
          }
        )
        mirrorBack1.position.set(-2, 18, -50);
        mirrorBack1.rotateY(-Math.PI / 4)
        glb.scene.add(mirrorBack1)
        this._playerVision.push(mirrorBack1)
      });


      //Load door and a frame
      const Doorloader = new GLTFLoader(this.loadingManager);
      Doorloader.setPath('./resources/Level1/');
      Doorloader.load('door2.glb', (fbx) => {
        fbx.scene.name = 'Door1'
        fbx.scene.position.set(28.2, 0, -62.5);
        fbx.scene.scale.setScalar(0.035);
        this._scene.add(fbx.scene);

        fbx.scene.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
          c.metalness = 0.1
          // Add this object to the "vision" of the corresponding models 
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });
      });

      // Load the movable door and store the object
      const Doorloader2 = new GLTFLoader(this.loadingManager);
      Doorloader2.setPath('./resources/Level1/');
      Doorloader2.load('door3.glb', (fbx) => {
        fbx.scene.name = 'Door'
        fbx.scene.position.set(25.1, 0, -62.5);
        fbx.scene.scale.setScalar(0.035);
        this._scene.add(fbx.scene);
        this._params.doorObject = fbx.scene;
        fbx.scene.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
          c.metalness = 0.1
          // Add this object to the "vision" of the corresponding models 
          this._params.playerVision.push(c);
          this._params.player2Vision.push(c);
          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });
      });

      //Load the key into the map and store the object
      const loader = new GLTFLoader(this.loadingManager);
      loader.setPath('./resources/Level1/');
      loader.load('key.glb', (glb) => {
        glb.name = 'key'
        glb.scene.position.set(0, -2.5, 0);
        this._scene.add(glb.scene);
        this._params.keyObject = glb.scene;

        glb.scene.traverse(c => {
          // Add this object to the "vision" of the corresponding models 
          this._params.player2Vision.push(c);
          this._params.monsterVision.push(c);
          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });
      });
    }

    // Load the main player (girl), second player (mouse), and the enemy (ghoul) 
    _LoadPlayer() {
      // Initialize the girl
      const player = new entity.Entity();
      player.SetPosition(new THREE.Vector3(-10, 13, -23));
      const quaternionP = new THREE.Quaternion();
      quaternionP.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      player.SetQuaternion(quaternionP);
      player.AddComponent(new player_input.BasicCharacterControllerInput(this._params));
      player.AddComponent(new player_entity.BasicCharacterController(this._params, true));
      this._entityManager.Add(player, 'player');
      this._currentLookat = player.Position;
    
      // Initialize the mouse
      const player2 = new entity.Entity();
      player2.SetPosition(new THREE.Vector3(-7, 13, -23));
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
      npc.SetPosition(new THREE.Vector3(-35, 12, -30));
      const quaternionM1 = new THREE.Quaternion();
      quaternionM1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      npc.SetQuaternion(quaternionM1);
      const points = [
        new THREE.Vector3(-33, 15, -33),
        new THREE.Vector3(-39, 15, -34),
        new THREE.Vector3(-36, 15, -56),
        new THREE.Vector3(-33, 15, -53),
      ];
      npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points, this.npcManager, 5));
      this._entityManager.Add(npc, 'npc1');

      // Load rest of enemies
      this.npcManager.onLoad = () => {
        const npc1 = new entity.Entity();
        this._entityManager.Add(npc1, 'npc2');
        npc1.SetPosition(new THREE.Vector3(3, 0, -20));
        const points1 = [
          new THREE.Vector3(0, 2.5, -22),
          new THREE.Vector3(35, 2.5, -22),
          new THREE.Vector3(35, 2.5, -24),
          new THREE.Vector3(0, 2.5, -20),
          new THREE.Vector3(-2, 2.5, -35),
          new THREE.Vector3(2, 2.5, -35),
        ];
        npc1.AddComponent(new npc_entity.NPCController(this._params, 'npc2', points1, this.npcManager, 8));
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
      this._iconBar.hint.onclick = (m) => { this._HintSetMessage("Hint", "Use W,A,S,D to control the character, R to switch characters, and Esc to exit return to the menu. Find the hidden key to unlock the door but most importantly DO NOT GET CAUGHT!!"); this._OnHintClicked() };

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
              this._APP = new gameOver.gameOver(1, this._APP);
              this.sound.pause();
              this.screamSound.play();
              this._endGame = true;
              return;
            }

            // Check if the player has reached the end of the level
            if (this._entityManager.Get('player').Position.distanceTo(this._passPoint) < 5) {
              if (this._params.keyFound) {
                this._endGame = true;
                this._HideUI();
                document.getElementById('container').removeChild(document.getElementById('container').lastChild)
                this._APP = new levelPassed.levelPassed(1, this._APP);
                this.sound.pause();
                return;
              }
            } 

            // Open the door if the door is activated 
            if (this._params.openDoor) {
              if (this._params.keyFound) {
                this._params.doorObject.rotation.y += Math.PI / 30;
                // Open until it has reached a certain angle
                if (this._params.doorObject.rotation.y >= Math.PI / 2) {
                  this._params.openDoor = false;
                }
              } else {
                // If the door has been clicked without having the key then display message
                this._HintSetMessage("Hint", "You need to find the key first! Tip: use the mouse");
                this._OnHintClicked();
                this._params.openDoor = false;

              }
            }

            // Determine which level the mini-map displays
            if (this._entityManager.Get('player').Position.y > 10) {
              this.mapCamera.position.y = 20;
            } else {
              this.mapCamera.position.y = 9.1;
            }

            this._RAF();
            // Set up the different view ports and display the relevant camera renders 
            // Main render
            this._threejs.setViewport(0, 0, window.innerWidth, window.innerHeight);
            this._threejs.clear();
            this._threejs.render(this._scene, this._camera);
            // Mini-map render
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

    // Calculate an elapsed time and update every entity
    _Step(timeElapsed) {
      const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
      this._entityManager.Update(timeElapsedS);
    }
  }
  return { level1: level1 };
})();