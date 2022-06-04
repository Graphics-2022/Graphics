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
import { level2 } from './level2.js';
import { levelPassed } from './levelPassed.js';

export const level1 = (() => {

    class level1 {
        constructor(_APP) {
            this._Initialize();
            this._APP = _APP;
          }
      
      
        _Initialize() {
        //   level=1;
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
          const far = 100.0;
          this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      
          this._scene = new THREE.Scene();
          this._scene.background = new THREE.Color(0x000000);
      
          const light = new THREE.AmbientLight( 0x070707 ); // soft white light
          this._scene.add( light );
      

          this.loadingScreen = {
            scene: new THREE.Scene(),
            camera: new THREE.PerspectiveCamera(fov, aspect, near, far),
            box: new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5),
              new THREE.MeshBasicMaterial({ color: 0xff0000 }))
          }
          this.loadingScreen.box.position.set(0, 0, 5);
          this.loadingScreen.camera.lookAt(this.loadingScreen.box.position)
          this.loadingScreen.scene.add(this.loadingScreen.box)
      
      
          this.loadingManager = new THREE.LoadingManager()
          this.loadingManager.onLoad = () => {
            this._UIInit();
            this._RAF();
          }

          this.mapCamera = new THREE.OrthographicCamera(
            window.innerWidth / -40,		// Left
            window.innerWidth / 40,		// Right
            window.innerHeight / 40,		// Top
            window.innerHeight / -40,	// Bottom
            // window.innerWidth / -2,		// Left
            // window.innerWidth / 2,		// Right
            // window.innerHeight / 2,		// Top
            // window.innerHeight / -2,	// Bottom
            0,            			// Near 
            100 );           			// Far 

            // this.mapCamera = new THREE.PerspectiveCamera(
            //   90, aspect , 0.01,500
            // )

          this.mapCamera.up = new THREE.Vector3(0,0,-1);
          this.mapCamera.lookAt( new THREE.Vector3(0,-1,0) );
          this.mapCamera.position.set(0,20,-38)  // h = 9  
          // this.mapCamera.position.set(0,20,0);

      
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
          this._passPoint = new THREE.Vector3(27,0,-76);
          this._mouseMaxDistance = 30;
          this._params = {
            camera: this._camera,
            miniMapCam : this.mapCamera,
            scene: this._scene,
            monsterVision: this._monsterVision,
            playerVision: this._playerVision,
            player2Vision: this._player2Vision,
            mouseMaxDistance : this._mouseMaxDistance,
            keyObject: this._keyObject,
            doorObject: this._doorObject,
            entityManager: this._entityManager,
            playerFound: this._playerFound,
            keyFound: this._keyFound,
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
      
          // this._LoadSky();
          this._LoadRoom();
          this._LoadPlayer();
      
          this._previousRAF = null;

          	// // orthographic cameras

              // this._scene.add(this.mapCamera);

              // this.mapWidth = 240, 
              // this.mapHeight = 160; 
        }
      
      
        _LoadRoom() {
          const mapLoader = new GLTFLoader(this.loadingManager);
          mapLoader.setPath('./resources/haunted_house/');
          mapLoader.load('map2.glb', (glb) => {
      
            this._params.scene.add(glb.scene);
            glb.scene.position.set(0, -2.5, 0);
            // glb.scene.scale.setScalar(1);
            glb.scene.traverse(c => {
              c.receiveShadow = true;
              c.castShadow = true;
              this._params.playerVision.push(c);
              this._params.player2Vision.push(c);
              this._params.monsterVision.push(c);
            });
          });
      
      
        //   this._LoadLights();
      
      
          //Load Door
          const Doorloader = new GLTFLoader(this.loadingManager);
          Doorloader.setPath('./resources/haunted_house/');
          Doorloader.load('door2.glb', (fbx) => {
            // console.log(fbx.scene)
            fbx.scene.name = 'Door1'
            // fbx.scene.position.set(24,0,-62);
            fbx.scene.position.set(28.2,0,-62.5);
            fbx.scene.scale.setScalar(0.035);
            // fbx.scene.scale.setScalar(1.3);
            this._scene.add(fbx.scene);

            // this._params.doorObject = fbx.scene;
            // this._params.keyObject = fbx;
            fbx.scene.traverse(c => {
              c.castShadow = true;
              c.receiveShadow = true;
              c.metalness = 0.1
      
              this._params.playerVision.push(c);
              this._params.player2Vision.push(c);
      
              if (c.material && c.material.map) {
                c.material.map.encoding = THREE.sRGBEncoding;
              }
            });
          });

          const Doorloader2 = new GLTFLoader(this.loadingManager);
          Doorloader2.setPath('./resources/haunted_house/');
          Doorloader2.load('door3.glb', (fbx) => {
            // console.log(fbx.scene)
            fbx.scene.name = 'Door'
            // fbx.scene.position.set(24,0,-62);
            fbx.scene.position.set(25.1,0,-62.5);
            fbx.scene.scale.setScalar(0.035);
            // fbx.scene.scale.setScalar(1.3);
            this._scene.add(fbx.scene);

            this._params.doorObject = fbx.scene;
            // this._params.keyObject = fbx;
            fbx.scene.traverse(c => {
              c.castShadow = true;
              c.receiveShadow = true;
              c.metalness = 0.1
      
              this._params.playerVision.push(c);
              this._params.player2Vision.push(c);
      
              if (c.material && c.material.map) {
                c.material.map.encoding = THREE.sRGBEncoding;
              }
            });
          });
      
          const mirrorBack1 = new Reflector(
            new THREE.PlaneBufferGeometry(7, 4),
            {
              color: new THREE.Color(0x7f7f7f),
              textureWidth: window.innerWidth * window.devicePixelRatio,
              textureHeight: window.innerHeight * window.devicePixelRatio
            }
          )
          mirrorBack1.position.set(-2, 15, -50);
          mirrorBack1.rotateY(-Math.PI / 4)
          this._scene.add(mirrorBack1);
          this._playerVision.push(mirrorBack1)
      
          //Load Key
          const loader = new GLTFLoader(this.loadingManager);
          loader.setPath('./resources/key/');
          loader.load('key.glb', (glb) => {
            glb.name = 'key'
            glb.scene.position.set(0, -2.5, 0);
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

        }
      
      
        _LoadPlayer() {
          const player = new entity.Entity();
          player.SetPosition(new THREE.Vector3(-10, 13, -23));
          const quaternionP = new THREE.Quaternion();
          quaternionP.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
          player.SetQuaternion(quaternionP);
          player.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'girl'));
          player.AddComponent(new player_entity.BasicCharacterController(this._params, 'girl', true));
          this._entityManager.Add(player, 'player');
          this._camera.position.copy(player.Position);
          this._camera.position.y += 4;
          this._camera.position.z += 7;
          this._currentLookat = player.Position;
      
          const player2 = new entity.Entity();
          player2.SetPosition(new THREE.Vector3(-7, 13, -23));
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
          npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points, this.npcManager,5));
          this._entityManager.Add(npc, 'npc1');
      
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
            npc1.AddComponent(new npc_entity.NPCController(this._params, 'npc2', points1, this.npcManager,8));
          };
        }
      
        _UIInit(){
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
          this._iconBar.hint.onclick = (m) => { this._HintSetMessage("Hint","Use W,A,S,D to control the character. Find the hidden key to unlock the door but most importantly DO NOT GET CAUGHT!!" ); this._OnHintClicked()};

          this._ui.inventory.style.visibility = 'hidden';
          this._ui.hint.style.visibility = 'hidden';

          this._iconBar.inventory.style.visibility = 'visible';
          this._iconBar.switch.style.visibility = 'visible';
          this._iconBar.hint.style.visibility = 'visible';
        }

        _HintSetMessage(heading , mess){
          const title = document.getElementById('hint-text-title');
          title.innerText = heading;

          const text = document.getElementById('hint-text');
          text.innerText = mess;
        }

        _OnHintClicked(toggle){
          const visibility = this._ui.hint.style.visibility;
          // console.log(this._autoHint)
          if(typeof toggle == 'undefined'){
            this._ui.hint.style.visibility = (visibility ? '' : 'hidden');
            this._autoHint = !this._autoHint;
            return;
          }

          if (this._autoHint){
            return;
          }

          if((toggle && visibility != '') || (!toggle && visibility == '')){
            this._ui.hint.style.visibility = (visibility ? '' : 'hidden');
          }
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
      
      
        _RAF() {
          if (!this._endGame){
            setTimeout( ()=> {
              requestAnimationFrame((t) => {
          
                if (this._previousRAF === null) {
                  this._previousRAF = t;
                }
                // controls which character the camera will follow
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

                // open door when activated

          
                if(this._params.playerFound){
                  document.getElementById('container').removeChild(document.getElementById('container').lastChild)
                  this._APP = new gameOver.gameOver(1, this._APP);
                  this._endGame = true;
                  return;

                }
                if(this._entityManager.Get('player').Position.distanceTo(this._passPoint) < 5){
                  if (this._params.keyFound){
                    this._endGame = true;
                    document.getElementById('container').removeChild(document.getElementById('container').lastChild)
                    this._APP = new levelPassed.levelPassed(1,this._APP);
                    return;
                  }
                }else{
                  if (this._params.openDoor){
                    if(this._params.keyFound){
                      this._params.doorObject.rotation.y += Math.PI / 30;
  
                      if(  this._params.doorObject.rotation.y >= Math.PI / 2 ){
                        this._params.openDoor= false;
                      }
                    }else{
                      this._params.openDoor = false;
                      this._HintSetMessage("Hint", "You need to find the key first! Tip: use the mouse");
                      this._OnHintClicked();
                    }
                  }
                }

                if(this._entityManager.Get('player').Position.y > 10){
                  this.mapCamera.position.y = 20;
                }else{
                  this.mapCamera.position.y = 9.1;
                }

                this._RAF();
                this._threejs.setViewport(0,0,window.innerWidth, window.innerHeight);
                this._threejs.clear();
                this._threejs.render( this._scene, this._camera );

                this._threejs.clearDepth();
                this._threejs.setScissorTest(true);
                this._threejs.setScissor(
                  0,
                  0,
                  window.innerWidth/6,
                  window.innerWidth/6,
                )

                this._threejs.setViewport(0,0,window.innerWidth/6, window.innerWidth/6);
                this._threejs.render( this._scene, this.mapCamera );
                this._threejs.setScissorTest(false);

                // this._threejs.render(this._scene, this._camera);
                this._Step(t - this._previousRAF);
                this._previousRAF = t;
              });
            }, 1000 / 30 );
          }
        }
      
        _Step(timeElapsed) {
          const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
          this._entityManager.Update(timeElapsedS);
        }
      }
    return {level1 : level1};
})();