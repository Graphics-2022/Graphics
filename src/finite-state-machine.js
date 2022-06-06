

export const finite_state_machine = (() => {
  // Class governs the state of an entity 
  class FiniteStateMachine {
    constructor() {
      this._states = {};
      this._currentState = null;
    }
    // Add a state
    _AddState(name, type) {
      this._states[name] = type;
    }

    // Sets to a specific state
    SetState(name) {
      const prevState = this._currentState;
      // return if the next state is set to the previous state
      if (prevState) {
        if (prevState.Name == name) {
          return;
        }
        prevState.Exit();
      }
      // Otherwise change to next state
      const state = new this._states[name](this);

      this._currentState = state;
      state.Enter(prevState);
    }

    // Update state based in the input
    Update(timeElapsed, input) {
      if (this._currentState) {
        this._currentState.Update(timeElapsed, input);
      }
    }
  };

  return {
    FiniteStateMachine: FiniteStateMachine
  };

})();