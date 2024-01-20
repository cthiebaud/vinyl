import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'

import { Symbols as Σ } from "./Symbols.js"

const Controller = (function () {

    // Private variables or functions
    const document = undefined // try to prevent controller from using view 

    class ControllerClass {
        #mediaCurrentlyPlaying
        constructor() {
            this.#mediaCurrentlyPlaying = undefined
            // WHEN CLICKED
            this.tokenClicked = PubSub.subscribe(Σ._CLICKED_, (msg, media) => {
                console.log(msg, media)
                if (this.#mediaCurrentlyPlaying) {
                    PubSub.publish(Σ._STOP_, { ...this.#mediaCurrentlyPlaying })
                }
                if (media === null) {
                    return
                }
                if (!this.#mediaCurrentlyPlaying || media.id !== this.#mediaCurrentlyPlaying.id) {
                    PubSub.publish(Σ._START_, { ...media })
                }
            })
            // WHEN STARTED
            this.tokenStart = PubSub.subscribe(Σ._START_, (msg, media) => {
                console.log(msg, media)
                this.#mediaCurrentlyPlaying = media
                PubSub.publish(Σ._CREATE_MEDIA_PLAYER_, { ...media })
            })
            // WHEN STOPPED
            this.tokenStop = PubSub.subscribe(Σ._STOP_, (msg, media) => {
                console.log(msg, media)
                this.#mediaCurrentlyPlaying = undefined
                PubSub.publish(Σ._DESTROY_MEDIA_PLAYER_, { ...media })
            })
            // WHEN NEXT
            this.onNext = PubSub.subscribe(Σ._NEXT_, (msg, model) => {
                if (!model || !model.data || !model.data.songs || !model.data.orderedKeys || !model.cursor ) {
                    return
                }
                model.cursor.next()
                PubSub.publish(Σ._CLICKED_, model.data.songs[model.data.orderedKeys[model.cursor.index]].media[0])
            })

        }

        close() {
            PubSub.unsubscribe(this.tokenClicked), this.tokenClicked = undefined
            PubSub.unsubscribe(this.tokenStart), this.tokenStart = undefined
            PubSub.unsubscribe(this.tokenStop), this.tokenStop = undefined
            PubSub.unsubscribe(this.onNext), this.tokenNext = undefined
            console.log("controller closed")
        }
    }

    return ControllerClass
})();

export default Controller