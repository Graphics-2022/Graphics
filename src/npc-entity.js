import * as THREE from '../modules/three.module.js';
import {entity} from './entity.js';
import {spotlight_material} from '../modules/spotlightmaterial.js'
import * as SkeletonUtils from '../modules/SkeletonUtils.js'
import { GLTFLoader } from '../modules/GLTFLoader.js';


export const npc_entity = (() => {
  // Class creates and governs each enemy
  class NPCController extends entity.Component {
    constructor(params, type , points , npcManager, t) {
      super();
      this._type = type;
      this._points = points;
      this._npcManager = npcManager;
      this._t = t;
      this._Init(params);
    }

    _Init(params) {
      this._params = params;
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this._acceleration = new THREE.Vector3(1, 0.25, 40.0);
      this._velocity = new THREE.Vector3(0, 0, 0);
      this._position = new THREE.Vector3();
      this._time = 0.1;
      this._spotLight;
      this._target;
      this._animations = {};

      this._LoadModels();
    }

    _LoadModels() {
      // If its the first enemy, load from file, otherwise clone from first 
      if(this._type == 'npc1'){
        const loader = new GLTFLoader( this._npcManager);
        loader.setPath('./resources/enemies/mutant/');
        loader.load('ghoul2.glb', (fbx) => {
          this._target= fbx.scene;
          this._target.name = this._type;
          // Set up the animation
          this._mixer = new THREE.AnimationMixer(this._target);
          this.clip = THREE.AnimationClip.findByName(fbx , 'Ghoul')
          const action = this._mixer.clipAction(this.clip);
          action.play();
          this._setModel();
        });
      }else{
        this._target = SkeletonUtils.clone(this._params.entityManager.Get('npc1').GetComponent("NPCController")._target);
        this._target.name = this._type;
        this._parent = this._params.entityManager.Get(this._type);
        // Set up the animation
        this._mixer = new THREE.AnimationMixer(this._target);
        this.clip = this._params.entityManager.Get('npc1').GetComponent("NPCController").clip;
        const action = this._mixer.clipAction(this.clip);
        action.play();
        this._setModel();
      }
    }

    // Set up the rest of the enemy after the object has been created
    _setModel(){
      this._target.scale.setScalar(0.025);
      this._target.position.copy(this._parent.Position);
      this._target.quaternion.copy(this._parent.Quaternion);
      this._bones = {};
      this._target.traverse(c => {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material && c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding;
        }
      });

      this._targetObject = new THREE.Object3D();
      this._targetObject.position.copy(this._target.position);

      // Add spot light to the enemy
      // Create the vision cone
      var geometry    = new THREE.CylinderGeometry( 0.1, 7, 20, 322, 20, true);
      geometry.applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
      geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

      var material    = new spotlight_material.SpotlightMaterial().GetMaterial();
      this._mesh    = new THREE.Mesh( geometry, material );
      this._mesh.name = this._type+"mesh";
      this._mesh.position.copy(this._target.position);

      this._mesh.lookAt(this._targetObject.position)
      material.uniforms.lightColor.value.set('red')
      material.uniforms.spotPosition.value    = this._mesh.position
      material.uniforms.attenuation.value    = 50
      material.uniforms.anglePower.value    = 2
      this._params.scene.add( this._mesh );

      // Create the sopt light
      this._spotLight    = new THREE.SpotLight( 0xff0909 , 8 , 200 , Math.PI/10 )
      this._spotLight.name = this._type+"spot"
      this._spotLight.position.copy(this._target.position)
      this._spotLight.exponent    = 30
      this._spotLight.intensity    = 5
      this._spotLight.target = this._targetObject;
      this._spotLight.distance = 50;
      this._spotLight.castShadow = true;
      this._spotLight.shadow.bias = -0.005;
      this._spotLight.shadow.mapSize.width = 512; // default
      this._spotLight.shadow.mapSize.height = 512; // default
      this._spotLight.shadow.camera.near = 1; // default
      this._spotLight.shadow.camera.far = 100; // default
      this._spotLight.shadow.focus = 1; // default

      // Initialize global variables
      this.d = new THREE.Vector3();
      this.start = new THREE.Vector3();
      this.dirToPlayer =  new THREE.Vector3(0, 0, 0);
      this.path = new THREE.CatmullRomCurve3( this._points, true );
      this.frameDecceleration= new THREE.Vector3();;
      this.oldPosition= new THREE.Vector3();
      this.forward =new THREE.Vector3();
      this.sideways = new THREE.Vector3();
      this.m = new THREE.Matrix4()
      this.eye = new THREE.Vector3(0,0,0);
      this.up = new THREE.Vector3(0,1,0);
      this.down = new THREE.Vector3(0,-1,0);
      this._Q = new THREE.Quaternion();
      this._A = new THREE.Vector3();
      this.p = new THREE.Vector3();
      this.ray = new THREE.Raycaster();
      this.ray.far = 50;
      this.ray.near = 0;
      this.int;

            // visualize the path
      const lineGeometry = new THREE.BufferGeometry().setFromPoints( this.path.getPoints( 32 ) );
      const lineMaterial = new THREE.LineBasicMaterial();
      const line = new THREE.Line( lineGeometry, lineMaterial );
      this._params.scene.add(line)

      // Do not add the 4th npc
      if ( this._type != "npc4"){
        this._AddToScene();
      }
    }

    // Add the enemy to the scene
    _AddToScene(){
      this._params.scene.add(this._target);
      this._params.scene.add( this._spotLight  )
      this._params.scene.add( this._spotLight.target);
    }

    // Get the position of the enemy
    get Position() {
      return this._position;
    }

    // Get the rotation of the enemy
    get Rotation() {
      if (!this._target) {
        return new THREE.Quaternion();
      }
      return this._target.quaternion;
    }

    // Check if the enemy can see the the girl
    _FindPlayer() {
      // Do not carry on if the enemy is too far
      let playerPos = this._params.entityManager.Get('player')._position
      if (this._target.position.distanceTo(playerPos) > this.ray.far){
        return false;
      }
      const dir = this._target.position.clone();
      dir.sub(this._params.entityManager.Get('player')._position)
      dir.y = 0.0;
      dir.normalize();
      dir.multiplyScalar(-1);

      this._target.getWorldDirection(this.d)

      // Do not carry on if the enemy is not facing the girl
      if (dir.angleTo(this.d) > 0.31419){
        return false;
      }

      // Cast ray to the position of the girl
      this.start.copy(this._target.position);
      this.start.y +=2.5;
      this.ray.set(this.start, dir);
      this.int = this.ray.intersectObjects(this._params.monsterVision, false );
      // var arrow = new THREE.ArrowHelper( this.ray.ray.direction, this.ray.ray.origin, this.ray.far, 0xff0000 );
      //   this._params.scene.add(arrow)
      if(this.int.length > 0){
        // Determine if the first object is the girl
        if(this.int[0].object.parent.name == "girl"){
          return true;
        }
      }
      return false;
    }


    // Calculate where the enemy must walk
    _OnAIWalk(timeInSeconds) {
      this._time += timeInSeconds;

      // Get a point from the pre determine path
      const pos1=this.path.getPointAt( (this._time/this._t)%1);
      const dir = this._parent._position.clone();
      dir.sub(pos1);
      dir.y = 0.0;
      const _R = this._target.quaternion.clone();

      // Look at the point
      this.m.lookAt(this.eye,dir,this.up);
      _R.setFromRotationMatrix(this.m);

      this._target.quaternion.copy(_R);

      this.forward.set(0,0,1);
      this.forward.applyQuaternion(this._target.quaternion);
      this.forward.normalize();
      this.forward.multiplyScalar(8 * timeInSeconds);
      const pos = this._target.position.clone();
      this._target.getWorldDirection(this.d);

      // Update the camera target
      this._mesh.position.copy(pos);
      this._mesh.position.addScaledVector(this.d, 1.5);
      this._mesh.position.y+= 5;
      this._spotLight.position.copy(this._mesh.position);
      
      pos.add(this.forward);

      // Make enemy walk in this direction
      this._target.position.copy(pos);
      this._position.copy(pos);
      this._targetObject.position.copy(pos);
      this._targetObject.position.addScaledVector(this.d, 20);
      this._mesh.lookAt(this._targetObject.position);
      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
    }

    // Remove this enemy from the scene
    Delete(){
      var selectedObject = this._params.scene.getObjectByName(this._type);
      this._params.scene.remove(selectedObject);
      selectedObject = this._params.scene.getObjectByName(this._type+"spot");
      this._params.scene.remove(selectedObject);
      selectedObject = this._params.scene.getObjectByName(this._type+"mesh");
      this._params.scene.remove(selectedObject);
    }

    // Update the enemy 
    Update(timeInSeconds) {
      // Check if the enemy sees the girl
      if(this._FindPlayer()){
        this._params.playerFound = true;
        return;
      }

      // Update the enemy position
      this._OnAIWalk(timeInSeconds);

      // Update enemy animation
      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }
    }
  };

  return {
    NPCController: NPCController,
  };

})();