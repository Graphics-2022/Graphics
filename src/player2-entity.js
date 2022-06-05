import * as THREE from '../modules/three.module.js';
import {FBXLoader} from '../modules/FBXLoader.js';
import {entity} from './entity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';
import { particle_system } from './particle-system.js';

export const player2_entity = (() => {

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
        const loader = new FBXLoader(this._params.loadingManager);
        loader.setPath('./resources/mouse/');
        loader.load('mouse2.fbx', (fbx) => {
          fbx.name = 'mouse'
          this._target = fbx;
          this._target.position.copy(this._parent.Position);
          this._target.quaternion.copy(this._parent.Quaternion);

          this._target.scale.setScalar(0.015);
          this._params.scene.add(this._target);
          this._dist = 1;
          this._height = 1.8;

          this._target.traverse(c => {
            c.castShadow = true;
            c.receiveShadow = true;
            if (c.material && c.material.map) {
              c.material.map.encoding = THREE.sRGBEncoding;
            }
            this._params.playerVision.push(c)
            this._vision = this._params.player2Vision;

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

          this._manager = new THREE.LoadingManager(this._params.loadingManager);
          this._manager.onLoad = () => {
            this._stateMachine.SetState('idle');

          };
    
          const loader = new FBXLoader(this._manager);
          loader.setPath('./resources/mouse/');
          loader.load('Idle.fbx', (a) => { _OnLoad('idle', a); });
          loader.load('Fast Run.fbx', (a) => { _OnLoad('walk', a); });
          loader.load('Fast Run (1).fbx', (a) => { _OnLoad('run', a); });

            this._InitParticles(this._target.position, 300);

        });
        this._input = new AIInput();

        // init all objects once
        this.blocked;
        this.search = [];
        this.d = new THREE.Vector3();
        this.newDir =new THREE.Vector3(0,0,0);
        this.start = new THREE.Vector3();
        this.ray = new THREE.Raycaster();
        this.int ;
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
        this.mainPlayer = this._params.entityManager.Get('player');
    }



    _CheckSurroundings(input){
      this._target.getWorldDirection(this.d)
      if (input._keys.backward){
        this.d.z *= -1;
        this.d.x *= -1;
      }

      this.start.copy(this._target.position);
      this.start.y += this._height;

      this.ray.far = this._dist;
      this.ray.near = 0;
      this.newDir.set(this.d.x * 0.866 - this.d.z * -0.5, 0 , this.d.x*(-0.5) + this.d.z* 0.866);
      this.ray.set(this.start, this.newDir);
      this.int = this.ray.intersectObjects(this._vision, false );
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
      // var arrow = new THREE.ArrowHelper( this.ray.ray.direction, this.ray.ray.origin, this.ray.far, 0xff0000 );
      // this._params.scene.add(arrow)

      this.newDir.set(this.d.x * 0.866 - this.d.z * 0.5, 0 , this.d.x * 0.5 + this.d.z* 0.866);
      this.ray.set(this.start, this.newDir);
      this.int = this.ray.intersectObjects(this._vision, false );
      if(this.int.length > 0){
        this._velocity.x = 0;
        this._velocity.y = 0;
        this._velocity.z = 0;
        // this.blocked = true;
        return true;
      } 

      return false;
    }

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
  
      this.sideways.set(1, 0, 0);
      this.sideways.applyQuaternion(this._target.quaternion);
      this.sideways.normalize();
  
      this.sideways.multiplyScalar(velocity.x * timeInSeconds);
      this.forward.multiplyScalar(velocity.z * timeInSeconds);
      const pos = this._target.position.clone();
      pos.add(this.forward);
      pos.add(this.sideways);
      // console.log(this._params.mouseMaxDistance)
      if(this._type == 'mouse' && pos.distanceTo(this.mainPlayer._position) > this._params.mouseMaxDistance){
        return;
      }

      this._target.position.copy(pos);
      this._position.copy(pos);
      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
    }

    _GoToPlayer(){

        this.mainPlayer.GetComponent("BasicCharacterController")._target.getWorldDirection(this.d)

  
        this.start.copy(this.mainPlayer.Position);
        this.start.y += this._height;
        // newDir.x =d.x*Math.cos(direction) -d.z*Math.sin(direction);
        // newDir.z =d.x*Math.sin(direction) +d.z*Math.cos(direction)

        this.ray.far = 5;
        this.ray.near = 0;
        this.newDir.set(- this.d.z * -1, 0 , this.d.x*(-1));
        this.ray.set(this.start, this.newDir);
        //      var arrow = new THREE.ArrowHelper( this.ray.ray.direction, this.ray.ray.origin, this.ray.far, 0xff0000 );
        // this._params.scene.add(arrow)
        this.int = this.ray.intersectObjects(this._vision, false );
        if(this.int.length == 0){
          this._target.position.copy(this.mainPlayer.Position)
          this._target.position.addScaledVector(this.newDir.normalize(), 3)
          this._particles.AddParticles(this._target.position, 20);
          return ;
        } 

        this.newDir.set(- this.d.z * 1, 0 , this.d.x*(1));
        this.ray.set(this.start, this.newDir);
        //      var arrow = new THREE.ArrowHelper( this.ray.ray.direction, this.ray.ray.origin, this.ray.far, 0xff0000 );
        // this._params.scene.add(arrow)
        this.int = this.ray.intersectObjects(this._vision, false );
        if(this.int.length == 0){
          this._target.position.copy(this.mainPlayer.Position)
          this._target.position.addScaledVector(this.newDir.normalize(), 3)
          this._particles.AddParticles(this._target.position, 20);
          return ;
        } 
  
        this.newDir.set(this.d.x -1 , 0 , this.d.z -1);
        this.ray.set(this.start, this.newDir);
        this.int = this.ray.intersectObjects(this._vision, false );
        if(this.int.length == 0){
            this._target.position.copy(this.mainPlayer.Position)
            this._target.position.addScaledVector(this.newDir.normalize(), 3)
            this._particles.AddParticles(this._target.position, 20);
            return ;
        }
        // var arrow = new THREE.ArrowHelper( this.ray.ray.direction, this.ray.ray.origin, this.ray.far, 0xff0000 );
        // this._params.scene.add(arrow)
  
        this.newDir.set(this.d.x  , 0 , this.d.z );
        this.ray.set(this.start, this.newDir);
        this.int = this.ray.intersectObjects(this._vision, false );
        if(this.int.length == 0){
            this._target.position.copy(this.mainPlayer.Position)
            this._target.position.addScaledVector(this.newDir.normalize(), 3)
            this._particles.AddParticles(this._target.position, 20);
            return ;
        }
  
        return false;
    }

    _OnAIWalk(timeInSeconds) {
      const _R = this._target.quaternion.clone();
      const dir = this._target.position.clone();

      dir.sub(this._params.entityManager.Get('player')._position)
      dir.y = 0.0;
      dir.normalize();
      const dirToPlayer = dir;

      this.m.lookAt(this.eye,dirToPlayer,this.up);
      _R.setFromRotationMatrix(this.m);
      this._target.quaternion.copy(_R);

      let distanceToPlayer = this._target.position.distanceTo(this.mainPlayer._position);
      if ( distanceToPlayer < 5){
          this._stateMachine.SetState('idle');
          this._velocity.x = 0;
          this._velocity.y = 0;
          this._velocity.z = 0;
        return;
      }else if ( distanceToPlayer > 10){
        this._GoToPlayer();
      }

      if(this._CheckSurroundings(this._input)){
        this._stateMachine.SetState('idle');
      }else{
        this._input._keys.forward = true;
        this._input._keys.shift = true;
        this._Walk(timeInSeconds , this._input);
      }
    }

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

    _SetHeight(){
      this.start.copy(this._target.position);
      this.start.y += this._height ;
      this.ray.far = 20;
      this.ray.near = 0;
      this.ray.set(this.start, this.down);
      var int = this.ray.intersectObjects(this._vision, false )
      // var arrow = new THREE.ArrowHelper( ray.ray.direction, ray.ray.origin, ray.far, 0xff0000 );
      //   this._params.scene.add(arrow)
      if(int.length > 0 ){
        if( int[0].distance > 0.2){
          // const p = new THREE.Vector3();
          this.p.copy(int[0].point);
          this._target.position.copy(this.p);
        }else{
          this._target.position.y -=0.3;
        }
      }
    }

    _InitParticles(){
        this._particles = new particle_system.ParticleSystem({
            camera: this._params.camera,
            parent: this._params.scene,
            texture: './resources/textures/ball.png',
        });
        this._particles._alphaSpline.AddPoint(0.0, 0.0);
        this._particles._alphaSpline.AddPoint(0.1, 1.0);
        this._particles._alphaSpline.AddPoint(0.7, 1.0);
        this._particles._alphaSpline.AddPoint(1.0, 0.0);
        
        this._particles._colourSpline.AddPoint(0.0, new THREE.Color(0x00FF00));
        this._particles._colourSpline.AddPoint(0.5, new THREE.Color(0x40C040));
        this._particles._colourSpline.AddPoint(1.0, new THREE.Color(0xFF4040));
        
        this._particles._sizeSpline.AddPoint(0.0, 0.05);
        this._particles._sizeSpline.AddPoint(0.5, 0.25);
        this._particles._sizeSpline.AddPoint(1.0, 0.0);

        // this._particles.AddParticles(new THREE.Vector3(-7, 2, -23), 500);
        
        // this._params.scene.add(this._particles)

    }


    Update(timeInSeconds) {
      if (!this._stateMachine._currentState) {
        return;
      }  

      if (this._particles._particles.length != 0) {
        this._particles.Step(timeInSeconds);

      }

      // console.log(this._particles)

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      this._SetHeight();

      if (!this._active){
          this._OnAIWalk(timeInSeconds);
      }else{
        const input = this.GetComponent('BasicCharacterControllerInput');
        if (input._keys.switch){
            // console.log(dsthis._params.scene)
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