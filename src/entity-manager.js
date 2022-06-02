

export const entity_manager = (() => {

  class EntityManager {
    constructor() {
      this._ids = 0;
      this._entitiesMap = {};
      this._entities = [];
    }

    _GenerateName() {
      this._ids += 1;

      return '__name__' + this._ids;
    }

    Get(n) {
      return this._entitiesMap[n];
    }

    // Filter(cb) {
    //   return this._entities.filter(cb);
    // }

    Add(e, n) {
      if (!n) {
        n = this._GenerateName();
      }

      this._entitiesMap[n] = e;
      this._entities.push(e);

      e.SetParent(this);
      e.SetName(n);
    }

    Delete(e){
      for( let i = 0 ; i < this._entities.length ; i++){
        if( this._entities[i]._name == e){
          console.log(this._entities[i])
          this._entities[i].Delete();
          this._entities.splice(i , 1);
        }
      }
    }

    // SetActive(e, b) {
    //   const i = this._entities.indexOf(e);
    //   if (i < 0) {
    //     return;
    //   }

    //   this._entities.splice(i, 1);
    // }

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