import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

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
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this._acceleration = new THREE.Vector3(1, 0.125, 50.0);
      this._velocity = new THREE.Vector3(0, 0, 0);
      this._position = new THREE.Vector3();
  
      this._animations = {};
      this._stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this._animations));
  
      this._LoadModels();
    }

    InitComponent() {
      this._RegisterHandler('health.death', (m) => { this._OnDeath(m); });
    }

    _OnDeath(msg) {
      this._stateMachine.SetState('death');
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
        loader.load('mouse.fbx', (fbx) => {
          this._target = fbx;
          this._target.position.copy(new THREE.Vector3(3, 0, 0));
          this._position.copy(new THREE.Vector3(3, 0, 0));
          this._target.scale.setScalar(0.015);
          this._params.scene.add(this._target);
    
          this._bones = {};
          //console.log(this._target)

          this._target.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.encoding = THREE.sRGBEncoding;
            }
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
          //loader.load('Sneaking Forward.fbx', (a) => { _OnLoad('run', a); });
          loader.load('Fast Run.fbx', (a) => { _OnLoad('walk', a); });
          //loader.load('Button Pushing.fbx', (a) => { _OnLoad('attack', a); });
          // loader.load('Sword And Shield Death.fbx', (a) => { _OnLoad('death', a); });
        });
        this._input = new AIInput();
      }else{
        const loader = new FBXLoader();
        loader.setPath('./resources/girl/');
        loader.load('girl.fbx', (fbx) => {
          this._target = fbx;
          this._target.scale.setScalar(0.035);
          this._params.scene.add(this._target);
    
          this._bones = {};
          console.log(this._target)

          this._target.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.encoding = THREE.sRGBEncoding;
            }
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
          // loader.load('Sword And Shield Death.fbx', (a) => { _OnLoad('death', a); });
        });
    }
    }

    _FindIntersections(pos) {
      const _IsAlive = (c) => {
        const h = c.entity.GetComponent('HealthComponent');
        if (!h) {
          return true;
        }
        return h._health > 0;
      };

      const grid = this.GetComponent('SpatialGridController');  
      const nearby = grid.FindNearbyEntities(2).filter(e => _IsAlive(e));
      const collisions = [];

      for (let i = 0; i < nearby.length; ++i) {
         const e = nearby[i].entity;
         const d = ((pos.x - e._position.x) ** 2 + (pos.z - e._position.z) ** 2) ** 0.5;

         // HARDCODED
         if (d <= 4) {
           collisions.push(nearby[i].entity);
         }
       }
      return collisions;
    }

    _FindPlayer(pos) {
      // const _IsAlivePlayer = (c) => {
      //   const h = c.entity.GetComponent('HealthComponent');
      //   if (!h) {
      //     return false;
      //   }
      //   if (c.entity.Name != 'player') {
      //     return false;
      //   }
      //   return h._health > 0;
      // };

      const grid = this.GetComponent('SpatialGridController');
      const nearby = grid.FindNearbyEntities(20).filter(c => c.entity.Name == 'player'); //find player within 20 units

      if (nearby.length == 0) {
        return new THREE.Vector3(0, 0, 0);
      }

      const dir = this._parent._position.clone();
      dir.sub(nearby[0].entity._position);
      dir.y = 0.0;
      dir.normalize();

      return dir;
    }

    _UpdateAI(timeInSeconds) {
      const currentState = this._stateMachine._currentState;
      if (currentState.Name != 'walk' &&
          currentState.Name != 'run' &&
          currentState.Name != 'idle') {
        return;
      }

      if (currentState.Name == 'death') {
        return;
      }

      if (currentState.Name == 'idle' ||
          currentState.Name == 'walk') {
        this._OnAIWalk(timeInSeconds);
      }
    }

    _OnAIWalk(timeInSeconds) {
      const dirToPlayer = this._FindPlayer();

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

      const controlObject = this._target;
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = controlObject.quaternion.clone();

      
      this._input._keys.forward = false;

      const acc = this._acceleration;
      if (dirToPlayer.length() == 0) {
        return;
      }

      this._input._keys.forward = true;
      velocity.z += acc.z * timeInSeconds;

      const m = new THREE.Matrix4();
      m.lookAt(
          new THREE.Vector3(0, 0, 0),
          dirToPlayer,
          new THREE.Vector3(0, 1, 0));
      _R.setFromRotationMatrix(m);
  
      controlObject.quaternion.copy(_R);
  
      const oldPosition = new THREE.Vector3();
      oldPosition.copy(controlObject.position);
  
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(controlObject.quaternion);
      forward.normalize();
  
      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(controlObject.quaternion);
      sideways.normalize();
  
      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);
  
      const pos = controlObject.position.clone();
      pos.add(forward);
      pos.add(sideways);

      const collisions = this._FindIntersections(pos);
      if (collisions.length > 0) {
        //this._input._keys.space = true;
        this._input._keys.forward = false;
        return;
      }

      controlObject.position.copy(pos);
      this._position.copy(pos);
  
      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
    }
    

    Update(timeInSeconds) {
      if (!this._stateMachine._currentState) {
        return;
      }  

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      if (!this._active){
        if(this._type == 'mouse'){
          this._UpdateAI(timeInSeconds);
          this._stateMachine.Update(timeInSeconds, this._input);
        }else{
          this._stateMachine.SetState('idle');
        }
        return;
      }

      const input = this.GetComponent('BasicCharacterControllerInput');
      this._stateMachine.Update(timeInSeconds, input);

      if (input._keys.switch){
        this._active = false;
      }

      // HARDCODED
      if (this._stateMachine._currentState._action) {
        this.Broadcast({
          topic: 'player.action',
          action: this._stateMachine._currentState.Name,
          time: this._stateMachine._currentState._action.time,
        });
      }

      const currentState = this._stateMachine._currentState;
      if (currentState.Name != 'walk' &&
          currentState.Name != 'run' &&
          currentState.Name != 'idle') {
        return;
      }
      
    
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
  
      const controlObject = this._target;
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = controlObject.quaternion.clone();
  
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

      
  
      controlObject.quaternion.copy(_R);
  
      const oldPosition = new THREE.Vector3();
      oldPosition.copy(controlObject.position);
  
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(controlObject.quaternion);
      forward.normalize();
  
      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(controlObject.quaternion);
      sideways.normalize();
  
      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);
  
      const pos = controlObject.position.clone();
      pos.add(forward);
      pos.add(sideways);

      const collisions = this._FindIntersections(pos);
      if (collisions.length > 0) {
        return;
      }

      controlObject.position.copy(pos);
      this._position.copy(pos);
  
      this._parent.SetPosition(this._position);

      this._parent.SetQuaternion(this._target.quaternion);
    }
  };
  
  return {
      BasicCharacterControllerProxy: BasicCharacterControllerProxy,
      BasicCharacterController: BasicCharacterController,
  };

})();