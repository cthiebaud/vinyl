import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'
import { Controller } from "./Controller.js"

class Cursor {
    constructor(length) {
        this.length = length
        this.index = 0
        this.next = () => {
            if (this._length > 1) {
                this.index += 1
            }
            console.log("CURR CARD", this.index)
        }
        this.prev = () => {
            if (this._length > 1) {
                this.index += this.length - 1
            }
            console.log("CURR CARD", this._index)
        }
        this.reset = () => {
            this.index = 0
            console.log("CURR CARD", this._index)
        }
    }
    get index() {
        return this._index
    }
    set index(index) {
        if (this._length > 1) {
            this._index = index < 0 ? 0 : index % this._length
        }
        document.getElementById('cursor').innerHTML = this.index
    }
    get length() {
        return this._length
    }
    set length(length) {
        this._length = length < 1 ? 1 : length
    }
}
export class PlayList {
    constructor(element, brandLogoImages) {
        this.element = element;
        this.element.dataset.brandLogoImage = brandLogoImages[0];
        this.element.dataset.brandLogoImagePlaying = brandLogoImages[1];
        this.element.src = this.element.dataset.brandLogoImage;

        this.refresh = () => {
            // create play list, take snapshot
            const cardFirstButtons = document.querySelectorAll("div.card [type='button'][data-id]:first-child")
            this.list = Array.from(cardFirstButtons).map(button => ({
                buttonId: button.id,
                mediaId: button.dataset.id,
                templateId: button.dataset.media
            }));
        }
        this.refresh()
        this.curr = new Cursor(this.list.length)

        this.onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            PubSub.publish(Controller.symbols._CLICKED_, null)

            if (!this.active) {
                this.active = true
                PubSub.publish(Controller.symbols._START_, this.list[this.curr.index])
            } else {
                this.active = false
            }
        }
        this.onNext = (msg, data) => {
            if (!this.list || !this.curr || !this.active) {
                return
            }
            this.curr.next()
            PubSub.publish(Controller.symbols._CLICKED_, this.list[this.curr.index])
        }
        document.getElementById('resetCursor').addEventListener('click', this.curr.reset);
        document.getElementById('prevCursor').addEventListener('click', this.curr.prev);
        document.getElementById('nextCursor').addEventListener('click', this.curr.next);
        this.element.addEventListener('click', this.onClick);
        this.tokenNExt = PubSub.subscribe(Controller.symbols._NEXT_, this.onNext)
    }

    get active() {
        return this.element.src.endsWith(this.element.dataset.brandLogoImagePlaying)
    }

    set active(active) {
        if (active) {
            this.element.src = this.element.dataset.brandLogoImagePlaying;
        } else {
            this.element.src = this.element.dataset.brandLogoImage;
        }
    }

    close() {
        document.getElementById('resetCursor').removeEventListener('click', this.curr.reset);
        document.getElementById('prevCursor').removeEventListener('click', this.curr.prev);
        document.getElementById('nextCursor').removeEventListener('click', this.curr.next);
        this.element.removeEventListener("click", this.onClick);
    }
}
