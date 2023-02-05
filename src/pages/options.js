/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

async function init()
{
  let bg = await browser.runtime.getBackgroundPage();

  $("show-cxt-menu").checked = await bg.getPref("showCxtMenu");
  let dispModeVal = await bg.getPref("displayMode");
  let dispModeOpts = $("display-mode").options;

  for (let opt of dispModeOpts) {
    if (opt.value == dispModeVal) {
      opt.selected = true;
      break;
    }
  }
}


function $(aID)
{
  return document.getElementById(aID);
}


//
// Event handlers
//

document.addEventListener("DOMContentLoaded", async (aEvent) => { init() });

$("about-btn").addEventListener("click", aEvent => {
  let manifest = browser.runtime.getManifest();
  window.alert(`${manifest.name}\nVersion ${manifest.version}\n\n${manifest.description}`);
});

$("show-cxt-menu").addEventListener("click", async (aEvent) => {
  let bg = await browser.runtime.getBackgroundPage();
  bg.setPrefs({showCxtMenu: aEvent.target.checked});
});

$("display-mode").addEventListener("change", async (aEvent) => {
  let bg = await browser.runtime.getBackgroundPage();
  let select = aEvent.target;
  let displayMode = Number(select.options[select.selectedIndex].value);
  bg.setPrefs({displayMode});
});

$("send-webext-msg").addEventListener("click", aEvent => {
  browser.runtime.sendMessage({id: "webext-global-msg"});
});
