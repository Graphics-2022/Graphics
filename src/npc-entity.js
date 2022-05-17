import * as THREE from '../modules/three.module.js';

import {FBXLoader} from '../modules/FBXLoader.js';

import {finite_state_machine} from './finite-state-machine.js';
import {entity} from './entity.js';
import {player_entity} from './player-entity.js'
import {player_state} from './player-state.js';
import {spotlight_material} from '../modules/spotlightmaterial.js'
// import {SkeletonUtils} from '../modules/SkeletonUtils.js'



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
    constructor(params, type , points) {
      super();
      this._type = type;
      this._points = points
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
      if(this._type == 'npc1'){
      const loader = new FBXLoader();
      loader.setPath('./resources/enemies/mutant/');
      loader.load('Vampire A Lusth.fbx', (fbx) => {
        fbx.name = 'enemy'
        this._target = fbx;
        //console.log(this._params.objects)
        this._target.scale.setScalar(0.035);
        this._target.position.copy(this._parent.Position);
        this._target.quaternion.copy(this._parent.Quaternion);

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


        // let x  = SkeletonUtils.clone(fbx.scene);
        // x.position.copy(new THREE.Vector3(-3, 2.5, -20));
        // this._params.scene.add(x);

        };
  
        const loader = new FBXLoader(this._manager);
        loader.setPath('../resources/enemies/mutant/');
        loader.load('Idle.fbx', (a) => { _OnLoad('idle', a); });
        //loader.load('Sneaking Forward.fbx', (a) => { _OnLoad('run', a); });
        loader.load('Mutant Walking.fbx', (a) => { _OnLoad('walk', a); });
        //loader.load('Button Pushing.fbx', (a) => { _OnLoad('attack', a); });

        this._targetObject = new THREE.Object3D();
        this._targetObject.position.copy(this._target.position);
        // this._targetObject.position.y += 5.9
        // this._targetObject.position.z += 2.2

        // add spot light
        var geometry    = new THREE.CylinderGeometry( 0.1, 7, 20, 322, 20, true);
        geometry.applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
        geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

        var material    = new spotlight_material.SpotlightMaterial().GetMaterial();
        this._mesh    = new THREE.Mesh( geometry, material );
        this._mesh.position.copy(this._target.position);
        this._mesh.position.y+= 6;
        this._mesh.position.z+= 1.8;

        this._mesh.lookAt(this._targetObject.position)
        material.uniforms.lightColor.value.set('red')
        material.uniforms.spotPosition.value    = this._mesh.position
        material.uniforms.attenuation.value    = 100
        material.uniforms.anglePower.value    = 2
        this._params.scene.add( this._mesh );

        this._spotLight    = new THREE.SpotLight( 0xff0909 , 8 , 200 , Math.PI/10 )
        this._spotLight.position.copy(this._mesh.position)
        this._spotLight.exponent    = 30
        this._spotLight.intensity    = 5
        this._spotLight.target = this._targetObject;
        this._spotLight.castShadow = true;
        this._spotLight.shadow.bias = -0.005;

        this._spotLight.shadow.mapSize.width = 512; // default
        this._spotLight.shadow.mapSize.height = 512; // default
        this._spotLight.shadow.camera.near = 2; // default
        this._spotLight.shadow.camera.far = 100; // default
        this._spotLight.shadow.focus = 1; // default

        this._params.scene.add( this._spotLight  )
        this._params.scene.add( this._spotLight.target);
      });
    }else{
      const loader = new FBXLoader();
      loader.setPath('./resources/enemies/aure/');
      loader.load('Vampire A Lusth.fbx', (fbx) => {
        fbx.name = 'enemy'
        this._target = fbx;
        //console.log(this._params.objects)
        this._target.scale.setScalar(0.035);
        this._target.position.copy(this._parent.Position);
        this._target.quaternion.copy(this._parent.Quaternion);

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


        // let x  = SkeletonUtils.clone(fbx.scene);
        // x.position.copy(new THREE.Vector3(-3, 2.5, -20));
        // this._params.scene.add(x);

        };
  
        const loader = new FBXLoader(this._manager);
        loader.setPath('../resources/enemies/aure/');
        loader.load('Idle copy.fbx', (a) => { _OnLoad('idle', a); });
        //loader.load('Sneaking Forward.fbx', (a) => { _OnLoad('run', a); });
        loader.load('Mutant Walking.fbx', (a) => { _OnLoad('walk', a); });
        //loader.load('Button Pushing.fbx', (a) => { _OnLoad('attack', a); });

        this._targetObject = new THREE.Object3D();
        this._targetObject.position.copy(this._target.position);
        // this._targetObject.position.y += 5.9
        // this._targetObject.position.z += 2.2

        // add spot light
        var geometry    = new THREE.CylinderGeometry( 0.1, 7, 20, 322, 20, true);
        geometry.applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
        geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

        var material    = new spotlight_material.SpotlightMaterial().GetMaterial();
        this._mesh    = new THREE.Mesh( geometry, material );
        this._mesh.position.copy(this._target.position);
        this._mesh.position.y+= 6;
        this._mesh.position.z+= 1.8;

        this._mesh.lookAt(this._targetObject.position)
        material.uniforms.lightColor.value.set('red')
        material.uniforms.spotPosition.value    = this._mesh.position
        material.uniforms.attenuation.value    = 100
        material.uniforms.anglePower.value    = 2
        this._params.scene.add( this._mesh );

        this._spotLight    = new THREE.SpotLight( 0xff0909 , 8 , 200 , Math.PI/10 )
        this._spotLight.position.copy(this._mesh.position)
        this._spotLight.exponent    = 30
        this._spotLight.intensity    = 5
        this._spotLight.target = this._targetObject;
        this._spotLight.castShadow = true;
        this._spotLight.shadow.bias = -0.005;

        this._spotLight.shadow.mapSize.width = 512; // default
        this._spotLight.shadow.mapSize.height = 512; // default
        this._spotLight.shadow.camera.near = 2; // default
        this._spotLight.shadow.camera.far = 100; // default
        this._spotLight.shadow.focus = 1; // default

        this._params.scene.add( this._spotLight  )
        this._params.scene.add( this._spotLight.target);
      });
    }


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

    _FindPlayer() {
      let found = false;
      const controlObject = this._target;
      let search = [];
      for (let i = -Math.PI/10; i <= Math.PI/10; i+=Math.PI/12){
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
        int = ray.intersectObjects(this._params.monsterVision, false )
        // var arrow = new THREE.ArrowHelper( ray.ray.direction, ray.ray.origin, ray.far, 0xff0000 );
        // this._params.scene.add(arrow)

        if(int.length > 0){
          if(int[0].object.parent.name == "girl"){
            console.log("player found")
            found = true;
            return;
          }
        }  
      })
      return found;
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
      
      var dirToPlayer =  new THREE.Vector3(0, 0, 0);

      let path = new THREE.CatmullRomCurve3( this._points, true );
      this._time += timeInSeconds;
      // visualize the path
      // const lineGeometry = new THREE.BufferGeometry().setFromPoints( path.getPoints( 32 ) );
      // const lineMaterial = new THREE.LineBasicMaterial();
      // const line = new THREE.Line( lineGeometry, lineMaterial );
      // this._params.scene.add(line)
      const pos1=path.getPointAt( (this._time/6)%1);
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
      const _R = controlObject.quaternion.clone();

      this._input._keys.forward = false;

      const acc = this._acceleration;

      let v = new THREE.Vector3();
      controlObject.getWorldDirection(v)

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

      let d = new THREE.Vector3();
      controlObject.getWorldDirection(d);

      
      this._mesh.position.copy(pos);
      this._mesh.position.addScaledVector(d, 1.5);
      this._mesh.position.y+= 5.5;
      this._spotLight.position.copy(this._mesh.position);
      
      pos.add(forward);
      pos.add(sideways);

      controlObject.position.copy(pos);
      this._position.copy(pos);
      this._targetObject.position.copy(pos);
      this._targetObject.position.addScaledVector(d, 20);
      this._mesh.lookAt(this._targetObject.position);

      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
    }

  Update(timeInSeconds) {
    if (!this._stateMachine._currentState) {
      return;
    }
     
    if(this._FindPlayer()){
      this._params.playerFound = true;
      return;
    }

    this._input._keys.space = false;
    this._input._keys.forward = false;

    this._UpdateAI(timeInSeconds);
    this._stateMachine.Update(timeInSeconds, this._input);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
};

  return {
    NPCController: NPCController,
  };

})();