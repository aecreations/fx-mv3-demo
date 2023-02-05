/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

async function init()
{
  let greetings = await browser.runtime.sendMessage({id: "get-all-greetings"});
  let select = $("hello-msgs");

  for (let i = 0; i < greetings.length; i++) {
    let option = document.createElement("option");
    let optionTxt = document.createTextNode(greetings[i]);
    option.appendChild(optionTxt);
    select.appendChild(option);
  }
  
  let greetIdx = await browser.runtime.sendMessage({id: "get-greeting"});
  select.selectedIndex = greetIdx;

  // Fix for Fx57 bug where bundled page loaded using
  // browser.windows.create won't show contents unless resized.
  // See <https://bugzilla.mozilla.org/show_bug.cgi?id=1402110>
  let wnd = await browser.windows.getCurrent();
  browser.windows.update(wnd.id, {
    width: wnd.width + 1,
    focused: true,
  });  
}


function $(aID)
{
  return document.getElementById(aID);
}


async function closeDlg()
{
  await aePrefs.setPrefs({dlgWndID: null});
  browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
}


//
// Event handlers
//

document.addEventListener("DOMContentLoaded", async (aEvent) => { init() });

$("btn-accept").addEventListener("click", async (aEvent) => {
  let select = $("hello-msgs");
  let index = select.selectedIndex;

  await browser.runtime.sendMessage({
    id: "set-greeting",
    index,
  });
  
  closeDlg();
});

$("btn-cancel").addEventListener("click", aEvent => { closeDlg() });


browser.runtime.onMessage.addListener(aMessage => {
  if (aMessage.id == "webext-global-msg") {
    console.info("MV3 Demo: Choose Greeting dialog has received message from extension preferences page.");
  }
});
