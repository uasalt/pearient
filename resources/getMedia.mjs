import api from './api/index.js'
import cache from './js/cache.js'

export default {
    photo: async (image, lossless=false) => {
        const { status, message, simple, file } = await api.send({
            type: 'download',
            action: 'image',
            image,
            lossless
        })
        const photo = simple || file
        if (status !== 200) {return console.error(`Не удалось загрузить изображение: ${message}`)}
        const BLOB = new Blob([ photo.buffer ], { type: `image/${photo.ext}` })
        return BLOB
    },
    file: async (file, offset=0, path) => {
        const { status, is_last_chunk, buffer } = await api.send({
            type: 'download',
            action: 'file',
            payload: {
                file,
                offset,
                path
            }
        })
        let ext = file.split('.').pop()?.toLowerCase() || 'mp4'
        if (status !== 200) {return console.error(`Не удалось загрузить файл (${status})`)}
        
        return [buffer, is_last_chunk, ext]
    },
    music: async (song_id, offset) => {},
    online: async () => {
        const { users } = await api.send({
            type: 'social',
            action: 'get_online_users'
        })
        if (!users) return console.error("Не удалось загрузить текущий онлайн")
        return users
    }
}