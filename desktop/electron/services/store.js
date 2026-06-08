// electron/services/store.js — the single electron-store instance.
// Persists JSON under app.getPath('userData'). Instantiated lazily (after the
// app is ready) so app.getPath() is always valid.

const Store = require('electron-store');

let store = null;

function getStore() {
  if (!store) {
    store = new Store({
      name: 'launchpad',
      defaults: {
        gamesOverrides: {}, // { [id]: Partial<Game> }  (incl. { _hidden: true })
        gamesCustom: [], // Game[] added by the parent
        profile: {}, // M4
        parental: {}, // M4
      },
    });
  }
  return store;
}

module.exports = { getStore };
