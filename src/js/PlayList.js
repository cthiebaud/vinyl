import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'
import { Controller } from "./Controller.js"

export class PlayList {
    constructor(element, brandLogoImages) {
        this.element = element;
        this.element.dataset.brandLogoImage = brandLogoImages[0];
        this.element.dataset.brandLogoImagePlaying = brandLogoImages[1];
        this.element.src = this.element.dataset.brandLogoImage;
        this.onClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            PubSub.publish(Controller.symbols._CLICKED_, null)

        }
        this.onStart = (msg, data) => {
            if (!this.element.src.endsWith(this.element.dataset.brandLogoImagePlaying)) {
                this.element.src = this.element.dataset.brandLogoImagePlaying;
            }
        }
        this.onStop = (msg, data) => {
            if (!this.element.src.endsWith(this.element.dataset.brandLogoImage)) {
                this.element.src = this.element.dataset.brandLogoImage;
            }
        }
        this.element.addEventListener('click', this.onClick);
        this.tokenStart = PubSub.subscribe(Controller.symbols._START_, this.onStart)
        this.tokenStop = PubSub.subscribe(Controller.symbols._STOP_, this.onStop)
    }

    close() {
        this.element.removeEventListener("click", this.onClick);
        PubSub.unsubscribe(this.tokenStart), this.tokenStart = undefined;
        PubSub.unsubscribe(this.tokenStop), this.tokenStop = undefined;
    }
}
