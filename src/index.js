const { Menu, app, shell, BrowserWindow, ipcMain } = require("electron");
const { ClipboardServer } = require("./server/ClipboardServer");
const { session, localTunnel } = require("./server/config");
const defaultMenu = require("electron-default-menu");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    // eslint-disable-line global-require
    app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let clipboardServer;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });
    // server
    clipboardServer = new ClipboardServer();
    clipboardServer
        .start()
        .then(() => {
            // and load the index.html of the app.
            mainWindow.loadURL(`file://${__dirname}/index.html`);
            mainWindow.webContents.once("dom-ready", () => {
                // pass secret-key
                mainWindow.webContents.send("init", localTunnel.get(), session.get());
            });
        })
        .catch(error => {
            console.error(error);
        });
    // Emitted when the window is closed.
    mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        clipboardServer.stop();
    });
    const menu = defaultMenu(app, shell);
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    app.quit();
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
