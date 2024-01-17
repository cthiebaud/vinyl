import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'

export const Controller = (function () {

    // Private variables or functions
    const document = undefined // try to prevent controller from using view stuff

    const _CLICKED = Symbol('_CLICKED_')
    const _START = Symbol('_START_')
    const _STOP = Symbol('_STOP_')
    const _CREATE_MEDIA_PLAYER = Symbol('_CREATE_MEDIA_PLAYER_')
    const _DESTROY_MEDIA_PLAYER = Symbol('_DESTROY_MEDIA_PLAYER')

    class ControllerClass {
        constructor() {
            this.playing = undefined
            this.tokenClicked = PubSub.subscribe(Controller.symbols._CLICKED_, (msg, data) => {
                console.log(msg, data);
                if (this.playing) {
                    PubSub.publish(Controller.symbols._STOP_, { ...this.playing })
                }
                if (data === null) {
                    return
                }
                if (!this.playing || data.mediaId !== this.playing.mediaId) {
                    PubSub.publish(Controller.symbols._START_, { ...data })
                }
            })
            this.tokenStart = PubSub.subscribe(Controller.symbols._START_, (msg, data) => {
                console.log(msg, data);
                this.playing = data
                PubSub.publish(Controller.symbols._CREATE_MEDIA_PLAYER_, { ...data })
            })
            this.tokenStop = PubSub.subscribe(Controller.symbols._STOP_, (msg, data) => {
                console.log(msg, data);
                this.playing = undefined
                PubSub.publish(Controller.symbols._DESTROY_MEDIA_PLAYER, { ...data })
            })
            console.log("controller created!")
        }

        close() {
            PubSub.unsubscribe(this.tokenClicked), this.tokenClicked = undefined
            PubSub.unsubscribe(this.tokenStart), this.tokenStart = undefined
            PubSub.unsubscribe(this.tokenStop), this.tokenStop = undefined
        }
    }

    return {
        clazz: ControllerClass,
        symbols: Object.freeze({
            _CLICKED_: _CLICKED,
            _START_: _START,
            _STOP_: _STOP,
            _CREATE_MEDIA_PLAYER_: _CREATE_MEDIA_PLAYER,
            _DESTROY_MEDIA_PLAYER_: _DESTROY_MEDIA_PLAYER,
        })
    };
})();
