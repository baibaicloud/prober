// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
const path = require('path')

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
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.on('ready-to-show', function () {
    mainWindow.show();
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

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
    mainWindow.hide();
  })

  ipcMain.on('event-set-auto-run', (event, arg) => {
    app.setLoginItemSettings({ openAtLogin: arg, openAsHidden: true });
  })

  tray = new Tray(__dirname + "/icon.ico");
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
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
  tray.setContextMenu(contextMenu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.