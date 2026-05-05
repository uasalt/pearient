import {
    app,
    BrowserWindow,
    ipcMain,
    globalShortcut
} from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
let ready = false

app.whenReady().then(() => {
    const loader = new BrowserWindow({
        width: 280,
        height: 350,
        frame: false,
        backgroundColor: "#1f1f1f",
        icon: path.join(__dirname, 'resources', 'assets', 'logo.png'),
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'resources', 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })
    loader.setMenu(null)

    loader.loadFile(path.join(__dirname, 'resources', 'loader.html'))
    ipcMain.on("ready", e => {
        if (ready) return
        ready = true
        loader.close()
        const win = new BrowserWindow({
            width: 900,
            height: 600,
            minWidth: 615,
            minHeight: 370,
            backgroundColor: "#1f1f1f",
            icon: path.join(__dirname, 'resources', 'assets', 'logo.png'),
            webPreferences: {
                preload: path.join(__dirname, 'resources', 'preload.mjs'),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false
            }
        })
        win.setMenu(null)
        if (process.env.session) {
            win.loadFile('./resources/home.html')
        } else {
            win.loadFile('./resources/login.html')
        }
    })
    ipcMain.on("devTools", e => {
        const win = BrowserWindow.fromWebContents(e.sender)
        if (!win) return
        if (win.webContents.isDevToolsOpened()) {
            win.webContents.closeDevTools()
        } else {
            win.webContents.openDevTools()
        }
    })
    ipcMain.handle('isDevToolsOpened', async (e) => {
        const win = BrowserWindow.fromWebContents(e.sender)
        if (!win) return

        return win.webContents.isDevToolsOpened()
    })
    globalShortcut.register('f12', e => {
        const win = BrowserWindow.fromWebContents(e.sender)
        if (!win) return
        if (win.webContents.isDevToolsOpened()) {
            win.webContents.closeDevTools()
        } else {
            win.webContents.openDevTools()
        }
    })
})