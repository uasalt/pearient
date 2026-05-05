import {
    contextBridge,
    ipcRenderer
} from 'electron'
import api from './api/index.js'
import login from './login.mjs'
import get from './getMedia.mjs'
import authorization from './authorization.mjs'
import feed from './feed.mjs'
import fs from 'fs/promises'
import { fileTypeFromBuffer } from "file-type"

let stateUpdaterCB
const CAPTCHA_URL = process.env.captchaURL || 'https://hcaptcha.com/siteverify'
const CAPTCHA_KEY =  process.env.captchaKEY || 'ES_8227cca58dc8405e80c8623dacc584ab'
const currPage = window.location.href.split("/").pop()
let updatesEnabled = process.env.enableUpdates || 0

contextBridge.exposeInMainWorld('devTools', () => ipcRenderer.send('devTools'))
contextBridge.exposeInMainWorld('devToolsOpened', () => ipcRenderer.invoke('isDevToolsOpened'))
contextBridge.exposeInMainWorld('api', {
    env: process.env,
    appendEnv: (k,v) => {
        process.env[k] = v
        fs.appendFile(".env", `${k}=${v}`)
    },
    registerStateUpdater: cb => stateUpdaterCB = cb,
    ws: api,
    connect: () => api.connect(),
    getReleaseGitHubBody: async url => {
        const req = await fetch(url)
        const parser = new DOMParser()
        const doc = parser.parseFromString(await req.text(), 'text/html')
        return [doc.querySelector(".markdown-body.tmp-my-3 p")?.innerHTML, doc.querySelector(".tmp-mr-3.d-inline")?.textContent]
    },
    login,
    authorization,
    feed,
    get,
    fileTypeFromBuffer
})

function proc() {
    ipcRenderer.send('ready')
    if (process.env.session) {
        window.location.href = 'home.html'
    } else if (window.location.href.split("/").pop() != 'login.html') {
        window.location.href = 'login.html'
    }
}

async function update() {
    if (currPage == 'loader.html') {
        const request = await fetch(process.env.updateServer || "https://uasalt.org/dev/apps/d5a954ef5c8b")
        if (!request.ok) {
            return proc()
        }
        try {
            const json = await request.json()

            stateUpdaterCB('updating')
            proc()
        } catch { proc() }
    } else {
        proc()
    }
}

if (updatesEnabled == 1) {
    let time = 0

    const okda = setInterval(async () => {
        if (stateUpdaterCB) {
            update()
            return clearInterval(okda)
        }
        time = time + 100
        if (time > 10_000) clearInterval(okda)
    }, 100)
} else if (currPage != 'home.html') proc()