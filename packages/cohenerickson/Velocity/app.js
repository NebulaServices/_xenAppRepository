const { BrowserWindow } = xen;

const win = new BrowserWindow({
  width: 1000,
  height: 500,
  show: true,
  alwaysOnTop: false,
  frame: false,
  dragableClass: "dragable"
});

win.loadURL('https://velocity.radon.games/');

xen.setIcon('https://github.com/cohenerickson/Velocity/blob/main/public/icons/newTab.png?raw=true');

win.on("pwaRequest", ({ scope, manifest }) => {
  // TODO: validate manifest & install pwa if manifest passes checks
});
