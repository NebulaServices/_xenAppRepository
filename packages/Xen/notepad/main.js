const { BrowserWindow } = xen;

const win = new BrowserWindow({
  width: 1000,
  height: 500,
  show: true,
  alwaysOnTop: false,
  frame: true,
  dragableClass: "dragable"
});

win.loadFile('/index.html');
win.requestDispatchNotification('Welcome', "Welcome to Notes!")
console.log('Main Loaded')