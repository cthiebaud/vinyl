import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'
import { Controller } from "./Controller.js"

export class PlayList {
    constructor(element, brandLogoImages) {
        this.element = element;
        this.element.dataset.brandLogoImage = brandLogoImages[0];
        this.element.dataset.brandLogoImagePlaying = brandLogoImages[1];
        this.element.src = this.element.dataset.brandLogoImage;
        element.addEventListener('click', (clickEvent) => {
            PubSub.publish(Controller.symbols._CLICKED_, null)
  
        });
        this.tokenStart = PubSub.subscribe(Controller.symbols._START_, (msg, data) => {
            if (!this.element.src.endsWith(this.element.dataset.brandLogoImagePlaying)) {
                this.element.src = this.element.dataset.brandLogoImagePlaying;
            }
        })
        this.tokenStop = PubSub.subscribe(Controller.symbols._STOP_, (msg, data) => {
            if (!this.element.src.endsWith(this.element.dataset.brandLogoImage)) {
                this.element.src = this.element.dataset.brandLogoImage;
            }
        })
    }

    close() {
        PubSub.unsubscribe(this.tokenStart), this.tokenStart = undefined
        PubSub.unsubscribe(this.tokenStop), this.tokenStop = undefined
    }
}
