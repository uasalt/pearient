import api from './api/index.js'
import { readFile, writeFile } from 'fs/promises'

export default {
    lastUsers: async () => {
        return await api.send({
            type: 'system',
            action: 'get_last_users'
        })
    }
}

export const unauthorizedHandler = async d => {
    console.error(`Переход на страницу авторизации причина: Вы вышли из аккаунта. (Отладочная информация: ${JSON.stringify(d)})`)
    delete process.env.session

    const lines = (await readFile('.env', 'utf-8')).split('\n').filter(line => !line.startsWith('session='))
    await writeFile('.env', lines.join('\n'))

    window.location.href = 'login.html'
}

api.setUnathorized(unauthorizedHandler)