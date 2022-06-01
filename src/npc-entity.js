import * as THREE from '../modules/three.module.js';
import {FBXLoader} from '../modules/FBXLoader.js';
import {finite_state_machine} from './finite-state-machine.js';
import {entity} from './entity.js';
import {player_entity} from './player-entity.js'
import {player_state} from './player-state.js';
import {spotlight_material} from '../modules/spotlightmaterial.js'
import * as SkeletonUtils from '../modules/SkeletonUtils.js'


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
    constructor(params, type , points , npcManager) {
      super();
      this._type = type;
      this._points = points;
      this._npcManager = npcManager;
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
      this._input = new AIInput();
      this._stateMachine = new NPCFSM(new player_entity.BasicCharacterControllerProxy(this._animations));

      this._LoadModels();
    }

    _LoadModels() {

      if(this._type == 'npc1'){
        const loader = new FBXLoader( this._npcManager);
        loader.setPath('./resources/enemies/mutant/');
        loader.load('monster1.fbx', (fbx) => {
          this._target= fbx;
          this._setModel();
        });
      }else{
        this._target = SkeletonUtils.clone(this._params.entityManager.Get('npc1').GetComponent("NPCController")._target);
        this._parent = this._params.entityManager.Get(this._type);
        this._setModel();
      }
    }

    _setModel(){
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
        // console.log(this._type,this._mixer)

      };

      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {

        this._stateMachine.SetState('walk');

      };

      const loader1 = new FBXLoader(this._manager);
      loader1.setPath('../resources/enemies/mutant/');
      loader1.load('Idle.fbx', (a) => { _OnLoad('idle', a); });
      loader1.load('Mutant Walking.fbx', (a) => { _OnLoad('walk', a); });

      this._targetObject = new THREE.Object3D();
      this._targetObject.position.copy(this._target.position);

      // add spot light
      var geometry    = new THREE.CylinderGeometry( 0.1, 7, 20, 322, 20, true);
      geometry.applyMatrix4( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
      geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

      var material    = new spotlight_material.SpotlightMaterial().GetMaterial();
      this._mesh    = new THREE.Mesh( geometry, material );
      this._mesh.position.copy(this._target.position);

      this._mesh.lookAt(this._targetObject.position)
      material.uniforms.lightColor.value.set('red')
      material.uniforms.spotPosition.value    = this._mesh.position
      material.uniforms.attenuation.value    = 50
      material.uniforms.anglePower.value    = 2
      this._params.scene.add( this._mesh );

      this._spotLight    = new THREE.SpotLight( 0xff0909 , 8 , 200 , Math.PI/10 )
      this._spotLight.position.copy(this._target.position)
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
      this.ray.far = 100;
      this.ray.near = 0;
      this.int;
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
      let playerPos = this._params.entityManager.Get('player')._position
      if (this._target.position.distanceTo(playerPos) > 30){
        return false;
      }
      const dir = this._target.position.clone();

      dir.sub(this._params.entityManager.Get('player')._position)
      dir.y = 0.0;
      dir.normalize();
      dir.multiplyScalar(-1);

      this._target.getWorldDirection(this.d)


      if (dir.angleTo(this.d) > 0.31419){// 2.8274){  // Math.PI -Math.PI/10 = 2.8274
        return false;
      }

      this.start.copy(this._target.position);
      this.start.y +=2.5;

      this.ray.set(this.start, dir);
      this.int = this.ray.intersectObjects(this._params.monsterVision, true )
      // var arrow = new THREE.ArrowHelper( this.ray.ray.direction, this.ray.ray.origin, this.ray.far, 0xff0000 );
      // this._params.scene.add(arrow);

      if(this.int.length > 0){
        if(this.int[0].object.parent.name == "girl"){
          console.log("player found")
          // found = true;
          return true;
        }
      }

      return false;
    }


    _OnAIWalk(timeInSeconds) {
      
      this._time += timeInSeconds;
      // visualize the path
      // const lineGeometry = new THREE.BufferGeometry().setFromPoints( path.getPoints( 32 ) );
      // const lineMaterial = new THREE.LineBasicMaterial();
      // const line = new THREE.Line( lineGeometry, lineMaterial );
      // this._params.scene.add(line)

      const pos1=this.path.getPointAt( (this._time/5)%1);  //  lvl 1:5 ,  lvl 3 :15
      const dir = this._parent._position.clone();
      dir.sub(pos1);
      dir.y = 0.0;
      // dir.normalize();
      const _R = this._target.quaternion.clone();

      this.m.lookAt(this.eye,dir,this.up);
      _R.setFromRotationMatrix(this.m);

      this._target.quaternion.copy(_R);

      this.forward.set(0,0,1);
      this.forward.applyQuaternion(this._target.quaternion);
      this.forward.normalize();

      this.forward.multiplyScalar(8 * timeInSeconds);

      const pos = this._target.position.clone();

      this._target.getWorldDirection(this.d);

      this._mesh.position.copy(pos);
      this._mesh.position.addScaledVector(this.d, 1.5);
      this._mesh.position.y+= 5.5;
      this._spotLight.position.copy(this._mesh.position);
      
      pos.add(this.forward);
      // pos.add(sideways);

      this._target.position.copy(pos);
      this._position.copy(pos);
      this._targetObject.position.copy(pos);
      this._targetObject.position.addScaledVector(this.d, 20);
      this._mesh.lookAt(this._targetObject.position);

      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
    }

    Update(timeInSeconds) {
      // console.log(this._type)

      if (!this._stateMachine._currentState) {
        return;
      }
      
      if(this._FindPlayer()){
        this._params.playerFound = true;
        return;
      }


      this._OnAIWalk(timeInSeconds);

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }
    }
  };

  return {
    NPCController: NPCController,
  };

})();