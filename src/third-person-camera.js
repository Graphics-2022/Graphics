import * as THREE from '../modules/three.module.js';
import {entity} from './entity.js';


export const third_person_camera = (() => {
  
  class ThirdPersonCamera extends entity.Component {
    constructor(params) {
      super();

      this._params = params;
      this._camera = params.camera;

      this._currentPosition = new THREE.Vector3();
      this._currentLookat = new THREE.Vector3();
    }

    ChangePlayer(params){
      this._params = params;
      this._camera = params.camera;
    }

    _CalculateIdealOffset() {
      let idealOffset = this._CheckSuroundings();
      if ( idealOffset == undefined){
        idealOffset = new THREE.Vector3(-0, 5, -12); !! // minus distance to this 
        idealOffset.applyQuaternion(this._params.target._rotation);
        idealOffset.add(this._params.target._position);
      }
      
      return idealOffset;
    }

    _CalculateIdealLookat() {
      const idealLookat = new THREE.Vector3(0, 5, 20);
      idealLookat.applyQuaternion(this._params.target._rotation);
      idealLookat.add(this._params.target._position);
      return idealLookat;
    }

    _CheckSuroundings(){
      let ray = new THREE.Raycaster();
      ray.far = 2;
      ray.near = 0;
      let d = new THREE.Vector3();
      let newDir =new THREE.Vector3(0,0,0);
      let newPos ;

      this._camera.getWorldDirection(d);
      let search = [0 , Math.PI/2 , Math.PI , -Math.PI/2];
      search.forEach((direction) => {
        newDir.x =d.x*Math.cos(direction) -d.z*Math.sin(direction);
        newDir.z =d.x*Math.sin(direction) +d.z*Math.cos(direction)
        ray.set(this._currentPosition , newDir);

        var int = ray.intersectObjects(this._params.cameraVision )
        // var arrow = new THREE.ArrowHelper( ray.ray.direction, ray.ray.origin, ray.far, 0xff0000 );
        // this._params.scene.add(arrow)
        //console.log(int)
        //console.log(this._currentPosition)

        if(int.length > 0){
          newPos =new THREE.Vector3()
          newPos.copy(this._currentPosition);
          //newPos.addScaledVector(d , 10);
          console.log(newPos)
        }  
      })
      return newPos;
    }

    Update(timeElapsed) {
      const idealOffset = this._CalculateIdealOffset();
      const idealLookat = this._CalculateIdealLookat();

      // const t = 0.05;
      // const t = 4.0 * timeElapsed;
      const t = 1.0 - Math.pow(0.01, timeElapsed);
      //console.log(t)
      this._currentPosition.lerp(idealOffset, t);
      this._currentLookat.lerp(idealLookat, t);

      this._camera.position.copy(this._currentPosition);
      this._camera.lookAt(this._currentLookat);
    }
  }

  return {
    ThirdPersonCamera: ThirdPersonCamera
  };

})();