// Playlist.js

export class PlayList {
    constructor(element, brandLogoImages) {
        this.element = element
        this.element.dataset.brandLogoImage = brandLogoImages[0]
        this.element.dataset.brandLogoImagePlaying = brandLogoImages[1]
        this.element.src = this.element.dataset.brandLogoImage
        this.parent = element.parentNode
        parent.addEventListener('click', clickEvent => {
            this.toggle()
        })
    }
    start() {
        this.element.src = this.element.dataset.brandLogoImagePlaying
    }
    toggle() {
        if (this.element.src.endsWith(this.element.dataset.brandLogoImage)) {
            this.start()
        } else {
            this.stop()
        }
    }
    stop() {
        this.element.src = this.element.dataset.brandLogoImage
    }
}

