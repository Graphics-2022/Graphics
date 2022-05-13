import {entity} from './entity.js';


export const ui_controller = (() => {

  class UIController extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._quests = {};
    }
  
    InitComponent() {
      this._iconBar = {
        stats: document.getElementById('icon-bar-stats'),
        inventory: document.getElementById('icon-bar-inventory'),
        quests: document.getElementById('icon-bar-quests'),
      };

      this._ui = {
        inventory: document.getElementById('inventory'),
        quests: document.getElementById('quest-journal'),
      };

      this._iconBar.inventory.onclick = (m) => { this._OnInventoryClicked(m); };
      this._iconBar.quests.onclick = (m) => { this._OnQuestsClicked(m); };
      this._HideUI();
    }


    _HideUI() {
      this._ui.inventory.style.visibility = 'hidden';
     // this._ui.quests.style.visibility = 'hidden';
    }
    
    _OnQuestsClicked(msg) {
      const visibility = this._ui.quests.style.visibility;
      this._HideUI();
      this._ui.quests.style.visibility = (visibility ? '' : 'hidden');
    }

    _OnStatsClicked(msg) {
      const visibility = this._ui.stats.style.visibility;
      this._HideUI();
      this._ui.stats.style.visibility = (visibility ? '' : 'hidden');
    }

    _OnInventoryClicked(msg) {
      const visibility = this._ui.inventory.style.visibility;
      this._HideUI();
      this._ui.inventory.style.visibility = (visibility ? '' : 'hidden');
    }

    Update(timeInSeconds) {
    }
  };

  return {
    UIController: UIController,
  };

})();