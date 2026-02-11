/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DISPLAY_CONSOLE = 1;
const DISPLAY_NOTIFCN = 2;
const DISPLAY_DIALOG = 3;

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


browser.runtime.onStartup.addListener(async () => {
  console.log("MV3 Demo: Browser startup.");

  let extPerms = await browser.permissions.getAll();
  if (extPerms.permissions.includes("tabs")) {
    let [tab] = await browser.tabs.query({active: true, currentWindow: true});
    if (tab) {
      console.log(`MV3 Demo: URL of active browser tab at startup: ${tab.url}`);
      if (tab.url == "about:home") {
        console.log("Detected Firefox Home.");
      }
    }
  }
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

  let syncedPrefs = await aeSyncedPrefs.getAllPrefs();
  if (!aeSyncedPrefs.hasSyncedPrefs(syncedPrefs)) {
    console.log("MV3 Demo: Initializing synced preferences.  Turn on Firefox Sync and select option to sync add-ons.");
    await aeSyncedPrefs.setSyncedUserPrefs(syncedPrefs);

    // Set values of synced prefs.
    let greetings = [...gHelloMsgs];
    let usrName = browser.i18n.getMessage("defUsrName");
    syncedPrefs = {
      usrName,
      greetings,
    };
    console.log(`MV3 Demo: Initializing synced data:`);
    console.log(syncedPrefs);
    await aeSyncedPrefs.setPrefs(syncedPrefs);
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
  
  let usrName = await aeSyncedPrefs.getPref("usrName");
  console.info(`Hello ${usrName}`);

  gIsInitialized = true;
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
      type: "popup",  // N.B.: Only use 'normal' or 'popup' as the window type.
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


async function showGreeting(aTab)
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

  case DISPLAY_DIALOG:
    try {
      await browser.scripting.executeScript({
        target: {
          tabId: aTab.id,
        },
        args: [hello],
        func: (aHelloMsg) => {
          let dlg = document.getElementById("ae-mv3-demo-dlg");
          if (!dlg) {
            dlg = document.createElement("dialog");
            dlg.id = "ae-mv3-demo-dlg";
            let dlgHdg = document.createElement("p");
            dlgHdg.id = "ae-mv3-demo-dlg-hdg";
            dlgHdg.append("Hello MV3");
            let dlgBody = document.createElement("p");
            dlgBody.id = "ae-mv3-demo-dlg-body";
            let dlgBtn = document.createElement("button");
            dlgBtn.id = "ae-mv3-demo-dlg-btn-accept";
            dlgBtn.append("ok");
            dlgBtn.addEventListener("click", () => {
              dlg.close();
            });

            dlg.appendChild(dlgHdg);
            dlg.appendChild(dlgBody);
            dlg.appendChild(dlgBtn);
            document.body.appendChild(dlg);
          }

          document.getElementById("ae-mv3-demo-dlg-body").textContent = aHelloMsg;
          dlg.showModal();
        }
      });
    }
    catch (e) {
      // Error occurs if current tab is restricted, e.g. a Firefox page
      // (Add-ons Manager, Firefox Settings, etc.) or the AMO website.
      console.error(`MV3 Demo: Failed to execute script injected into tab ${aTab.id}: ${e}`);
    }
    break;

  default:
    break;
  }
}


async function openGreetingWindow()
{
  let wnd = await browser.windows.getCurrent();
  console.info(`MV3 Demo: Current window geometry from WebExtension API:\nx = ${wnd.left}, y = ${wnd.top}, w = ${wnd.width}, h = ${wnd.height}
Window state: ${wnd.state}`);

  // Workaround to Windows bug where if the WebExtension popup window is
  // maximized, its height vertically extends under the Windows taskbar;
  // see <https://bugzilla.mozilla.org/show_bug.cgi?id=2016018>.
  // This will resize the popup so that its entire contents are visible,
  // although it doesn't completely cover the browser window due to another
  // Windows-specific window geometry bug.
  // !! BUG: This workaround doesn't work if the browser window is full screen
  // on Windows; window top is reported as -48 pixels!
  // Could the absolute value be the pixel height of the Windows taskbar?
  // What if the taskbar is hidden or placed on a different side of the screen?
  let left = wnd.left, top = wnd.top;
  let width = wnd.width;
  let height = wnd.height;

  // On Windows, the browser window (x, y) coordinates will be negative
  // if maximized.
  if (wnd.left < 0) {
    // Optimal window geometry to ensure the maximized popup is fully visible.
    left = 10;
    top = 10;
    width = wnd.width - 16;
    height = wnd.height - 16;
  }

  // Open an extension window with the same width and height, at the same
  // window position.
  let greetWnd = await browser.windows.create({
    url: "pages/window.html",
    type: "popup",  // N.B.: Only use 'normal' or 'popup' as the window type.
    focused: true,
    width, height,
    left, top,
  });

  // Workaround to bug where popup window isn't sized correctly if the browser
  // window is maximized. Known to occur on macOS.
  await browser.windows.update(greetWnd.id, {width, height, left, top});

  let greetWndInf = await browser.windows.get(greetWnd.id);
  console.log("MV3 Demo: Popup window info:", greetWndInf)
}


//
// Functions not invoked by extension UI
//

async function dumpSyncedPrefs(aIsVerbose=false)
{
  let syncedPrefs = await aeSyncedPrefs.getAllPrefs();
  let syncedStorageUsedKB = await aeSyncedPrefs.getStorageInUseKB();
  console.info("MV3 Demo: Synced user prefs:", syncedPrefs);
  console.info(`Synced storage in use: ${syncedStorageUsedKB.toFixed(2)} KiB`);

  if (aIsVerbose) {
    console.log(`MV3 Demo: Maximum total size of synced storage: 100 KiB; maximum size of each item in synced storage: 8 KiB
See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync#storage_quotas_for_sync_data`);
  }
}


// Requires Firefox 57+, N/A Chromium and Safari
async function getBrowserHomepageOverride()
{
  let extPerms = await browser.permissions.getAll();
  if (extPerms.permissions.includes("browserSettings")) {
    // This will not indicate if the user has selected to open
    // previous windows and tabs.
    let homepgOverride = await browser.browserSettings.homepageOverride.get({});
    console.info("MV3 Demo: Home page override: " + homepgOverride.value);
  }
  else {
    console.warn('To call this function, Hello MV3 needs to be granted the optional permission "browserSettings".');
  }
}


// Requires Firefox 57+, N/A Chromium and Safari
async function setTabValueOfCurrentTab()
{
  function getTimestampAsHex()
  {
    let rv = Number(new Date()).toString(16);
    return rv;
  }

  let extPerms = await browser.permissions.getAll();
  let perms = new Set(extPerms.permissions);
  if (!perms.has("sessions") || !perms.has("tabs")) {
    console.warn('To call this function, Hello MV3 needs to be granted the optional permissions "sessions" and "tabs".');
    return;
  }

  let [tab] = await browser.tabs.query({active: true, currentWindow: true});
  let tabVal = `ae-${getTimestampAsHex()}`;
  await browser.sessions.setTabValue(tab.id, "demo-tab-id", tabVal);
  console.info(`MV3 Demo: Tab value "${tabVal}" set for tab ${tab.id}`);
}


// Requires Firefox 57+, N/A Chromium and Safari
async function getTabValueOfCurrentTab()
{
  let extPerms = await browser.permissions.getAll();
  let perms = new Set(extPerms.permissions);
  if (!perms.has("sessions") || !perms.has("tabs")) {
    console.warn('To call this function, Hello MV3 needs to be granted the optional permissions "sessions" and "tabs".');
    return;
  }

  let [tab] = await browser.tabs.query({active: true, currentWindow: true});
  let tabVal;
  try {
    tabVal = await browser.sessions.getTabValue(tab.id, "demo-tab-id");
  }
  catch (e) {
    console.error(e);
    return
  }

  if (tabVal) {
    console.info(`MV3 Demo: Tab value of tab ${tab.id}: "${tabVal}"`);
  }
  else {
    console.warn(`MV3 Demo: No tab value set for tab ${tab.id}`);
  }
}


//
// Event handlers
//

browser.runtime.onMessage.addListener(aMessage => {
  console.log(`MV3 Demo: Background script received extension message "${aMessage.id}"`);

  switch (aMessage.id) {
    case "get-greeting":
      return getHelloIndex();

    case "set-greeting":
      return aePrefs.setPrefs({helloIdx: Number(aMessage.index)});

    case "get-all-greetings":
      return Promise.resolve(getAllHelloMessages());

    case "webext-global-msg":
      console.info("MV3 Demo: Background script has received message from extension preferences page.");
      break;

    default:
      break;
  }
});


browser.action.onClicked.addListener(aTab => {
  showGreeting(aTab);
});

browser.menus.onClicked.addListener((aInfo, aTab) => {
  switch (aInfo.menuItemId) {
  case "show-greeting":
    showGreeting(aTab);
    break;
    
  case "choose-greeting":
    openChooseHelloDlg();
    break;

  default:
    break;
  }
});

browser.commands.onCommand.addListener((aName, aTab) => {
  if (aName == "open-hello-window") {
    openGreetingWindow();
  }
});

browser.storage.onChanged.addListener((aChanges, aAreaName) => {
  if (Object.hasOwn(aChanges, "showCxtMenu")) {
    initCxtMenu({showCxtMenu: aChanges.showCxtMenu.newValue});
  }
});
