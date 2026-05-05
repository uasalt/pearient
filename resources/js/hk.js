document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.shiftKey && e.code == 'KeyI') window.devTools()
    if (e.ctrlKey && e.code == 'KeyR') location.reload()
})