export class PlayList {
    constructor(element, brandLogoImages, destroy) {
        this.element = element;
        this.element.dataset.brandLogoImage = brandLogoImages[0];
        this.element.dataset.brandLogoImagePlaying = brandLogoImages[1];
        this.element.src = this.element.dataset.brandLogoImage;
        element.addEventListener('click', (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            this.toggle();
        });
        this.current = 0;
        this.currentElement = null;
        this._playing = false;
        this.destroy = destroy;
    }

    get playing() {
        return this._playing;
    }

    set playing(playing) {
        console.log("set playing of playlist to ", playing);
        this._playing = playing;
    }

    trigger(i) {
        const list = Array.from(document.querySelectorAll(".btn-group [type='button']:first-child"));
        this.currentElement = list[i];
        this.currentElement.click();
    }

    start() {
        if (!this.playing) {
            this.playing = true;
            this.onStart();
            this.trigger(this.current);
        }
    }

    next() {
        if (!this.playing) {
            return false;
        }
        const list = Array.from(document.querySelectorAll(".btn-group [type='button']:first-child"));
        if (this.current < list.length - 1) {
            this.trigger(++this.current);
            return true;
        }
    }

    toggle() {
        if (this.element.src.endsWith(this.element.dataset.brandLogoImage)) {
            this.start();
        } else {
            this.stop();
        }
    }

    stop() {
        if (this.playing) {
            this.playing = false;
            this.onStop();
            this.destroy();
        }
    }

    onStart() {
        if (!this.element.src.endsWith(this.element.dataset.brandLogoImagePlaying)) {
            this.element.src = this.element.dataset.brandLogoImagePlaying;
        }
    }

    onStop() {
        if (!this.element.src.endsWith(this.element.dataset.brandLogoImage)) {
            this.element.src = this.element.dataset.brandLogoImage;
        }
    }
}
