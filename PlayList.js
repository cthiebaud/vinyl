// Playlist.js

export class PlayList {
    constructor(element, brandLogoImages) {
        this.element = element
        this.element.dataset.brandLogoImage = brandLogoImages[0]
        this.element.dataset.brandLogoImagePlaying = brandLogoImages[1]
        this.element.src = this.element.dataset.brandLogoImage
        // this.parent = element.parentNode
        element.addEventListener('click', clickEvent => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            alert("work in progress")
        })
    }
    start() {
        this.onStart()
    }
    toggle() {
        if (this.element.src.endsWith(this.element.dataset.brandLogoImage)) {
            this.start()
        } else {
            this.stop()
        }
    }
    stop() {
        this.onStop()
    }
    onStart() {
        this.element.src = this.element.dataset.brandLogoImagePlaying

    }
    onStop() {
        this.element.src = this.element.dataset.brandLogoImage
    }
}

