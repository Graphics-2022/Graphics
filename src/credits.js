import * as THREE from '../modules/three.module.js';
import { FontLoader } from '../modules/FontLoader.js';
import { TextGeometry } from '../modules/TextGeometry.js';
import { menu } from './menu.js';
import { level1 } from './level1.js';
import { level2 } from './level2.js';
import { level3 } from './level3.js';

export const credits = (() =>{

    class credits {
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

          document.getElementById('overlay').style.display='block';
      
          // init scene
          scene = new THREE.Scene();
          scene.background = new THREE.Color('black');
      
          //loading the fonts, have three text geometries
          const loader = new FontLoader();
      
          loader.load('./resources/fonts/helvetiker_regular.typeface.json', function (font) {
      
            const Textgeometry = new TextGeometry('CREDITS', {
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
            var creditsText = new THREE.Mesh(Textgeometry, Textmaterial);
            creditsText.position.x = -70;
            creditsText.position.y = 35;
            //menuText.lookAt(-50, 20,0)
            scene.add(creditsText);
                 
            const menu = new TextGeometry('Menu', {
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
            var menuMaterial = new THREE.MeshLambertMaterial({ color: 0x921B01 });
            var menuText = new THREE.Mesh(menu, menuMaterial);
            menuText.name = "menu";
            menuText.position.x = 73;
            menuText.position.y = -43;
            menuText.position.z = 15;
            //quitText.lookAt(0, -10, 45);
            scene.add(menuText)
          });
      
          const geometry = new THREE.BoxGeometry(25, 15, 15);
          const material = new THREE.MeshLambertMaterial({ color: 0x505050 });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.name = "sphere";
          sphere.position.x = 90;
          sphere.position.y = -45
         //sphere.lookAt(0, 10, 0);
          scene.add(sphere);
            
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
                  document.getElementById('overlay').style.display='none';
                  document.getElementById('container').removeChild(document.getElementById('container').lastChild)
                  _APP=new menu.menu();
      
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
    return {credits: credits};
})();