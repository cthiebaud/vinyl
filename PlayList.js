// Playlist.js

export class PlayList {
    constructor(element, brandLogoSVGarray) {
        this.element = element
        this.element.dataset.brandLogoSVG = brandLogoSVGarray[0]
        this.element.dataset.brandLogoSVGstarted = brandLogoSVGarray[1]
        this.element.src = this.element.dataset.brandLogoSVG
        this.parent = element.parentNode
        parent.addEventListener('click', clickEvent => {
            this.toggle()
        })
    }
    start() {
        this.element.src = this.element.dataset.brandLogoSVGstarted
    }
    toggle() {
        if (this.element.src.endsWith(this.element.dataset.brandLogoSVG)) {
            this.start()
        } else {
            this.stop()
        }
    }
    stop() {
        this.element.src = this.element.dataset.brandLogoSVG
    }
}

