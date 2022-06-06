import * as THREE from '../modules/three.module.js';
import {FBXLoader} from '../modules/FBXLoader.js';
import {entity} from './entity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';


export const player_entity = (() => {

  // Declaring the different states in which the girl can be in
  class CharacterFSM extends finite_state_machine.FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      
      this._Init();
    }
  
    _Init() {
      this._AddState('idle', player_state.IdleState);
      this._AddState('walk', player_state.WalkState);
      this._AddState('run', player_state.RunState);
    }
  };
  
  // Links an animation to a state
  class BasicCharacterControllerProxy {
    constructor(animations) {
      this._animations = animations;
    }
  
    get animations() {
      return this._animations;
    }
  };


  // Controls the girl model
  class BasicCharacterController extends entity.Component {
    constructor(params, active) {
      super();
      this._active = active;
      this._Init(params);
    }

    _Init(params) {
      this._params = params;
      // init all objects once
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -10.0);      
      this.blocked;
      this.search = [];
      this.d = new THREE.Vector3();
      this.newDir =new THREE.Vector3(0,0,0);
      this.start = new THREE.Vector3();
      this.ray = new THREE.Raycaster();
      this.int;
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
      this._acceleration = new THREE.Vector3(1, 0.125, 50.0);
      this._velocity = new THREE.Vector3(0, 0, 0);
      this._position = new THREE.Vector3();
      this._dist; 
      this._vision;
      this._animations = {};
      this._stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this._animations));
  
      this._LoadModels();
    }

    // Return if this player has controls
    GetActive(){
      return this._active;
    }

    // Give this player the controls
    SetActive(a){
      this._active = a;
    }

    // Load this model (girl)
    _LoadModels() {
        const loader = new FBXLoader(this._params.loadingManager);
        loader.setPath('./resources/girl/');
        loader.load('girl3.fbx', (fbx) => {
          this._target = fbx;
          this._target.scale.setScalar(0.035);
          this._target.name = "girl"
          this._params.scene.add(this._target);
          this._dist = 2;
          this._height = 2.5;
          this._target.position.copy(this._parent.Position);
          this._target.quaternion.copy(this._parent.Quaternion);

          // Set this model's vision
          this._vision = this._params.playerVision;

          this._target.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.encoding = THREE.sRGBEncoding;
            }
          // Add this model to the monster vision and mouse vision
            this._params.monsterVision.push(c);
            this._params.player2Vision.push(c);

          });

          // Link animations to a state name
          this._mixer = new THREE.AnimationMixer(this._target);
          const _OnLoad = (animName, anim) => {
            const clip = anim.animations[0];
            const action = this._mixer.clipAction(clip);
            this._animations[animName] = {
              clip: clip,
              action: action,
            };
          };

          // Set the initial state of this model
          this._manager = new THREE.LoadingManager(this._params.loadingManager);
          this._manager.onLoad = () => {
            this._stateMachine.SetState('idle');

          };
          
          // Load the animations
          const loader = new FBXLoader(this._manager,this._params.loadingManager);
          loader.setPath('./resources/girl/');
          loader.load('Female Crouch Pose.fbx', (a) => { _OnLoad('idle', a); });
          loader.load('Sneaking Forward.fbx', (a) => { _OnLoad('run', a); });
          loader.load('Crouched Walking.fbx', (a) => { _OnLoad('walk', a); });
        });
    }

    // Check whether this model has collided whith something in its vision
    _CheckSurroundings(input){
      // Determine if it needs to check infront of the model or behind depending on the input
      this._target.getWorldDirection(this.d);
      if (input._keys.backward){
        this.d.z *= -1;
        this.d.x *= -1;
      }

      // Declare the starting point
      this.start.copy(this._target.position);
      this.start.y += this._height;
      this.ray.far = this._dist;
      this.ray.near = 0;

      // Set the direction and begin checking for collisions
      this.newDir.set(this.d.x * 0.866 - this.d.z * -0.5, 0 , this.d.x*(-0.5) + this.d.z* 0.866);
      this.ray.set(this.start, this.newDir);
      this.int = this.ray.intersectObjects(this._vision, false );

      // If collision then stop character
      if(this.int.length > 0){
        this._velocity.x = 0;
        this._velocity.y = 0;
        this._velocity.z = 0;
        return true;
      } 

      this.newDir.set(this.d.x , 0 , this.d.z);
      this.ray.set(this.start, this.newDir);
      this.int = this.ray.intersectObjects(this._vision, false );
      if(this.int.length > 0){
        this._velocity.x = 0;
        this._velocity.y = 0;
        this._velocity.z = 0;
        return true;
      } 

      this.newDir.set(this.d.x * 0.866 - this.d.z * 0.5, 0 , this.d.x * 0.5 + this.d.z* 0.866);
      this.ray.set(this.start, this.newDir);
      this.int = this.ray.intersectObjects(this._vision, false );
      if(this.int.length > 0){
        this._velocity.x = 0;
        this._velocity.y = 0;
        this._velocity.z = 0;
        return true;
      } 

      return false;
    }

    // Walk function to calculate the next position of this model in currect direction and velocity given input
    _Walk(timeInSeconds, input){
      this._stateMachine.Update(timeInSeconds, input);

      const velocity = this._velocity;
      this.frameDecceleration.set(
          velocity.x * this._decceleration.x,
          velocity.y * this._decceleration.y,
          velocity.z * this._decceleration.z
      );
      this.frameDecceleration.multiplyScalar(timeInSeconds);
      this.frameDecceleration.z = Math.sign(this.frameDecceleration.z) * Math.min(
          Math.abs(this.frameDecceleration.z), Math.abs(velocity.z));
  
      velocity.add(this.frameDecceleration);
  
      const acc = this._acceleration.clone();
      if (input._keys.shift) {
        acc.multiplyScalar(2.0);
      }
  
      if (input._keys.forward) {
        velocity.z += acc.z * timeInSeconds;
      }
      if (input._keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
      }
  
      this.oldPosition.copy(this._target.position);
  
      this.forward.set(0, 0, 1);
      this.forward.applyQuaternion(this._target.quaternion);
      this.forward.normalize();
      this.forward.multiplyScalar(velocity.z * timeInSeconds);
      const pos = this._target.position.clone();
      pos.add(this.forward);

      this._target.position.copy(pos);
      this._position.copy(pos);
      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
    }

    // Rotate model if left or right key pressed then check suroundings before walking
    _OnWalk(timeInSeconds ,input){
      const _R = this._target.quaternion.clone();

      if (input._keys.left) {
        this._A.set(0, 1, 0);
        this._Q.setFromAxisAngle(this._A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(this._Q);
      }
      if (input._keys.right) {
        this._A.set(0, 1, 0);
        this._Q.setFromAxisAngle(this._A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(this._Q);
      }

      this._target.quaternion.copy(_R);
      this._parent.SetQuaternion(this._target.quaternion);

      if(this._CheckSurroundings(input)){
        this._stateMachine.SetState('idle');
      }else{
        this._Walk(timeInSeconds , input);
      }
    }

    // Set the height of the model, cast a ray from a heigh downwards and set the position of the model to the first collition point
    _SetHeight(){
      this.start.copy(this._target.position);
      this.start.y += this._height ;
      this.ray.far = 20;
      this.ray.near = 0;
      this.ray.set(this.start, this.down);
      var int = this.ray.intersectObjects(this._vision, false )
      if(int.length > 0 ){
        if( int[0].distance > 0.2){
          this.p.copy(int[0].point);
          this._target.position.copy(this.p);
        }else{
          this._target.position.y -=0.3;
        }
      }
    }
    

    Update(timeInSeconds) {
      // Only update if model is in a valid state
      if (!this._stateMachine._currentState) {
        return;
      }  
      // Update mixer if it exists
      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }
      // Set the height of the model
      this._SetHeight();
      // Set the sate of the model to idle if it currently does not have the controls
      if (!this._active){
          this._stateMachine.SetState('idle');
      }else{
        // Otherwise get the input
        const input = this.GetComponent('BasicCharacterControllerInput');
        // Perform important input checks
        if (input._keys.switch){
          this._active = false;
        }
        if(input._keys.esc){
          this._params.esc = true;
        }
        // Walk given input
        this._OnWalk(timeInSeconds, input);
      }
    }
  };
  
  return {
    BasicCharacterControllerProxy: BasicCharacterControllerProxy,
    BasicCharacterController: BasicCharacterController,
  };

})();