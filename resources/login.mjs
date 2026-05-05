import api from './api/index.js'
import fs from 'fs/promises'

export default {
    authorize: async () => { // S_KEY
        let key = process.env.session
        if (!key) {
            window.location.href = 'login.html'
        }
        const { status, message, accountData } = await api.send({
            type: 'authorization',
            action: 'connect',
            S_KEY: key
        })
        if (status == 'error') {
            return { status, message }
        }
        return accountData
    },
    login: async (email, passwd) => {
        if (!email || !passwd) throw new Error(`${!email ? 'Email' : 'Password'} required!`)
        const { status, message, S_KEY } = await api.send({
            type: 'social',
            action: 'auth/login',
            email: email,
            password: passwd,
            device: 'Element client | uasalt'
        })
        if (status == 'error') {
            return { status, message }
        }
        await fs.appendFile(".env", `session=${S_KEY}\n`)
        process.env.session = S_KEY
        window.location.href = 'home.html'
    },
    register: async data => { // name username password accept h_captcha
        const { status, message } = await api.send({
            type: 'social',
            action: "auth/reg",
            ...data
        })
        if (status == 'error') {
            return { status, message }
        }
        // патом кароче
    }
}