// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
const path = require('path')

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

if (process.platform === 'linux') {
  const execProcess = require('child_process');
  execProcess.exec('chmod +x ' + __dirname + '/lib/linux-loonfrpc');
  execProcess.exec('chmod +x ' + __dirname + '/lib/linux-loontunnelfrpc');
  execProcess.exec('chmod +x ' + __dirname + '/lib/usr/bin/makepw.sh');
  execProcess.exec('chmod +x ' + __dirname + '/lib/usr/bin/vncpasswd');
  execProcess.exec('chmod +x ' + __dirname + '/lib/usr/bin/x0vncserver');
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let tray

app.setAppUserModelId('百百');

function createWindow() {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 620,
    height: 420,
    //width: 800,
    //height: 600,
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.on('ready-to-show', function () {
    mainWindow.show();
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  ipcMain.on('event-app-window-hide', (event, arg) => {
    mainWindow.minimize();
  })

  ipcMain.on('event-set-auto-run', (event, arg) => {
    app.setLoginItemSettings({ openAtLogin: arg, openAsHidden: true });
  })

  ipcMain.on('event-open-devtools', (event, arg) => {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  })

  let logo = "icon.ico";
  if (process.platform == "linux") {
    logo = "icon.png";
  }

  tray = new Tray(__dirname + "/" + logo);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: function () {
        mainWindow.close();
      }
    },
  ]);
  tray.setToolTip('百百-随时远程控制');
  tray.on('click', (one, two) => {
    mainWindow.restore();
  })
  tray.setContextMenu(contextMenu)
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.