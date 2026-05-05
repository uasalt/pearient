import api from './api/index.js'

export default {
    sendPost: async (text) => {
        await api.send({
            type: "social",
            action: "posts/add",
            payload: {
                text
            }
        })
    },
    load: async (f, i) => {
        const { status, message, posts } = await api.send({
            type: 'social',
            action: 'load_posts',
            payload: {
                posts_type: f,
                start_index: i
            }
        })
        if (status != 'success') return console.error(`Не удалось получить посты (${f}/${i}): ${message}`)

        return posts
    }
}