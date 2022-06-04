import * as THREE from '../modules/three.module.js';
import { FontLoader } from '../modules/FontLoader.js';
import { TextGeometry } from '../modules/TextGeometry.js';
import { level1 } from './level1.js';
import { credits } from './credits.js';

export const menu = (() =>{

    class menu {
        constructor(_APP) {
          this._Initialize(_APP);
        }
      
        _Initialize(_APP) {
      
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
                //   window.addEventListener('DOMContentLoaded', () => {
                    _APP = new level1.level1();
                //   });
                  return;
      
                }
                else if(intersects[i].object.name=='sphere2'){
                  continueAnimating=false;
                  document.getElementById('container').removeChild(document.getElementById('container').lastChild)
                  _APP=new credits.credits();
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
            //   console.log(clicked)
      
            }
      
          }
          animate();
        }
      
        }

      return {menu : menu};
    })();