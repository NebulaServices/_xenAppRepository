const { BrowserWindow } = xen;

const win = new BrowserWindow({
  width: 1000,
  height: 500,
  show: true,
  alwaysOnTop: false,
  frame: true,
  dragableClass: "dragable"
});

win.loadURL('https://mediumpurpledangerouslivedistro.greenworldia.repl.co/');
console.log('Main Loaded')