
await window.api.connect()
{
    const { users } = await window.api.authorization.lastUsers()
    if (users) {
        users.forEach(async u => {
            const div = document.createElement('div')
            div.classList.add("user")
            div.setAttribute("username", u.username)
            let avatarURL = "./assets/defaultAvatar.png"

            if (u.avatar) {
                const avatar = await window.api.get.photo(typeof u.avatar == 'string' ? JSON.parse(u.avatar) : u.avatar)
                avatarURL = URL.createObjectURL(avatar)
                setTimeout(() => URL.revokeObjectURL(avatarURL), 1_000)
            }
            div.innerHTML = `<img src="${avatarURL}" alt="avatar">` //\n<p class="name">${u.name}</p>`

            document.querySelector('.last-users').appendChild(div)
        })
    } else {
        console.error(`Не удалось получить последних зарегистрированных пользователей.`)
    }
}

document.querySelector('.login input[type="email"]')?.addEventListener("change", () => {
    document.querySelector('.login input[type="password"]')?.focus()
})
document.querySelector('.login input[type="password"]')?.addEventListener("change", () => {
    document.querySelector('.login button')?.click()
})

document.querySelector('.login button').addEventListener('click', async () => {
    const { status, message } = await window.api.login.login(
        document.querySelector('.login input[type="email"]')?.value,
        document.querySelector('.login input[type="password"]')?.value
    )
    if (status == 'error') alert(message)
})
