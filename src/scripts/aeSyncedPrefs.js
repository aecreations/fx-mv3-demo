/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

let aeSyncedPrefs = {
  _defaultPrefs: {
    usrName: '',
    greetings: [],
  },
 
  getPrefKeys()
  {
    return Object.keys(this._defaultPrefs);
  },

  async getPref(aPrefName)
  {
    let pref = await browser.storage.sync.get(aPrefName);
    let rv = pref[aPrefName];
    
    return rv;
  },

  async getAllPrefs()
  {
    let rv = await browser.storage.sync.get(this.getPrefKeys());
    return rv;
  },

  async setPrefs(aPrefMap)
  {
    await browser.storage.sync.set(aPrefMap);
  },

  hasSyncedPrefs(aPrefs)
  {
    return ("usrName" in aPrefs);
  },

  async setSyncedUserPrefs(aPrefs) {

    await this._addPrefs(aPrefs, this._defaultPrefs);
  },

  async getStorageInUseKB()
  {
    let rv;
    let usedBytes = await browser.storage.sync.getBytesInUse();
    rv = usedBytes / 1024;

    return rv;
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
