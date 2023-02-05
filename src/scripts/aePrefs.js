/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

let aePrefs = {
  _defaultPrefs: {
    helloIdx: 0,
    displayMode: 1,
    showCxtMenu: true,
    dlgWndID: null,
  },
 
  getPrefKeys()
  {
    return Object.keys(this._defaultPrefs);
  },

  async getPref(aPrefName)
  {
    let pref = await browser.storage.local.get(aPrefName);
    let rv = pref[aPrefName];
    
    return rv;
  },

  async getAllPrefs()
  {
    let rv = await browser.storage.local.get(this.getPrefKeys());
    return rv;
  },

  async setPrefs(aPrefMap)
  {
    await browser.storage.local.set(aPrefMap);
  },


  //
  // Version upgrade handling
  //

  hasUserPrefs(aPrefs)
  {
    let rv = Object.hasOwn(aPrefs, "helloIdx");
    return rv;
  },

  async setUserPrefs(aPrefs) {
    let prefs = {
      helloIdx: 0,
      displayMode: 1,
      showCxtMenu: true,
      dlgWndID: null,
    };
    
    await this._addPrefs(aPrefs, prefs);
  },

  //
  // Helper methods
  //

  async _addPrefs(aCurrPrefs, aNewPrefs)
  {
    for (let pref in aNewPrefs) {
      aCurrPrefs[pref] = aNewPrefs[pref];
    }

    await this.setPrefs(aNewPrefs);
  },
};
