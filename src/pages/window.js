/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

async function init()
{
  let greetings = await browser.runtime.sendMessage({id: "get-all-greetings"});
  let greetIdx = await aePrefs.getPref("helloIdx");
  let greeting = greetings[greetIdx];

  document.title = greeting;
  document.getElementById("greeting").innerText = greeting;
}

document.addEventListener("DOMContentLoaded", async (aEvent) => { init() });
