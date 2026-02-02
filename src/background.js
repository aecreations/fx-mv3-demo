/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DISPLAY_NONE = 0;
const DISPLAY_CONSOLE = 1;
const DISPLAY_NOTIFCN = 2;

let gHelloMsgs = [
  "Hello world",
  "Hello, cruel world",
  "Bonjour",
  "Saludo",
  "Hallo",
  "你好",
  "こんにちは",
  "Привіт",
];

let gIsInitialized = false;


browser.runtime.onStartup.addListener(() => {
  console.log("MV3 Demo: Browser startup.");
});


browser.runtime.onInstalled.addListener(async (aInstall) => {
  if (aInstall.reason == "install") {
    console.log("MV3 Demo: Extension installed.");
  }
  else if (aInstall.reason == "update") {
    let oldVer = aInstall.previousVersion;
    let currVer = browser.runtime.getManifest().version;

    if (currVer == oldVer) {
      console.log("MV3 Demo: WebExtension reloaded.");
    }
    else {
      console.log(`MV3 Demo: Updating from version ${oldVer} to ${currVer}`);
    }
  }
});


// WebExtension initialization
void async function ()
{
  console.log("MV3 Demo: WebExtension startup initiated from IIFE in background script.");

  let prefs = await aePrefs.getAllPrefs();
  if (! aePrefs.hasUserPrefs(prefs)) {
    console.log("MV3 Demo: Initializing user preferences.");
    await aePrefs.setUserPrefs(prefs);
  }

  init(prefs);
}();


async function init(aPrefs)
{
  let [brws, platform] = await Promise.all([
    browser.runtime.getBrowserInfo(),
    browser.runtime.getPlatformInfo(),
  ]);
  
  console.log(`MV3 Demo: Host app: ${brws.name} (version ${brws.version})`);
  console.log("MV3 Demo: OS: " + platform.os);
  
  console.log("MV3 Demo: User prefs: ");
  console.log(aPrefs);

  initCxtMenu(aPrefs);
  
  let idx = Number(aPrefs.helloIdx);
  let hello = gHelloMsgs[idx];
  console.info(hello);

  gIsInitialized = true;

  let extPerms = await browser.permissions.getAll();
  if (extPerms.permissions.includes("tabs")) {
    let [tab] = await browser.tabs.query({active: true, currentWindow: true});
    if (tab) {
      console.log(`MV3 Demo: Active browser tab URL at startup: ${tab.url}`);
      if (tab.url == "about:home") {
        console.log("MV3 Demo: Detected Firefox Home.");
      }
    }
  }
}


async function initCxtMenu(aPrefs)
{
  if (aPrefs.showCxtMenu) {
    browser.menus.create({
      id: "cxt-submenu",
      title: browser.i18n.getMessage("extName"),
      contexts: ["page"],
    });
    browser.menus.create({
      id: "show-greeting",
      title: "say hello",
      parentId: "cxt-submenu",
      contexts: ["page"],
    });
    browser.menus.create({
      id: "choose-greeting",
      title: "choose greeting...",
      parentId: "cxt-submenu",
      contexts: ["page"],
    });
  }
  else {
    browser.menus.removeAll();
  }
}


function getHelloMsg(aIndex)
{
  if (typeof aIndex != "number") {
    throw TypeError("aIndex is not a number");
  }

  return gHelloMsgs[aIndex];
}


function getAllHelloMessages()
{
  return gHelloMsgs;
}


async function getHelloIndex()
{
  let rv = await aePrefs.getPref("helloIdx");
  return rv;
}


async function openChooseHelloDlg()
{
  async function openChooseHelloDlgHelper()
  {
    let wnd = await browser.windows.create({
      url: "pages/dialog.html",
      type: "detached_panel",
      width: 340,
      height: 220,
    });

    aePrefs.setPrefs({dlgWndID: wnd.id});
  }
  // END inner function
  
  let wndID = await aePrefs.getPref("dlgWndID");
  if (wndID) {
    try {
      browser.windows.update(wndID, {focused: true});
    }
    catch {
      // Handle dangling ref to dialog which may have been closed via the
      // window controls instead of the dialog buttons.
      openChooseHelloDlgHelper();
    }
  }
  else {
    openChooseHelloDlgHelper();
  }
}


async function showGreeting()
{
  let prefs = await aePrefs.getAllPrefs();
  let hello = getHelloMsg(prefs.helloIdx);
  
  switch (prefs.displayMode) {
  case DISPLAY_CONSOLE:
    console.info(hello);
    break;

  case DISPLAY_NOTIFCN:
    browser.notifications.create({
      type: "basic",
      title: browser.i18n.getMessage("extName"),
      message: hello,
    });
    break;

  default:
    break;
  }
}


//
// Functions not invoked by extension UI
//

async function getBrowserHomepageOverride()
{
  let extPerms = await browser.permissions.getAll();
  if (extPerms.permissions.includes("browserSettings")) {
    // This will not indicate if the user has selected to open
    // previous windows and tabs.
    let homepgOverride = await browser.browserSettings.homepageOverride.get({});
    console.log("MV3 Demo: Home page override: " + homepgOverride.value);
  }
  else {
    console.warn('To call this function, Hello MV3 needs to be granted the optional permission "browserSettings".');
  }
}


async function openGreetingWindow()
{
  let wnd = await browser.windows.getCurrent();

  // Open an extension window with the same width and height, at the same
  // window position.
  await browser.windows.create({
    url: "pages/greeting.html",
    type: "popup",
    focused: true,
    width: wnd.width,
    height: wnd.height,
    left: wnd.left,
    top: wnd.top,
  });
}


//
// Event handlers
//

browser.runtime.onMessage.addListener(aMessage => {
  console.log(`MV3 Demo: Background script received extension message "${aMessage.id}"`);

  if (aMessage.id == "get-greeting") {
    return getHelloIndex();
  }
  else if (aMessage.id == "set-greeting") {
    let newIdx = Number(aMessage.index);
    return aePrefs.setPrefs({helloIdx: newIdx});
  }
  else if (aMessage.id == "get-all-greetings") {
    return Promise.resolve(getAllHelloMessages());
  }
  else if (aMessage.id == "webext-global-msg") {
    console.info("MV3 Demo: Background script has received message from extension preferences page.");
  }    
});


browser.action.onClicked.addListener(() => {
  showGreeting();
});

browser.menus.onClicked.addListener((aInfo, aTab) => {
  switch (aInfo.menuItemId) {
  case "show-greeting":
    showGreeting();
    break;
    
  case "choose-greeting":
    openChooseHelloDlg();
    break;

  default:
    break;
  }
});

browser.storage.onChanged.addListener((aChanges, aAreaName) => {
  if (Object.hasOwn(aChanges, "showCxtMenu")) {
    initCxtMenu({showCxtMenu: aChanges.showCxtMenu.newValue});
  }
});
