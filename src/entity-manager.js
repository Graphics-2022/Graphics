
export const entity_manager = (() => {
  // Entity manager is responsible for tracking each active entity and calling their respective update function
  class EntityManager {
    constructor() {
      this._ids = 0;
      this._entitiesMap = {};
      this._entities = [];
    }
    // Generating a unique id 
    _GenerateName() {
      this._ids += 1;
      return '__name__' + this._ids;
    }

    // Fetching a specific entity
    Get(n) {
      return this._entitiesMap[n];
    }

    // Adding an entity to the manager
    Add(e, n) {
      if (!n) {
        n = this._GenerateName();
      }

      this._entitiesMap[n] = e;
      this._entities.push(e);

      // e.SetParent(this);
      // e.SetName(n);
    }

    // Deleteing an entity from the manager
    Delete(e){
      for( let i = 0 ; i < this._entities.length ; i++){
        if( this._entities[i]._name == e){
          console.log(this._entities[i])
          this._entities[i].Delete();
          this._entities.splice(i , 1);
        }
      }
    }

    // Calling the update function for each entity
    Update(timeElapsed) {
      for (let e of this._entities) {
        e.Update(timeElapsed);
      }
    }
  }

  return {
    EntityManager: EntityManager
  };

})();