import VinylPlayer from '/vinyl/src/js/VinylPlayer.js'

document.addEventListener("DOMContentLoaded", function () {
    const vinylPlayer = new VinylPlayer()
    vinylPlayer.fetchBody()
})
