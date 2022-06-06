import * as THREE from '../modules/three.module.js';
import {entity} from './entity.js';


export const third_person_camera = (() => {
  
  class ThirdPersonCamera extends entity.Component {
    constructor(params) {
      super();

      this._params = params;
      this._camera = params.camera;
      this._active = params._active;
      this._currentPosition = new THREE.Vector3();
      this._currentLookat = new THREE.Vector3();
      this.idealOffset = new THREE.Vector3(-0, 5, -10); 
      this.newDir = new THREE.Vector3(); 
      this.ray = new THREE.Raycaster();
      this.d = new THREE.Vector3();

    }

    // Change target of the main camera
    ChangePlayer(params){
      this._params = params;
      this._camera = params.camera;
      this._transition = params.transition;
    }

    // Check if the camera has collided with the world and adjust accordingly
    _CalculateIdealOffset() {
      this.idealOffset.set(-0, 5, -10);
      this.idealOffset.applyQuaternion(this._params.target._rotation);
      this.idealOffset.add(this._params.target._position);

      if(this._transition){
        if (this._currentPosition.distanceTo(this.idealOffset) < 5){
          this._transition = false;
        }else{
          return this.idealOffset;
        }
      }
      this.idealOffset.set(-0, 5, -10);

      this.ray.far = 3;
      this.ray.near = 0;
      this.newDir.set(0,0,0)

      this._camera.getWorldDirection(this.d);
      let search = [0, Math.PI/2 , Math.PI , -Math.PI/2];
      search.forEach((direction) => {
        this.newDir.x =this.d.x*Math.cos(direction) -this.d.z*Math.sin(direction);
        this.newDir.z =this.d.x*Math.sin(direction) +this.d.z*Math.cos(direction)
        this.ray.set(this._currentPosition , this.newDir);
        var int = this.ray.intersectObjects(this._params.cameraVision )
        if(int.length > 0){
          this.idealOffset.z+=2 * (2/int[0].distance);
          this.idealOffset.y = 5
        } 
      }); 

      this.newDir.set(0,0,0)
      this.ray.far = 3;
      this.ray.near = 0;
      search = [1,-1]
      search.forEach((direction) => {
        this.newDir.y = direction
        this.ray.set(this._currentPosition , this.newDir);
        var int = this.ray.intersectObjects(this._params.cameraVision )

        if(int.length > 0){
          if(direction == -1 ){
            this.idealOffset.z+=2
            this.idealOffset.y += 1;
          }
        } 
      }); 
      this.idealOffset.applyQuaternion(this._params.target._rotation);
      this.idealOffset.add(this._params.target._position);
      return this.idealOffset;
    }

    // Calculate the point in which the camera looks at
    _CalculateIdealLookat() {
      const idealLookat = new THREE.Vector3(0, 3, 20);
      
      idealLookat.applyQuaternion(this._params.target._rotation);
      idealLookat.add(this._params.target._position);
      return idealLookat;
    }

    // Check for collisions with the world
    _CheckSuroundings(){
      this.ray.far = 2;
      this.ray.near = 0;
      this.newDir.set(0,0,0)
      let newPos ;

      this._camera.getWorldDirection(d);
      let search = [0 , Math.PI/2 , Math.PI , -Math.PI/2];
      search.forEach((direction) => {
        this.newDir.x =d.x*Math.cos(direction) -d.z*Math.sin(direction);
        this.newDir.z =d.x*Math.sin(direction) +d.z*Math.cos(direction)
        this.ray.set(this._currentPosition , this.newDir);

        var int = this.ray.intersectObjects(this._params.cameraVision )

        if(int.length > 0){
          newPos =new THREE.Vector3()
          newPos.copy(this._currentPosition);
        }  
      })
      return newPos;
    }

    // Update function for the camera
    Update(timeElapsed) {
      const idealOffset = this._CalculateIdealOffset();
      const idealLookat = this._CalculateIdealLookat();

      const t = 1.0 - Math.pow(0.01, timeElapsed);
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