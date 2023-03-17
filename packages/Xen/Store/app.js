const { BrowserWindow } = xen;

const FEATURED_APP = "Velocity/Velocity";

const win = new BrowserWindow({
  width: 1000,
  height: 500,
  show: true,
  alwaysOnTop: false,
  frame: false
});

win.loadFile("static/index.html");

const apps = win.RequestGetAllApps();

win.emit("setApps", apps);
win.emit("setFeaturedApp", apps.find((x) => x.id === FEATURED_APP));

win.on("install", (appId) => {
  xen.apps.install(appId).then(() => {
    win.emit("installSuccess", appId);
  }).catch(() => {
    win.emit("installFail", appId);
  });
});

win.on("uninstall", (appId) => {
  xen.apps.uninstall(appId).then(() => {
    win.emit("uninstallSuccess", appId);
  }).catch(() => {
    win.emit("uninstallFail", appId);
  });
});
