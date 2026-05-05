import cache from './cache.js'

await window.api.connect()
await cache.openDB()
const AccountData = await window.api.login.authorize()

async function getImageURL(image, lossless, ttl) {
    const photo = await window.api.get.photo(typeof image == 'string' ? JSON.parse(image) : image, lossless)
    if (!photo) {console.error("Не удалось получить фото"); return }
    let url = URL.createObjectURL(photo)
    setTimeout(() => URL.revokeObjectURL(url), ttl || 8_000)
    return url
}

localStorage.setItem("AccountData", JSON.stringify(AccountData))
{
    AccountData.rawAvatar = AccountData.avatar
    AccountData.rawCover = AccountData.cover
    AccountData.avatar = () =>  AccountData.rawAvatar ? getImageURL(AccountData.rawAvatar) : undefined
    AccountData.cover = () => AccountData.rawCover ? getImageURL(AccountData.rawCover) : undefined
}
async function formatAvatar(avatar, name) {
    if (avatar) return `<img alt="Аватар" src="${await getImageURL(avatar)}">`
    return `<div class='no-avatar'>${name[0].toUpperCase()}</div>`
}

document.querySelector('header .container.avatar').innerHTML = await formatAvatar(AccountData.rawAvatar, AccountData.name)
document.querySelector('header .container .wallet .count').textContent = AccountData.e_balls

const changeLog = {
    client: await api.getReleaseGitHubBody("https://github.com/uasalt/pearient/releases/latest"),
    social: await api.getReleaseGitHubBody("https://github.com/Xaromie/Element/releases/latest")
}

function loadInformation(tab) {
    const [content, title] = changeLog[tab]

    document.querySelector('.Content .page .information .title').textContent = title ? title : "Релиз не найден"
    document.querySelector('.Content .page .information .changelog').innerHTML = content ? content.split('<br>').map(line => `<span>${line}</span>`).join('') : "Описание не добавлено"
    
    document.querySelectorAll('.Content .page .information .changelog span').forEach(e => e.textContent.includes(":") ? e.classList.add("title") : '')
    const btn = document.querySelector(`.Content .page .information .infoSelector button[value="${tab}"]`)
    if (btn) btn.click()
}

if (document.querySelector('.Content .page .information .infoSelector button')) {
    document.querySelectorAll('.Content .page .information .infoSelector button').forEach(e => {
        e.addEventListener('click', async () => {
            document.querySelector('.Content .page .information .infoSelector button[active]').removeAttribute('active')
            e.setAttribute('active', '')
            loadInformation(e.getAttribute('value'))
        })
    })
}

loadInformation(localStorage.getItem("infoTab") || 'client')

const procOnline = async () => {
    const online = await window.api.get.online()
    if (online) {
        const usernames = online.map(a => a.username)
        const onlineViewArray = Array.from(document.querySelectorAll(".Content .page .scroll .online div[data-username]"))
        const onlineView = Object.fromEntries(onlineViewArray.map(e => [ e.getAttribute("data-username"), e ]))

        for (const user of online) {
            if (!onlineView[user.username]) {
                const div = document.createElement('div')
                div.setAttribute("data-username", user.username)
                if (user.avatar) {
                    const img = document.createElement('img')
                    img.src = await getImageURL(user.avatar)
                    div.appendChild(img)
                } else {
                    const avatar = document.createElement('div')
                    avatar.classList.add("no-avatar")
                    avatar.textContent = user.name.slice(0,1).toUpperCase()
                    div.appendChild(avatar)
                }
                document.querySelector(".Content .page .scroll .online").appendChild(div)
            }
        }

        for (const [ username, dom ] of Object.entries(onlineView)) {
            if (!usernames.includes(username)) {
                dom.remove()
            }
        }
    }
}
procOnline()
setInterval(procOnline, 2_000)

document.querySelector(".Content .page .scroll .createPost .buttons #send").addEventListener('click', async () => {
    const area = document.querySelector(".Content .page .scroll .createPost textarea")
    await api.feed.sendPost(area.value)
    area.value = ''
})

let currentFeed = window.api.env.feed || 'last'
let startIndex = () => document.querySelectorAll('.Content .page .scroll .feed div.post').length

async function procPosts(posts) {
    if (!posts) return

    for (const post of posts) {
        post.author.name = post.author.name || 'Удалённый аккаунт'
        const root = document.createElement('div')
        root.classList.add('post')
        root.setAttribute("data-id", post.id)
        if (post.username) root.setAttribute("data-username", post.author.username)
        root.innerHTML = `
        <div class="author">
            <div class="info">
                <div class="name"></div>
                <div class="created"></div>
            </div>
        </div>
        <div class="text"></div>
        <div class="userContent"></div>
        <div class="interaction">
            <div class="group">
                <button class="like"><svg fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m462.3 62.6c-54.8-46.7-136.3-38.3-186.6 13.6l-19.7 20.3-19.7-20.3c-50.2-51.9-131.8-60.3-186.6-13.6-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"></path></svg><span class="count"></span></button>
                <button class="dislike"><svg fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m473.7 73.8-2.4-2.5c-46-47-118-51.7-169.6-14.8l34.3 103.4-96 64 48 128-144-144 96-64-28.6-86.5c-51.7-37.8-124.4-33.4-170.7 14l-2.4 2.4c-48.7 49.8-50.8 129.1-7.3 182.2l212.1 218.6c7.1 7.3 18.6 7.3 25.7 0l212.2-218.7c43.5-53 41.4-132.3-7.3-182.1z"></path></svg><span class="count"></span></button>
            </div>
            <button class="comments"><svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="m3 1c-1.10457 0-2 .89543-2 2v4c0 1.10457.89543 2 2 2v1.5c0 .1844.10149.3538.26407.4408s.35985.0775.51328-.0248l2.87404-1.916h2.34861c1.1046 0 2-.89543 2-2v-4c0-1.10457-.8954-2-2-2z"></path></svg><span class="count"></span></button>
            <button class="share"><svg fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m503.691 189.836-176.004-151.985c-15.406-13.305-39.687-2.504-39.687 18.164v80.053c-160.629 1.839-288 34.032-288 186.258 0 61.441 39.581 122.309 83.333 154.132 13.653 9.931 33.111-2.533 28.077-18.631-45.344-145.013 21.507-183.511 176.59-185.742v87.915c0 20.7 24.3 31.453 39.687 18.164l176.004-152c11.071-9.562 11.086-26.753 0-36.328z"></path></svg> Поделиться</button>
        </div>`
        root.querySelector(".author .name").textContent = post.author.name
        if (post.author.avatar) {
            const img = document.createElement('img')
            img.src = await getImageURL(post.author.avatar)
            root.querySelector(".author").prepend(img)
        } else {
            const avatar = document.createElement('div')
            avatar.classList.add("no-avatar")
            avatar.textContent = post.author.name.slice(0,1).toUpperCase()
            root.querySelector(".author").prepend(avatar)
        }
        root.querySelector(".text").textContent = post.text || ''
        root.querySelector(".author .created").textContent = 'Когда то'

        if (post.liked) root.querySelector(".interaction .like").classList.add('Liked')
        if (post.disliked) root.querySelector(".interaction .dislike").classList.add('Liked')
        root.querySelector(".interaction .like .count").textContent = post.likes == 0 ? '' : post.likes
        root.querySelector(".interaction .dislike .count").textContent = post.dislikes == 0 ? '' : post.dislikes
        root.querySelector(".interaction .comments .count").textContent = post.comments == 0 ? '' : post.comments

        console.log(post.content)
        const content = root.querySelector(".userContent")
        for (const image of (post?.content?.images || [])) {
            const source = await getImageURL(image.img_data, true)
            const div = document.createElement('div')
            div.classList.add('postContent')
            div.classList.add('image')
            div.style.setProperty('--bg-image', `url('${source}')`)
            div.innerHTML = `<img src="${source}">`
            content.appendChild(div)
        }
        for (const song of (post?.content?.songs || [])) {
            const cover = song.cover ? await getImageURL(song.cover) : "./assets/music.svg"
            const div = document.createElement("div")
            div.classList.add('postContent')
            div.classList.add('song')
            div.innerHTML = `<img class="cover" src="${cover}"><div class="data"><div class="title">${song.title}</div><div class="artist">${song.artist}${song.album ? ` • ${song.album}` : ''}</div></div><button class="play"><svg width="48" height="48" viewBox="0 0 448 512" style="opacity: 1; filter: blur(0px); transform: none;"><path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9v416.1c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg></button>`
            content.appendChild(div)
        }
        for (const file of (post?.content?.files || [])) {
            function formatSize(bytes, decimals = 2) {
                if (bytes === 0) return '0 Байт'
                const k = 1024
                const dm = decimals < 0 ? 0 : decimals
                const sizes = ['Байт', 'КБ', 'МБ', 'ГБ']
                const i = Math.floor(Math.log(bytes) / Math.log(k))
                
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
            }
            const div = document.createElement("div")
            div.classList.add('postContent')
            div.classList.add('file')
            div.innerHTML = `<svg class="cover" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 13.5C2 13.2238 2.22386 13 2.5 13H9.5C9.77614 13 10 13.2238 10 13.5C10 13.7762 9.77614 14 9.5 14H2.5C2.22386 14 2 13.7762 2 13.5Z"></path><path d="M2.5 11C2.22386 11 2 11.2238 2 11.5C2 11.7762 2.22386 12 2.5 12H5.5C5.77614 12 6 11.7762 6 11.5C6 11.2238 5.77614 11 5.5 11H2.5Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0 2C0 0.895416 0.895432 0 2 0H8L12 4V14C12 15.1046 11.1046 16 10 16H2C0.895432 16 0 15.1046 0 14V2ZM10.5 4L8 1.5V3C8 3.55228 8.44771 4 9 4H10.5ZM2 1H7V3C7 4.10458 7.89543 5 9 5H11V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V2C1 1.44772 1.44772 1 2 1Z"></path></svg><div class="data"><div class="name">${file.name}</div><div class="size">${formatSize(file.size)}</div></div><button class="download"><svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.742a1.282 1.282 0 0 0-1.282 1.282V17.88l-4.223-4.222a1.282 1.282 0 0 0-1.813 0 1.282 1.282 0 0 0 0 1.813l6.411 6.411a1.282 1.282 0 0 0 .907.376 1.282 1.282 0 0 0 .907-.376l6.41-6.41a1.282 1.282 0 0 0 0-1.814 1.282 1.282 0 0 0-1.812 0l-4.223 4.222V3.024A1.282 1.282 0 0 0 12 1.742Z"></path></svg></button>`
            content.appendChild(div)
        }
        // console.log(post)
        // for (const video of (post?.content?.videos || [])) {
        //     const vid = document.createElement('video')
        //     vid.controls = true
        //     root.querySelector(".userContent").appendChild(vid)
        //     let offset = 0
        //     let ext
        //     let fspath = "posts/videos"
        //     let cachedFile = (await cache.getAllByFileSorted("filesCache", `${fspath}/${video.file}`)).map(e=>{console.log(e);return e.content})
            
        //     if (cachedFile.length < 1) {
        //         while (true) {
        //             const [ chunk, last, exte ] = await window.api.get.file(video.file, offset, fspath)
        //             if (!chunk) break
        //             ext = exte
        //             await cache.appendCache(
        //                 "filesCache",
        //                 `${fspath}/${video.file}`,
        //                 chunk,
        //                 offset
        //             )
        //             offset += chunk.length
        //             if (last) break
        //         }
        //         cachedFile = (await cache.getAllByFileSorted("filesCache", `${fspath}/${video.file}`)).map(e=>e.content)
        //     }
        //     console.log(cachedFile)
        //     const blob = new Blob([ cachedFile ], { type: `video/${ext == 'mp4' ? 'mpeg' : ext}` })
        //     vid.src = URL.createObjectURL(blob)
        // }

        document.querySelector('.Content .page .scroll .feed').appendChild(root)
        root.querySelector(".interaction .share").addEventListener("click", () => {
            if (navigator.share) {
                navigator.share({
                    title: 'web.elemsocial.com',
                    text: 'С вами поделились постом из Елемента!',
                    url: "https://elemsocial.com/post/" + post.id
                })
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(`elemsocial.com\nС вами поделились постом из Елемента!\n\nhttps://elemsocial.com/post/${post.id}`)
            } else {}
        })
    }
}

document.querySelector(`.Content .page .scroll .feedSelector button[value="${currentFeed}"]`).setAttribute("active", '')
const loadPosts = async () => procPosts(await window.api.feed.load(currentFeed, startIndex()))
loadPosts()
// setInterval(async () => {
//     if (document.querySelector(".Content .page .scroll").scrollTop > 0) return
//     //document.querySelector('.Content .page .scroll .feed').innerHTML = ''
//     let posts = await window.api.feed.load(currentFeed, startIndex())
//     let newPosts = 0
//     let feedArray = Array.from(document.querySelectorAll('.Content .page .scroll .feed div[data-id]'))
//     const feedView = Object.fromEntries(feedArray.map(e => [ e.getAttribute("data-id"), e ]))
//     for (const index in posts) {
//         const post = posts[index]
//         if (feedView[post.id]) {
//             posts.splice(1, index)
//             continue
//         }
//         newPosts++
//     }
//     for (let i = 0; i < newPosts; i++) {
//         if (!parent.lastElementChild) break
//         parent.lastElementChild.remove()
//     }

//     procPosts(posts)
// }, 15_000)

document.querySelectorAll('.Content .page .scroll .feedSelector button').forEach(e => {
    e.addEventListener('click', async () => {
        document.querySelector('.Content .page .scroll .feedSelector button[active]').removeAttribute('active')
        e.setAttribute('active', '')
        currentFeed = e.getAttribute("value")
        document.querySelector('.Content .page .scroll .feed').innerHTML = ''
        loadPosts()
    })
})

const scroll = document.querySelector('.Content .page .scroll')
scroll.addEventListener('scroll', () => {
    if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight) {
        loadPosts()
    }
})