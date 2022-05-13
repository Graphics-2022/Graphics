import * as THREE from '../modules/three.module.js';

import {FBXLoader} from '../modules/FBXLoader.js';

import {finite_state_machine} from './finite-state-machine.js';
import {entity} from './entity.js';
import {player_entity} from './player-entity.js'
import {player_state} from './player-state.js';


export const npc_entity = (() => {
  
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

  class NPCFSM extends finite_state_machine.FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this._Init();
    }

    _Init() {
      this._AddState('idle', player_state.IdleState);
      this._AddState('walk', player_state.WalkState);
    }
  };

  class NPCController extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);
    }

    _Init(params) {
      this._params = params;
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this._acceleration = new THREE.Vector3(1, 0.25, 40.0);
      this._velocity = new THREE.Vector3(0, 0, 0);
      this._position = new THREE.Vector3();
      this._time = 0.1;

      this._animations = {};
      this._input = new AIInput();
      this._stateMachine = new NPCFSM(new player_entity.BasicCharacterControllerProxy(this._animations));

      this._LoadModels();
    }

    InitComponent() {
      this._RegisterHandler('health.death', (m) => { this._OnDeath(m); });
      this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
    }

    _OnPosition(m) {
      if (this._target) {
        this._target.position.copy(m.value);
      }
    }

    _LoadModels() {
      const loader = new FBXLoader();
      loader.setPath('./resources/enemies/');
      loader.load('Vampire A Lusth.fbx', (fbx) => {
        fbx.name = 'enemy'
        this._target = fbx;
        //console.log(this._params.objects)
        this._target.scale.setScalar(0.035);
        this._target.position.copy(new THREE.Vector3(3, 2.5, -20));

        this._params.scene.add(this._target);
        this._bones = {};

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
        loader.setPath('./resources/enemies/');
        loader.load('Idle.fbx', (a) => { _OnLoad('idle', a); });
        //loader.load('Sneaking Forward.fbx', (a) => { _OnLoad('run', a); });
        loader.load('Mutant Walking.fbx', (a) => { _OnLoad('walk', a); });
        //loader.load('Button Pushing.fbx', (a) => { _OnLoad('attack', a); });
      });
    }

    get Position() {
      return this._position;
    }

    get Rotation() {
      if (!this._target) {
        return new THREE.Quaternion();
      }
      return this._target.quaternion;
    }

    // _FindIntersections(pos) {
    //   const _IsAlive = (c) => {
    //     const h = c.entity.GetComponent('HealthComponent');
    //     if (!h) {
    //       return true;
    //     }
    //     return h._health > 0;
    //   };

    //   const grid = this.GetComponent('SpatialGridController');
    //   const nearby = grid.FindNearbyEntities(2).filter(e => _IsAlive(e));
    //   const collisions = [];

    //   for (let i = 0; i < nearby.length; ++i) {
    //     const e = nearby[i].entity;
    //     const d = ((pos.x - e._position.x) ** 2 + (pos.z - e._position.z) ** 2) ** 0.5;

    //     // HARDCODED
    //     if (d <= 4) {
    //       collisions.push(nearby[i].entity);
    //     }
    //   }
    //   return collisions;
    // }

    _FindPlayer(pos) {
      const controlObject = this._target;
      let search = [];
      for (let i = -Math.PI/3; i <= Math.PI/3; i+=Math.PI/10){
        search.push(i);
      }
      const start = new THREE.Vector3();
      start.copy(controlObject.position);
      start.y +=2.5;
      let d = new THREE.Vector3();
      controlObject.getWorldDirection(d)
      let ray = new THREE.Raycaster();
      ray.far = 200;
      ray.near = 0;
      var int;
      
      let newDir =new THREE.Vector3(0,0,0)

      search.forEach((direction) => {
        newDir.x =d.x*Math.cos(direction) -d.z*Math.sin(direction);
        newDir.z =d.x*Math.sin(direction) +d.z*Math.cos(direction)
        ray.set(start, newDir);
        int = ray.intersectObjects(this._params.monsterVision )
        // var arrow = new THREE.ArrowHelper( ray.ray.direction, ray.ray.origin, ray.far, 0xff0000 );
        // this._params.scene.add(arrow)

        if(int.length > 0){
          if(int[0].object.parent.name == "girl"){
            console.log("player found")
            return true;
          }
        }  
      })

      return false;
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
      if( this._FindPlayer()){
        return; // end game
      }

      // const nearby = this._FindPlayer();
      var dirToPlayer =  new THREE.Vector3(0, 0, 0);

      const points = [ 
        new THREE.Vector3( 0, 0, 0 ), 
        new THREE.Vector3( 10, 0, 0 ),
        new THREE.Vector3( 10, 0, -20 ),
        new THREE.Vector3( 0, 0, -20 ),
        ];
    
      let path = new THREE.CatmullRomCurve3( points, true );
      this._time += timeInSeconds;
      // visualize the path
      // const lineGeometry = new THREE.BufferGeometry().setFromPoints( path.getPoints( 32 ) );
      // const lineMaterial = new THREE.LineBasicMaterial();
      // const line = new THREE.Line( lineGeometry, lineMaterial );
      // this._params.scene.add(line)
      const pos1=path.getPointAt( (this._time/7)%1);
      //console.log("time",(this._time/1)%1)
      // const pos=new THREE.Vector3(0,0,0);
      //console.log("pos",pos1)
      const dir = this._parent._position.clone();
      dir.sub(pos1);
      dir.y = 0.0;
      dir.normalize();

      dirToPlayer = dir;

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

      // if (nearby.length != 0) {
      //   // const dir = this._parent._position.clone();
      //   // dir.sub(nearby[0].entity._position);
      //   // dir.y = 0.0;
      //   // dir.normalize();

      //   // dirToPlayer = dir;

      //   // let v = new THREE.Vector3();
      //   // controlObject.getWorldDirection(v)
      //   // let angle = Math.PI - v.angleTo( dirToPlayer)

      //   // if (angle > Math.PI/3){
      //   //   dirToPlayer =  new THREE.Vector3(0, 0, 0);
      //   // }
      //   // //console.log(angle) // carry on here
      //   console.log('end game')
      // }
      
  
      this._input._keys.forward = false;

      const acc = this._acceleration;
      // if (dirToPlayer.length() == 0) {
        //return;
        //try putting AI walk here
      //     //trying the path thing
      
      //console.log("dir",dir)

      let v = new THREE.Vector3();
      controlObject.getWorldDirection(v)
      let angle = Math.PI - v.angleTo( dirToPlayer)

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

      // const collisions = this._FindIntersections(pos);
      // if (collisions.length > 0) {
      //   //this._input._keys.space = true;
      //   this._input._keys.forward = false; 
      //   return;
      // }

      controlObject.position.copy(pos);
      this._position.copy(pos);

      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
      //console.log(this._target)
    }

  Update(timeInSeconds) {
    if (!this._stateMachine._currentState) {
      return;
    }

    this._input._keys.space = false;
    this._input._keys.forward = false;

    this._UpdateAI(timeInSeconds);

    this._stateMachine.Update(timeInSeconds, this._input);

    // // HARDCODED
    // if (this._stateMachine._currentState._action) {
    //   this.Broadcast({
    //     topic: 'player.action',
    //     action: this._stateMachine._currentState.Name,
    //     time: this._stateMachine._currentState._action.time,
    //   });
    // }
    
    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
};

  return {
    NPCController: NPCController,
  };

})();