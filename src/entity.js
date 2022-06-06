import * as THREE from '../modules/three.module.js';


export const entity = (() => {
  // Construct an entity
  class Entity {
    constructor() {
      this._name = null;
      this._components = {};
      this._position = new THREE.Vector3();
      this._rotation = new THREE.Quaternion();
      this._parent = null;
      this._active = false;
    }

    // Get the position of this entity
    get Position(){
      return this._position;
    }

    // Get the rotation of this entity
    get Quaternion(){
      return this._rotation;
    }

    // Set whether or not this entity has the controls
    SetActive(b) {
      this._active = b;
      this._parent.SetActive(this, b);
    }

    // Add a component to this entity
    AddComponent(c) {
      c.SetParent(this);
      this._components[c.constructor.name] = c;
      c.InitComponent();
    }

    // Get a specific component reference
    GetComponent(n) {
      return this._components[n];
    }

    // Delete the NPC controller
    Delete(){
      this.GetComponent("NPCController").Delete();
    }

    // Set the position of this entity
    SetPosition(p) {
      this._position.copy(p);
    }

    // Set the rotation of this entity
    SetQuaternion(r) {
      this._rotation.copy(r);
    }

    // Call the update function for each component of this entity
    Update(timeElapsed) {
      for (let k in this._components) {
        this._components[k].Update(timeElapsed);
      }
    }
  };

  // Components which are added to this entity
  class Component {
    constructor() {
      this._parent = null;
    }

    // Set the parent of this component
    SetParent(p) {
      this._parent = p;
    }

    // Initialize this component
    InitComponent() {}

    
    // Get a specific component reference
    GetComponent(n) {
      return this._parent.GetComponent(n);
    }

    // Call the update function for this component
    Update(_) {}
  };

  return {
    Entity: Entity,
    Component: Component,
  };

})();