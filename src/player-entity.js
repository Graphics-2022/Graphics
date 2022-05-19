import * as THREE from '../modules/three.module.js';

import {FBXLoader} from '../modules/FBXLoader.js';

import {entity} from './entity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';


export const player_entity = (() => {

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
      this._AddState('attack', player_state.AttackState);
      this._AddState('death', player_state.DeathState);
    }
  };
  
  class BasicCharacterControllerProxy {
    constructor(animations) {
      this._animations = animations;
    }
  
    get animations() {
      return this._animations;
    }
  };

  class AIInput {
    constructor() {
      this._Init();    
    }

    _Init() {
      this._keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        space: false,
        shift: false,
      };
    }
  };


  class BasicCharacterController extends entity.Component {
    constructor(params,type, active) {
      super();
      this._type = type;
      this._active = active;
      this._Init(params);
    }

    _Init(params) {
      this._params = params;
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -10.0);
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


    GetActive(){
      return this._active;
    }

    SetActive(a){
      this._active = a;
    }

    _LoadModels() {
      if (this._type == 'mouse'){

        const loader = new FBXLoader();
        loader.setPath('./resources/mouse/');
        loader.load('mouse1.fbx', (fbx) => {
          fbx.name = 'mouse'
          this._target = fbx;
          this._target.position.copy(this._parent.Position);
          // this._target.quaternion.copy(_R);
          console.log(this._parent.Quaternion)
          this._target.quaternion.copy(this._parent.Quaternion);

          this._target.scale.setScalar(0.015);
          this._params.scene.add(this._target);
          this._bones = {};
          this._dist = 1;
          this._vision = this._params.player2Vision;
          this._target.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.encoding = THREE.sRGBEncoding;
            }
            this._params.playerVision.push(c)

          });

          this._mixer = new THREE.AnimationMixer(this._target);

          const _OnLoad = (animName, anim) => {
            const clip = anim.animations[0];
            const action = this._mixer.clipAction(clip);
      
            this._animations[animName] = {
              clip: clip,
              action: action,
            };
          };

          this._manager = new THREE.LoadingManager();
          this._manager.onLoad = () => {
          this._stateMachine.SetState('idle');
          };
    
          const loader = new FBXLoader(this._manager);
          loader.setPath('./resources/mouse/');
          loader.load('Idle.fbx', (a) => { _OnLoad('idle', a); });
          loader.load('Fast Run.fbx', (a) => { _OnLoad('walk', a); });
          loader.load('Fast Run (1).fbx', (a) => { _OnLoad('run', a); });

        });
        this._input = new AIInput();
      }else{
        const loader = new FBXLoader();
        loader.setPath('./resources/girl/');
        loader.load('girl1.fbx', (fbx) => {
          this._target = fbx;
          this._target.scale.setScalar(0.035);
          this._target.name = "girl"
          this._params.scene.add(this._target);
          this._dist = 2;
          this._target.position.copy(this._parent.Position);
          // console.log(this._parent.Quaternion)

          this._target.quaternion.copy(this._parent.Quaternion);

          this._vision = this._params.playerVision;
          this._bones = {};
          this._height = 0.7;

          this._target.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.encoding = THREE.sRGBEncoding;
            }
            this._params.monsterVision.push(c)
            this._params.player2Vision.push(c)

          });

          this._mixer = new THREE.AnimationMixer(this._target);

          const _OnLoad = (animName, anim) => {
            const clip = anim.animations[0];
            const action = this._mixer.clipAction(clip);
      
            this._animations[animName] = {
              clip: clip,
              action: action,
            };
          };

          this._manager = new THREE.LoadingManager();
          this._manager.onLoad = () => {
          this._stateMachine.SetState('idle');
          };
    
          const loader = new FBXLoader(this._manager);
          loader.setPath('./resources/girl/');
          loader.load('Female Crouch Pose.fbx', (a) => { _OnLoad('idle', a); });
          loader.load('Sneaking Forward.fbx', (a) => { _OnLoad('run', a); });
          loader.load('Crouched Walking.fbx', (a) => { _OnLoad('walk', a); });
          loader.load('Button Pushing.fbx', (a) => { _OnLoad('attack', a); });
        });
      }
    }

    _CheckSurroundings(input){
      let blocked = false;
      let search = [];

      for (let i = -Math.PI/6; i <= Math.PI/6; i+=Math.PI/6){
        search.push(i);
      }

      let d = new THREE.Vector3();
      this._target.getWorldDirection(d)

      if (input._keys.backward){
        d.z *= -1;
        d.x *= -1;
      }

      let newDir =new THREE.Vector3(0,0,0)
      
      const start = new THREE.Vector3();
      start.copy(this._target.position);
      start.y +=1.7;
      let ray = new THREE.Raycaster();

      ray.far = this._dist;
      ray.near = 0;
      search.forEach((direction) => {
        newDir.x =d.x*Math.cos(direction) -d.z*Math.sin(direction);
        newDir.z =d.x*Math.sin(direction) +d.z*Math.cos(direction)
        ray.set(start, newDir);
        var int = ray.intersectObjects(this._vision, false )
        // var arrow = new THREE.ArrowHelper( ray.ray.direction, ray.ray.origin, ray.far, 0xff0000 );
        // this._params.scene.add(arrow)
        if(int.length > 0){
            this._velocity.x = 0;
            this._velocity.y = 0;
            this._velocity.z = 0;
            blocked = true;
            return;
        }  
      })

      return blocked;
    }

    _Walk(timeInSeconds, input){
      this._stateMachine.Update(timeInSeconds, input);

      const velocity = this._velocity;
      const frameDecceleration = new THREE.Vector3(
          velocity.x * this._decceleration.x,
          velocity.y * this._decceleration.y,
          velocity.z * this._decceleration.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
          Math.abs(frameDecceleration.z), Math.abs(velocity.z));
  
      velocity.add(frameDecceleration);
  
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
  
      const oldPosition = new THREE.Vector3();
      oldPosition.copy(this._target.position);
  
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(this._target.quaternion);
      forward.normalize();
  
      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(this._target.quaternion);
      sideways.normalize();
  
      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);
      const pos = this._target.position.clone();
      pos.add(forward);
      pos.add(sideways);

      this._target.position.copy(pos);
      this._position.copy(pos);
  
      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
    }

    _OnAIWalk(timeInSeconds) {
      const currentState = this._stateMachine._currentState;

      if ( !(currentState.Name == 'idle' || currentState.Name == 'walk')) {
          return;
      }

      const controlObject = this._target;
      const _R = controlObject.quaternion.clone();
      const dir = controlObject.position.clone();

      dir.sub(this._params.entityManager.Get('player')._position)
      dir.y = 0.0;
      dir.normalize();
      const dirToPlayer = dir;

      const m = new THREE.Matrix4();
      m.lookAt(
          new THREE.Vector3(0, 0, 0),
          dirToPlayer,
          new THREE.Vector3(0, 1, 0));
      _R.setFromRotationMatrix(m);
      controlObject.quaternion.copy(_R);

      if (controlObject.position.distanceTo(this._params.entityManager.Get('player')._position) < 5){
          this._stateMachine.SetState('idle');
          this._velocity.x = 0;
          this._velocity.y = 0;
          this._velocity.z = 0;
        return;
      }

      if(this._CheckSurroundings(this._input)){
        this._stateMachine.SetState('idle');
      }else{
        this._input._keys.forward = true;
        // this._input._keys.shift = true;
        this._Walk(timeInSeconds , this._input);
      }
    }

    _OnWalk(timeInSeconds ,input){
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = this._target.quaternion.clone();

      if (input._keys.left) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }
      if (input._keys.right) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }

      this._target.quaternion.copy(_R);
      this._parent.SetQuaternion(this._target.quaternion);

      if(this._CheckSurroundings(input)){
        this._stateMachine.SetState('idle');
      }else{
        this._Walk(timeInSeconds , input);
      }
    }

    _SetHeight(){
      const start = new THREE.Vector3();
      start.copy(this._target.position);
      start.y +=3 ;
      let ray = new THREE.Raycaster();
      ray.far = 20;
      ray.near = 0;
      ray.set(start, new THREE.Vector3(0,-1,0));
      var int = ray.intersectObjects(this._vision, false )
      // var arrow = new THREE.ArrowHelper( ray.ray.direction, ray.ray.origin, ray.far, 0xff0000 );
      //   this._params.scene.add(arrow)
      if(int.length > 0 ){
        if( int[0].distance > 0.2){
          const p = new THREE.Vector3();
          p.copy(int[0].point);
          this._target.position.copy(p);
        }else{
          this._target.position.y -=0.3;
        }
      }
    }
    

    Update(timeInSeconds) {
      if (!this._stateMachine._currentState) {
        return;
      }  

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      this._SetHeight();

      if (!this._active){
        if(this._type == 'mouse'){    
          this._OnAIWalk(timeInSeconds);
          this._stateMachine.Update(timeInSeconds, this._input);
        }else{
          this._stateMachine.SetState('idle');
        }
      }else{
        const input = this.GetComponent('BasicCharacterControllerInput');
        if (input._keys.switch){
          this._active = false;
        }
        this._OnWalk(timeInSeconds, input);
      }
    }
  };
  
  return {
      BasicCharacterControllerProxy: BasicCharacterControllerProxy,
      BasicCharacterController: BasicCharacterController,
  };

})();