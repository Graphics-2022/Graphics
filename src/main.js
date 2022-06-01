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

var level = 1;

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new menu();
});

class menu {
  constructor() {
    this._Initialize();
  }

  _Initialize() {

    var renderer, scene, container;

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    function onMouseMove(event) {

      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    }
    // init renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild( renderer.domElement );

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // init scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');


    //loading the fonts, have three text geometries
    const loader = new FontLoader();

    loader.load('../resources/fonts/helvetiker_regular.typeface.json', function (font) {

      const Textgeometry = new TextGeometry('Menu', {
        font: font,
        size: 30,
        height: 3,
        curveSegments: 20,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 3
      });
      var Textmaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var menuText = new THREE.Mesh(Textgeometry, Textmaterial);
      menuText.position.x = -50;
      menuText.position.y = 20;
      //menuText.lookAt(-50, 20,0)
      scene.add(menuText);
      const Play = new TextGeometry('Play', {
        font: font,
        size: 6,
        height: 1,
        curveSegments: 5,
        // bevelEnabled: true,
        // bevelThickness:0,
        // bevelSize: 0,
        // bevelOffset: 0,
        // bevelSegments: 0
      });
      var playMaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var playText = new THREE.Mesh(Play, playMaterial);
      playText.name = "play";
      playText.position.x = -47;
      playText.position.y = -20;
      playText.position.z = 15;
      playText.lookAt(0, -10, 50)
      scene.add(playText);

      const Credits = new TextGeometry('Credits', {
        font: font,
        size: 6,
        height: 1,
        curveSegments: 5,
        // bevelEnabled: true,
        // bevelThickness:0,
        // bevelSize: 0,
        // bevelOffset: 0,
        // bevelSegments: 0
      });
      var creditMaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var creditText = new THREE.Mesh(Credits, creditMaterial);
      creditText.name = "credit";
      creditText.position.x = 27;
      creditText.position.y = -18;
      creditText.position.z = 15;
      creditText.lookAt(0, -10, 45);
      scene.add(creditText);
    });

    const geometry = new THREE.BoxGeometry(25, 15, 15);
    const material = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = "sphere";
    sphere.position.x = -50;
    sphere.position.y = -20
    sphere.lookAt(0, -10, 50);
    scene.add(sphere);

    const geometry2 = new THREE.BoxGeometry(40, 15, 15);
    const material2 = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const sphere2 = new THREE.Mesh(geometry2, material2);
    sphere2.name = "sphere2";
    sphere2.position.x = 50;
    sphere2.position.y = -20
    sphere2.lookAt(0, -10, 50)
    scene.add(sphere2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.x = -150;
    directionalLight.position.y = 10;
    directionalLight.position.z = -10;
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.x = 150;
    directionalLight2.position.y = 10;
    directionalLight2.position.z = -10;
    scene.add(directionalLight2);

    const light = new THREE.AmbientLight(0x404040, 3.2); // soft white light
    scene.add(light);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight3.position.x = 0;
    directionalLight3.position.y = 150;
    directionalLight3.position.z = 50;
    scene.add(directionalLight3);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;
    console.log(camera.position)
    var continueAnimating = true; //variable used to cancel animation frame
    function render() {

      // update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera); //use raycaster to detect object in mouse position

      // calculate objects intersecting the picking ray
      var intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        for (var i = 0; i < intersects.length; i++) {
          if (intersects[i].object.name == 'sphere') { //if you click on the first block which says pla
            continueAnimating = false;
            document.getElementById('container').removeChild(document.getElementById('container').lastChild)
            _APP = new level1();
            return;

          }
        }
      }

      renderer.render(scene, camera);
    }
    window.addEventListener('click', onMouseMove, false); //add click listener 

    // Here's the bbasic render loop implementation

    function animate() {
      if (continueAnimating) {
        requestAnimationFrame(animate);

        render();
        //console.log(clicked)

      }

    }
    animate();
  }

}

class gameOver {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    var renderer, scene, container;

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    function onMouseMove(event) {

      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    }
    // init renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild( renderer.domElement );

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // init scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');


    //loading the fonts, have three text geometries
    const loader = new FontLoader();

    loader.load('../resources/fonts/helvetiker_regular.typeface.json', function (font) {

      const Textgeometry = new TextGeometry('GAME OVER', {
        font: font,
        size: 30,
        height: 3,
        curveSegments: 20,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 3
      });
      var Textmaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var gameOverText = new THREE.Mesh(Textgeometry, Textmaterial);
      gameOverText.position.x = -120;
      gameOverText.position.y = 20;
      //menuText.lookAt(-50, 20,0)
      scene.add(gameOverText);
      const tryAgain = new TextGeometry('Try Again', {
        font: font,
        size: 6,
        height: 1,
        curveSegments: 5,
        // bevelEnabled: true,
        // bevelThickness:0,
        // bevelSize: 0,
        // bevelOffset: 0,
        // bevelSegments: 0
      });
      var tryAgainMaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var tryAgainText = new THREE.Mesh(tryAgain, tryAgainMaterial);
      tryAgainText.name = "tryAgain";
      tryAgainText.position.x = -45;
      tryAgainText.position.y = -18;
      tryAgainText.position.z = 35;
      tryAgainText.lookAt(-15, -10, 50)
      scene.add(tryAgainText);

      const Quit = new TextGeometry('Quit', {
        font: font,
        size: 6,
        height: 1,
        curveSegments: 5,
        // bevelEnabled: true,
        // bevelThickness:0,
        // bevelSize: 0,
        // bevelOffset: 0,
        // bevelSegments: 0
      });
      var quitMaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var quitText = new THREE.Mesh(Quit, quitMaterial);
      quitText.name = "quit";
      quitText.position.x = 32;
      quitText.position.y = -18;
      quitText.position.z = 15;
      quitText.lookAt(0, -10, 45);
      scene.add(quitText)
    });

    const geometry = new THREE.BoxGeometry(40, 15, 15);
    const material = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = "sphere";
    sphere.position.x = -50;
    sphere.position.y = -20
    sphere.lookAt(0, -10, 50);
    scene.add(sphere);

    const geometry2 = new THREE.BoxGeometry(25, 15, 15);
    const material2 = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const sphere2 = new THREE.Mesh(geometry2, material2);
    sphere2.name = "sphere2";
    sphere2.position.x = 50;
    sphere2.position.y = -20
    sphere2.lookAt(0, -10, 50)
    scene.add(sphere2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.x = -150;
    directionalLight.position.y = 10;
    directionalLight.position.z = -10;
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.x = 150;
    directionalLight2.position.y = 10;
    directionalLight2.position.z = -10;
    scene.add(directionalLight2);

    const light = new THREE.AmbientLight(0x404040, 3.2); // soft white light
    scene.add(light);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight3.position.x = 0;
    directionalLight3.position.y = 150;
    directionalLight3.position.z = 50;
    scene.add(directionalLight3);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;
    console.log(camera.position)
    var continueAnimating = true; //variable used to cancel animation frame
    function render() {

      // update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera); //use raycaster to detect object in mouse position

      // calculate objects intersecting the picking ray
      var intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        for (var i = 0; i < intersects.length; i++) {
          if (intersects[i].object.name == 'sphere') { //if you click on the first block which says try again
            continueAnimating = false;
            document.getElementById('container').removeChild(document.getElementById('container').lastChild)
            if (level == 1) {
              _APP = new level1();
            }
            else if (level == 2) {
              _APP = new level2();
            }

            return;

          }
          else if (intersects[i].object.name == 'sphere2') {
            continueAnimating = false;

            document.getElementById('container').removeChild(document.getElementById('container').lastChild)
            _APP = new menu();
            return
          }
        }
      }

      renderer.render(scene, camera);
    }
    window.addEventListener('click', onMouseMove, false); //add click listener 

    // Here's the bbasic render loop implementation

    function animate() {
      if (continueAnimating) {
        requestAnimationFrame(animate);

        render();
        //console.log(clicked)

      }

    }
    animate();
  }
}

class levelPassed {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    var renderer, scene, container;

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    function onMouseMove(event) {

      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    }
    // init renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild( renderer.domElement );

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // init scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    let levelString='LEVEL '+level+' PASSED';
    //loading the fonts, have three text geometries
    const loader = new FontLoader();

    loader.load('../resources/fonts/helvetiker_regular.typeface.json', function (font) {

      const Textgeometry = new TextGeometry(levelString, {
        font: font,
        size: 20,
        height: 3,
        curveSegments: 20,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 3
      });
      var Textmaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var levelPassedText = new THREE.Mesh(Textgeometry, Textmaterial);
      levelPassedText.position.x = -110;
      levelPassedText.position.y = 20;
      //menuText.lookAt(-50, 20,0)
      scene.add(levelPassedText);
      const Continue = new TextGeometry('Continue', {
        font: font,
        size: 6,
        height: 1,
        curveSegments: 5,
        // bevelEnabled: true,
        // bevelThickness:0,
        // bevelSize: 0,
        // bevelOffset: 0,
        // bevelSegments: 0
      });
      var continueMaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var continueText = new THREE.Mesh(Continue, continueMaterial);
      continueText.name = "continue";
      continueText.position.x = -45;
      continueText.position.y = -18;
      continueText.position.z = 35;
      continueText.lookAt(-15, -10, 55)
      scene.add(continueText);

      const Quit = new TextGeometry('Quit', {
        font: font,
        size: 6,
        height: 1,
        curveSegments: 5,
        // bevelEnabled: true,
        // bevelThickness:0,
        // bevelSize: 0,
        // bevelOffset: 0,
        // bevelSegments: 0
      });
      var quitMaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
      var quitText = new THREE.Mesh(Quit, quitMaterial);
      quitText.name = "quit";
      quitText.position.x = 32;
      quitText.position.y = -18;
      quitText.position.z = 15;
      quitText.lookAt(0, -10, 45);
      scene.add(quitText)
    });

    const geometry = new THREE.BoxGeometry(40, 15, 15);
    const material = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = "sphere";
    sphere.position.x = -50;
    sphere.position.y = -20
    sphere.lookAt(0, -10, 50);
    scene.add(sphere);

    const geometry2 = new THREE.BoxGeometry(25, 15, 15);
    const material2 = new THREE.MeshLambertMaterial({ color: 0x505050 });
    const sphere2 = new THREE.Mesh(geometry2, material2);
    sphere2.name = "sphere2";
    sphere2.position.x = 50;
    sphere2.position.y = -20
    sphere2.lookAt(0, -10, 50)
    scene.add(sphere2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.x = -150;
    directionalLight.position.y = 10;
    directionalLight.position.z = -10;
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.x = 150;
    directionalLight2.position.y = 10;
    directionalLight2.position.z = -10;
    scene.add(directionalLight2);

    const light = new THREE.AmbientLight(0x404040, 3.2); // soft white light
    scene.add(light);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight3.position.x = 0;
    directionalLight3.position.y = 150;
    directionalLight3.position.z = 50;
    scene.add(directionalLight3);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;
    console.log(camera.position)
    var continueAnimating = true; //variable used to cancel animation frame
    function render() {

      // update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera); //use raycaster to detect object in mouse position

      // calculate objects intersecting the picking ray
      var intersects = raycaster.intersectObjects(scene.children);
      if (intersects.length > 0) {
        for (var i = 0; i < intersects.length; i++) {
          if (intersects[i].object.name == 'sphere') { //if you click on the first block which says try again
            continueAnimating = false;
            document.getElementById('container').removeChild(document.getElementById('container').lastChild)
            if (level == 1) {
              _APP = new level2();
            }
            else if (level == 2) {
              _APP = new level2();
            }

            return;

          }
          else if (intersects[i].object.name == 'sphere2') {
            continueAnimating = false;

            document.getElementById('container').removeChild(document.getElementById('container').lastChild)
            _APP = new menu();
            return
          }
        }
      }

      renderer.render(scene, camera);
    }
    window.addEventListener('click', onMouseMove, false); //add click listener 

    // Here's the bbasic render loop implementation

    function animate() {
      if (continueAnimating) {
        requestAnimationFrame(animate);

        render();
        //console.log(clicked)

      }

    }
    animate();
  }
}

class level1 {
  constructor() {
    this._Initialize();
  }


  _Initialize() {
    level=1;
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
    const far = 100.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // this._camera.position.set(25, 10, 25);

    // this._mapCamera = new THREE.OrthographicCamera(
    //   -1000,		// Left
    //   1000,		// Right
    //   1000,		// Top
    //   -1000,		// Bottom
    //   1,            			// Near 
    //   1000 );           			// Far 
    //   this._mapCamera.up = new THREE.Vector3(0,0,-1);
    //   this._mapCamera.lookAt( new THREE.Vector3(0,-1,0) );
    //   this._mapCamera.position.y = 500;
    //   // this._scene.add(this._mapCamera);
    //   var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
    //   this._mapComposer = new EffectComposer( this._threejs, new THREE.WebGLRenderTarget(512,512) );
    //   this._mapComposer.setSize( 512,512 );
    //   var renderModel2 = new RenderPass( this._scene, this._mapCamera );
    //   this._mapComposer.addPass( renderModel2 );
    //   var effectFXAA2 = new ShaderPass( THREE.FXAAShader );
    //   // effectFXAA2.uniforms[ 'resolution' ].value.set( 1 / 512, 1 / 512 );   // undo
    //   // effectFXAA2.renderToScreen = true;	
    //   this._mapComposer.addPass( effectFXAA2 );
    //   var effectCopy2 = new ShaderPass( THREE.CopyShader );
    //   effectCopy2.renderToScreen = true;
    //   this._mapComposer.addPass( effectCopy2 );

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000000);
    // this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    const light = new THREE.AmbientLight( 0x010101 ); // soft white light
    this._scene.add( light );

    // this.loadingScreen = {
    //   scene: new THREE.Scene(),
    //   camera: new THREE.PerspectiveCamera(fov, aspect, near, far),
    //   box: new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),
    //   new THREE.MeshBasicMaterial({ color:0xff0000}))
    // }
    // this.loadingScreen.box.position.set(0,0,5);
    // this.loadingScreen.camera.lookAt(this.loadingScreen.box.position)
    // this.loadingScreen.scene.add(this.loadingScreen.box)
    this.loadingScreen = {
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(fov, aspect, near, far),
      box: new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }))
    }
    this.loadingScreen.box.position.set(0, 0, 5);
    this.loadingScreen.camera.lookAt(this.loadingScreen.box.position)
    this.loadingScreen.scene.add(this.loadingScreen.box)

    // this._loaded = true;

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
    this._doorObject;
    this._doorFrameObject;
    this._playerFound = false;
    this._keyFound = false;
    this._keyLight;
    this._endGame = false;
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

    const posLights = [[0, 9, -20], [0, 9, -50], [-25, 9, -50], [-20, 20, -45]];
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
      // const sphereSize = 1;
      // const pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
      // this._params.scene.add( pointLightHelper );
    })


    const light2 = new THREE.PointLight(0x09cc09, 0.1, 100);
    light2.position.set(25, 9, -50);
    light2.castShadow = true;
    this._params.scene.add(light2);
    light2.shadow.mapSize.width = 512; // default
    light2.shadow.mapSize.height = 512; // default
    light2.shadow.camera.near = 0.5; // default
    light2.shadow.camera.far = 100; // default
    light2.shadow.bias = -0.005;


    const spotLight = new THREE.SpotLight(0x09dd09, 8, 200, Math.PI / 10)
    spotLight.position.set(30, 10, -75)
    spotLight.exponent = 30
    spotLight.intensity = 5
    spotLight.target.position.set(30, 0, -75)
    this._params.scene.add(spotLight.target);

    this._params.scene.add(spotLight)

  }

  _LoadRoom() {
    const mapLoader = new GLTFLoader(this.loadingManager);
    mapLoader.setPath('./resources/haunted_house/');
    mapLoader.load('map1.glb', (glb) => {

      this._params.scene.add(glb.scene);
      glb.scene.position.set(0, -2.5, 0);
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


    //Load Door
    const Doorloader = new GLTFLoader(this.loadingManager);
    Doorloader.setPath('./resources/haunted_house/');
    Doorloader.load('door1.glb', (fbx) => {
      // console.log(fbx.scene)
      fbx.scene.name = 'Door'
      // fbx.scene.position.set(24,0,-62);
      fbx.scene.position.set(3, -2.5, -0.5);

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
    const loader = new FBXLoader(this.loadingManager);
    loader.setPath('./resources/key/');
    loader.load('key1.fbx', (fbx) => {
      fbx.name = 'key'
      fbx.position.set(28, 3.5, -9);
      fbx.scale.setScalar(0.02);
      this._scene.add(fbx);
      this._params.keyObject = fbx;

      fbx.traverse(c => {
        // c.castShadow = true;
        // c.receiveShadow = true;
        // c.metalness = 1
        this._params.player2Vision.push(c);
        this._params.monsterVision.push(c);

        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });
    });

    const keyLight = new THREE.PointLight(0xffd700, 1, 2);
    keyLight.position.set(28, 6, -9);
    this._scene.add(keyLight)

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
    npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points, this.npcManager));
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
      npc1.AddComponent(new npc_entity.NPCController(this._params, 'npc2', points1, this.npcManager));
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
    // console.log(this._loaded)
    // if (!this._loaded){
    //   var l = requestAnimationFrame((t) => { this._RAF()})
    //   this._threejs.render(this.loadingScreen.scene , this.loadingScreen.camera)
    //   return;
    // }else{
    //   cancelAnimationFrame(l);
    //   this._threejs.render(this._scene, this._camera);

    // }

    setTimeout( ()=> {
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
  
        if(!this._params.playerFound){
          this._RAF();
          // var w = window.innerWidth, h = window.innerHeight;
  
          // // setViewport parameters:
          // //  lower_left_x, lower_left_y, viewport_width, viewport_height
          
          // // full display
          // this._threejs.setViewport( 0, 0, w, h );
          // // renderer.render( scene, camera );
          // composer.render();
  
          // renderer.clear( false, true, false ); // clear the depth buffer -- thanks @WestLangley!
  
          // // minimap (overhead orthogonal camera)
          // renderer.setViewport( 10, h - mapHeight - 10, mapWidth, mapHeight);
          // // renderer.render( scene, mapCamera );
          // mapComposer.render();
          this._threejs.render(this._scene, this._camera);
          this._Step(t - this._previousRAF);
          this._previousRAF = t;
        }else{
          cancelAnimationFrame(Req);
          document.getElementById('container').removeChild(document.getElementById('container').lastChild)
          _APP = new level1();
          return;
        }
        
        if(this._entityManager.Get('player').Position.distanceTo(new THREE.Vector3(36,20,-11)) < 5 && this._params.keyFound && this._endGame == false){
          this._endGame = true;
          cancelAnimationFrame(Req);
          document.getElementById('container').removeChild(document.getElementById('container').lastChild)
          _APP = new level2();
          return;
        }
  
      });
    }, 1000 / 30 );
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    this._entityManager.Update(timeElapsedS);
  }
}

class level2 {
  constructor() {
    this._Initialize();
  }
  

  _Initialize() {
    level=2;
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
    const far = 200.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // this._camera.position.set(25, 10, 25);

    // this._mapCamera = new THREE.OrthographicCamera(
    //   -1000,		// Left
    //   1000,		// Right
    //   1000,		// Top
    //   -1000,		// Bottom
    //   1,            			// Near 
    //   1000 );           			// Far 
    //   this._mapCamera.up = new THREE.Vector3(0,0,-1);
    //   this._mapCamera.lookAt( new THREE.Vector3(0,-1,0) );
    //   this._mapCamera.position.y = 500;
    //   // this._scene.add(this._mapCamera);
    //   var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
    //   this._mapComposer = new EffectComposer( this._threejs, new THREE.WebGLRenderTarget(512,512) );
    //   this._mapComposer.setSize( 512,512 );
    //   var renderModel2 = new RenderPass( this._scene, this._mapCamera );
    //   this._mapComposer.addPass( renderModel2 );
    //   var effectFXAA2 = new ShaderPass( THREE.FXAAShader );
    //   // effectFXAA2.uniforms[ 'resolution' ].value.set( 1 / 512, 1 / 512 );   // undo
    //   // effectFXAA2.renderToScreen = true;	
    //   this._mapComposer.addPass( effectFXAA2 );
    //   var effectCopy2 = new ShaderPass( THREE.CopyShader );
    //   effectCopy2.renderToScreen = true;
    //   this._mapComposer.addPass( effectCopy2 );

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x000000);
    // this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    const light = new THREE.AmbientLight( 0x020202 ); // soft white light
    this._scene.add( light );

    // this.loadingScreen = {
    //   scene: new THREE.Scene(),
    //   camera: new THREE.PerspectiveCamera(fov, aspect, near, far),
    //   box: new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),
    //   new THREE.MeshBasicMaterial({ color:0xff0000}))
    // }
    // this.loadingScreen.box.position.set(0,0,5);
    // this.loadingScreen.camera.lookAt(this.loadingScreen.box.position)
    // this.loadingScreen.scene.add(this.loadingScreen.box)

    // this._loaded = true;

    this.loadingManager = new THREE.LoadingManager()

    // this.loadingManager.onProgress = function(item , loaded, total){
    //   console.log(item, loaded , total)
    // }

    this.loadingManager.onLoad = ()=>{
      // console.log(this._loaded)

      // this._loaded = true;
      this._UIInit();
      this._RAF();
    }


    // const plane = new THREE.Mesh(
    //   new THREE.PlaneGeometry(1000, 1000, 10, 10),
    //   new THREE.MeshStandardMaterial({
    //       color: 0x1e601c,
    //     }));
    //   plane.name = "plane"
    //   plane.receiveShadow = true;
    //   plane.rotation.x = -Math.PI / 2;
    //   plane.position.y = 0.01;
    //   this._scene.add(plane);
    // this._playerVision.push(plane);
// 

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
      keyLight:this._keyLight,
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

    const posLights = [[-31,20,-80], [40,20,1],[35,9,-10], [-10,9,-55]]; //,[ 8,20,-51]
    // console.log(posLights)
    posLights.forEach((posLight) => {
      // console.log(posLight)
      const light = new THREE.PointLight( 0xffbb73, 0.1, 100 );
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
      const pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
      this._params.scene.add( pointLightHelper );
    })


    const light2 = new THREE.PointLight( 0x09cc09, 0.1, 100 );
    light2.position.set( 69,9,-5 );
    light2.castShadow = true;
    this._params.scene.add(light2);
    light2.shadow.mapSize.width = 512; // default
    light2.shadow.mapSize.height = 512; // default
    light2.shadow.camera.near = 0.5; // default
    light2.shadow.camera.far = 100; // default
    light2.shadow.bias = -0.005;


    const light3 = new THREE.PointLight( 0x09cc09, 0.1, 100 );
    light3.position.set( 37,22,-11 );
    light3.castShadow = true;
    this._params.scene.add( light3 );
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
    const mapLoader = new GLTFLoader();
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


    this._LoadLights();

  
    //     //Load Door
    // const Doorloader = new GLTFLoader(this.loadingManager);
    // Doorloader.setPath('./resources/haunted_house/');
    // Doorloader.load('door1.glb', (fbx) => {
    //   // console.log(fbx.scene)
    //   fbx.scene.name = 'Door'
    //   // fbx.scene.position.set(24,0,-62);
    //   fbx.scene.position.set(3,-2.5,-0.5);

    //   // fbx.scene.scale.setScalar(1.3);
    //   this._scene.add(fbx.scene);
    //   this._params.doorObject = fbx.scene;
    //   // this._params.keyObject = fbx;
    //   fbx.scene.traverse(c => {
    //     c.castShadow = true;
    //     c.receiveShadow = true;
    //     c.metalness = 0.1

    //     this._params.playerVision.push(c);
    //     this._params.player2Vision.push(c);

    //     if (c.material && c.material.map) {
    //       c.material.map.encoding = THREE.sRGBEncoding;
    //     }
    //   });
    // });

    // const mirrorBack1 = new Reflector(
    //   new THREE.PlaneBufferGeometry(11, 8),
    //   {
    //       color: new THREE.Color(0x7f7f7f),
    //       textureWidth: window.innerWidth * window.devicePixelRatio,
    //       textureHeight: window.innerHeight * window.devicePixelRatio
    //   }
    // )
    // mirrorBack1.position.set(-2,15,-50 );
    // mirrorBack1.rotateY(-Math.PI/4)
    // this._scene.add(mirrorBack1);
    // this._playerVision.push(mirrorBack1)

    //Load Key
    const loader = new FBXLoader(this.loadingManager);
    loader.setPath('./resources/key/');
    loader.load('key1.fbx', (fbx) => {
      fbx.name = 'key'
      fbx.position.set(99,-2,17);
      fbx.scale.setScalar(0.02);
      this._scene.add(fbx);
      this._params.keyObject = fbx;

      fbx.traverse(c => {
        // c.castShadow = true;
        // c.receiveShadow = true;
        // c.metalness = 1
        this._params.player2Vision.push(c);
        this._params.monsterVision.push(c);

        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });
      const keyLight= new THREE.PointLight(0xffd700, 1, 2);
      keyLight.position.copy(fbx.position);
      this._scene.add(keyLight)
    });



  }


  _LoadPlayer() {

    const player = new entity.Entity();
    player.SetPosition(new THREE.Vector3(-31,11,-80));
    const quaternionP = new THREE.Quaternion();
    quaternionP.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI/3 );
    player.SetQuaternion(quaternionP);
    player.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'girl'));
    player.AddComponent(new player_entity.BasicCharacterController(this._params, 'girl', true));
    this._entityManager.Add(player, 'player');
    this._camera.position.copy(player.Position);
    this._camera.position.y += 4;
    this._camera.position.z += 7;
    this._currentLookat = player.Position;


    const player2 = new entity.Entity();
    player2.SetPosition(new THREE.Vector3(-31,11,-84));
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
    npc.SetPosition(new THREE.Vector3(-29,11,-50));
    const quaternionM1 = new THREE.Quaternion();
    quaternionM1.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    npc.SetQuaternion(quaternionM1);
    const points = [ 
      new THREE.Vector3( -26,11,-43 ), 
      new THREE.Vector3( 6,11,-48 ),
      new THREE.Vector3( -13,11,-26),
      new THREE.Vector3( -13,11,0 ),
      new THREE.Vector3( 1,11,-7 ),
      ];
    npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points, this.npcManager));
    this._entityManager.Add(npc, 'npc1');

    this.npcManager.onLoad = () => {

      const npc2 = new entity.Entity();
      this._entityManager.Add(npc2, 'npc3');

      npc2.SetPosition(new THREE.Vector3(0,0,0));
      const points2 = [ 
        new THREE.Vector3( 0,0,0 ), 
        new THREE.Vector3( 5,0,25 ),
        new THREE.Vector3( 34,0,29),
        // new THREE.Vector3( 0, 11, -20 ),
        new THREE.Vector3( 43,0,1),
      ];
      npc2.AddComponent(new npc_entity.NPCController(this._params , 'npc3', points2, this.npcManager));

      const npc1 = new entity.Entity();
      this._entityManager.Add(npc1, 'npc2');

      npc1.SetPosition(new THREE.Vector3(50,11,-30));
      const points1 = [ 
        new THREE.Vector3( 50,11,-30 ), 
        new THREE.Vector3( 68,11,-20 ),
        new THREE.Vector3( 68,11, 24),
        // new THREE.Vector3( 0, 11, -20 ),
        new THREE.Vector3( 65,11,-19),
      ];
        
      setTimeout(() => {
        npc1.AddComponent(new npc_entity.NPCController(this._params , 'npc2', points1, this.npcManager));
      }, 1000);
    };
  }

  _UIInit(){
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
    // console.log(this._loaded)
    // if (!this._loaded){
    //   var l = requestAnimationFrame((t) => { this._RAF()})
    //   this._threejs.render(this.loadingScreen.scene , this.loadingScreen.camera)
    //   return;
    // }else{
    //   cancelAnimationFrame(l);
    //   this._threejs.render(this._scene, this._camera);

    // }

    var Req = requestAnimationFrame((t) => {

      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

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

      if(!this._params.playerFound){
        this._RAF();
        // var w = window.innerWidth, h = window.innerHeight;

        // // setViewport parameters:
        // //  lower_left_x, lower_left_y, viewport_width, viewport_height
        
        // // full display
        // this._threejs.setViewport( 0, 0, w, h );
        // // renderer.render( scene, camera );
        // composer.render();

        // renderer.clear( false, true, false ); // clear the depth buffer -- thanks @WestLangley!

        // // minimap (overhead orthogonal camera)
        // renderer.setViewport( 10, h - mapHeight - 10, mapWidth, mapHeight);
        // // renderer.render( scene, mapCamera );
        // mapComposer.render();
        this._threejs.render(this._scene, this._camera);
        this._Step(t - this._previousRAF);
        this._previousRAF = t;
      }else{
        cancelAnimationFrame(Req);
        document.getElementById('container').removeChild(document.getElementById('container').lastChild)
        _APP = new level1();
        return;
      }
      
      if(this._entityManager.Get('player').Position.distanceTo(new THREE.Vector3(36,20,-11)) < 5 && this._params.keyFound && this._endGame == false){
        this._endGame = true;
        cancelAnimationFrame(Req);
        document.getElementById('container').removeChild(document.getElementById('container').lastChild)
        _APP = new level2();
        return;
      }

    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    this._entityManager.Update(timeElapsedS);
  }
}

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
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // this._camera.position.set(25, 10, 25);

    // this._mapCamera = new THREE.OrthographicCamera(
    //   -1000,		// Left
    //   1000,		// Right
    //   1000,		// Top
    //   -1000,		// Bottom
    //   1,            			// Near 
    //   1000 );           			// Far 
    //   this._mapCamera.up = new THREE.Vector3(0,0,-1);
    //   this._mapCamera.lookAt( new THREE.Vector3(0,-1,0) );
    //   this._mapCamera.position.y = 500;
    //   // this._scene.add(this._mapCamera);
    //   var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
    //   this._mapComposer = new EffectComposer( this._threejs, new THREE.WebGLRenderTarget(512,512) );
    //   this._mapComposer.setSize( 512,512 );
    //   var renderModel2 = new RenderPass( this._scene, this._mapCamera );
    //   this._mapComposer.addPass( renderModel2 );
    //   var effectFXAA2 = new ShaderPass( THREE.FXAAShader );
    //   // effectFXAA2.uniforms[ 'resolution' ].value.set( 1 / 512, 1 / 512 );   // undo
    //   // effectFXAA2.renderToScreen = true;	
    //   this._mapComposer.addPass( effectFXAA2 );
    //   var effectCopy2 = new ShaderPass( THREE.CopyShader );
    //   effectCopy2.renderToScreen = true;
    //   this._mapComposer.addPass( effectCopy2 );

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xaaaaaa);
    // this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    const light = new THREE.AmbientLight( 0x999999); // soft white light
    this._scene.add( light );

    // this.loadingScreen = {
    //   scene: new THREE.Scene(),
    //   camera: new THREE.PerspectiveCamera(fov, aspect, near, far),
    //   box: new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5),
    //   new THREE.MeshBasicMaterial({ color:0xff0000}))
    // }
    // this.loadingScreen.box.position.set(0,0,5);
    // this.loadingScreen.camera.lookAt(this.loadingScreen.box.position)
    // this.loadingScreen.scene.add(this.loadingScreen.box)

    // this._loaded = true;

    this.loadingManager = new THREE.LoadingManager()

    // this.loadingManager.onProgress = function(item , loaded, total){
    //   console.log(item, loaded , total)
    // }

    this.loadingManager.onLoad = ()=>{
      // console.log(this._loaded)

      // this._loaded = true;
      this._UIInit();
      this._RAF();
    }


    // const plane = new THREE.Mesh(
    //   new THREE.PlaneGeometry(1000, 1000, 10, 10),
    //   new THREE.MeshStandardMaterial({
    //       color: 0x1e601c,
    //     }));
    //   plane.name = "plane"
    //   plane.receiveShadow = true;
    //   plane.rotation.x = -Math.PI / 2;
    //   plane.position.y = 0.01;
    //   this._scene.add(plane);
    // this._playerVision.push(plane);
// 

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
      keyLight:this._keyLight,
      loadingManager: this.loadingManager,
    };

    var listener = new THREE.AudioListener();
    this._camera.add( listener );
  
    // create a global audio source
    var sound = new THREE.Audio( listener );
  
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

  _LoadLights(){

    const posLights = [[-31,20,-80], [40,20,1],[35,9,-10], [-10,9,-55]]; //,[ 8,20,-51]
    // console.log(posLights)
    posLights.forEach((posLight) => {
      // console.log(posLight)
      const light = new THREE.PointLight( 0xffbb73, 0.1, 100 );
      light.position.x = posLight[0];
      light.position.y = posLight[1];
      light.position.z =posLight[2];
      light.castShadow = true;
      this._params.scene.add( light );
      light.shadow.mapSize.width = 512; // default
      light.shadow.mapSize.height = 512; // default
      light.shadow.camera.near = 0.5; // default
      light.shadow.camera.far = 100; // default
      light.shadow.bias = -0.005;
      const sphereSize = 1;
      const pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
      this._params.scene.add( pointLightHelper );
    })


    const light2 = new THREE.PointLight( 0x09cc09, 0.1, 100 );
    light2.position.set( 69,9,-5 );
    light2.castShadow = true;
    this._params.scene.add( light2 );
    light2.shadow.mapSize.width = 512; // default
    light2.shadow.mapSize.height = 512; // default
    light2.shadow.camera.near = 0.5; // default
    light2.shadow.camera.far = 100; // default
    light2.shadow.bias = -0.005;


    const light3 = new THREE.PointLight( 0x09cc09, 0.1, 100 );
    light3.position.set( 37,22,-11 );
    light3.castShadow = true;
    this._params.scene.add( light3 );
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

  _LoadRoom(){
    const mapLoader = new GLTFLoader();
    mapLoader.setPath('./resources/Level3/');
    mapLoader.load('scene.gltf', (glb) => {

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

    
    // this._LoadLights();

  
    //     //Load Door
    // const Doorloader = new GLTFLoader(this.loadingManager);
    // Doorloader.setPath('./resources/haunted_house/');
    // Doorloader.load('door1.glb', (fbx) => {
    //   // console.log(fbx.scene)
    //   fbx.scene.name = 'Door'
    //   // fbx.scene.position.set(24,0,-62);
    //   fbx.scene.position.set(3,-2.5,-0.5);

    //   // fbx.scene.scale.setScalar(1.3);
    //   this._scene.add(fbx.scene);
    //   this._params.doorObject = fbx.scene;
    //   // this._params.keyObject = fbx;
    //   fbx.scene.traverse(c => {
    //     c.castShadow = true;
    //     c.receiveShadow = true;
    //     c.metalness = 0.1

    //     this._params.playerVision.push(c);
    //     this._params.player2Vision.push(c);

    //     if (c.material && c.material.map) {
    //       c.material.map.encoding = THREE.sRGBEncoding;
    //     }
    //   });
    // });

    // const mirrorBack1 = new Reflector(
    //   new THREE.PlaneBufferGeometry(11, 8),
    //   {
    //       color: new THREE.Color(0x7f7f7f),
    //       textureWidth: window.innerWidth * window.devicePixelRatio,
    //       textureHeight: window.innerHeight * window.devicePixelRatio
    //   }
    // )
    // mirrorBack1.position.set(-2,15,-50 );
    // mirrorBack1.rotateY(-Math.PI/4)
    // this._scene.add(mirrorBack1);
    // this._playerVision.push(mirrorBack1)

    //Load Key
    const loader = new FBXLoader(this.loadingManager);
    loader.setPath('./resources/key/');
    loader.load('key1.fbx', (fbx) => {
      fbx.name = 'key'
      fbx.position.set(99,-2,17);
      fbx.scale.setScalar(0.02);
      this._scene.add(fbx);
      this._params.keyObject = fbx;

      fbx.traverse(c => {
        // c.castShadow = true;
        // c.receiveShadow = true;
        // c.metalness = 1
        this._params.player2Vision.push(c);
        this._params.monsterVision.push(c);

        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });
      const keyLight= new THREE.PointLight(0xffd700, 1, 2);
      keyLight.position.copy(fbx.position);
      this._scene.add(keyLight)
    });



  }


  _LoadPlayer() {

    const player = new entity.Entity();
    player.SetPosition(new THREE.Vector3(-31,11,-80));
    const quaternionP = new THREE.Quaternion();
    quaternionP.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI/3 );
    player.SetQuaternion(quaternionP);
    player.AddComponent(new player_input.BasicCharacterControllerInput(this._params, 'girl'));
    player.AddComponent(new player_entity.BasicCharacterController(this._params, 'girl' , true));
    this._entityManager.Add(player, 'player');
    this._camera.position.copy(player.Position);
    this._camera.position.y += 4;
    this._camera.position.z += 7;
    this._currentLookat = player.Position;


    const player2 = new entity.Entity();
    player2.SetPosition(new THREE.Vector3(-31,11,-84));
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

    // this.npcManager = new THREE.LoadingManager();

    const npc = new entity.Entity();
    npc.SetPosition(new THREE.Vector3(-29,11,-50));
    const quaternionM1 = new THREE.Quaternion();
    quaternionM1.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI );
    npc.SetQuaternion(quaternionM1);
    const points = [ 
      new THREE.Vector3( -26,11,-43 ), 
      new THREE.Vector3( 6,11,-48 ),
      new THREE.Vector3( -13,11,-26),
      new THREE.Vector3( -13,11,0 ),
      new THREE.Vector3( 1,11,-7 ),
      ];
    npc.AddComponent(new npc_entity.NPCController(this._params, 'npc1', points, this.npcManager));
    this._entityManager.Add(npc, 'npc1');

    // this.npcManager.onLoad = () => {

    //   const npc2 = new entity.Entity();
    //   this._entityManager.Add(npc2, 'npc3');

    //   npc2.SetPosition(new THREE.Vector3(0,0,0));
    //   const points2 = [ 
    //     new THREE.Vector3( 0,0,0 ), 
    //     new THREE.Vector3( 5,0,25 ),
    //     new THREE.Vector3( 34,0,29),
    //     // new THREE.Vector3( 0, 11, -20 ),
    //     new THREE.Vector3( 43,0,1),
    //   ];
    //   npc2.AddComponent(new npc_entity.NPCController(this._params , 'npc3', points2, this.npcManager));

    //   const npc1 = new entity.Entity();
    //   this._entityManager.Add(npc1, 'npc2');

    //   npc1.SetPosition(new THREE.Vector3(50,11,-30));
    //   const points1 = [ 
    //     new THREE.Vector3( 50,11,-30 ), 
    //     new THREE.Vector3( 68,11,-20 ),
    //     new THREE.Vector3( 68,11, 24),
    //     // new THREE.Vector3( 0, 11, -20 ),
    //     new THREE.Vector3( 65,11,-19),
    //   ];
        
    //   setTimeout(() => {
    //     npc1.AddComponent(new npc_entity.NPCController(this._params , 'npc2', points1, this.npcManager));
    //   }, 1000);
    // };
  }

  _UIInit(){
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
    // console.log(this._loaded)
    // if (!this._loaded){
    //   var l = requestAnimationFrame((t) => { this._RAF()})
    //   this._threejs.render(this.loadingScreen.scene , this.loadingScreen.camera)
    //   return;
    // }else{
    //   cancelAnimationFrame(l);
    //   this._threejs.render(this._scene, this._camera);

    // }
    setTimeout( ()=> {
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

      if(!this._params.playerFound){
        this._RAF();
        // var w = window.innerWidth, h = window.innerHeight;

        // // setViewport parameters:
        // //  lower_left_x, lower_left_y, viewport_width, viewport_height
        
        // // full display
        // this._threejs.setViewport( 0, 0, w, h );
        // // renderer.render( scene, camera );
        // composer.render();

        // renderer.clear( false, true, false ); // clear the depth buffer -- thanks @WestLangley!

        // // minimap (overhead orthogonal camera)
        // renderer.setViewport( 10, h - mapHeight - 10, mapWidth, mapHeight);
        // // renderer.render( scene, mapCamera );
        // mapComposer.render();
        this._threejs.render(this._scene, this._camera);
        this._Step(t - this._previousRAF);
        this._previousRAF = t;
      }else{
        cancelAnimationFrame(Req);
        document.getElementById('container').removeChild(document.getElementById('container').lastChild)
        _APP = new level1();
        return;
      }
      
      if(this._entityManager.Get('player').Position.distanceTo(new THREE.Vector3(36,20,-11)) < 5 && this._params.keyFound && this._endGame == false){
        this._endGame = true;
        cancelAnimationFrame(Req);
        document.getElementById('container').removeChild(document.getElementById('container').lastChild)
        _APP = new level2();
        return;
      }

    });
  }, 1000 / 30 );
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    this._entityManager.Update(timeElapsedS);
  }
}

