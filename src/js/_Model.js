import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'

import { Symbols as Σ } from "./Symbols.js"
import { Utils } from './utils.js'

const Model = (function () {

    // Private variables or functions
    const document = undefined // try to prevent model from using view stuff

    class Cursor {
        #displayCursor
        constructor(length) {
            this.length = length
            this.index = 0
            this.next = () => {
                if (this._length > 1) {
                    this.index += 1
                }
                console.log("CURSOR", this.index)
            }
            this.prev = () => {
                if (this._length > 1) {
                    this.index += this.length - 1
                }
                console.log("CURSOR", this._index)
            }
            this.reset = () => {
                this.index = 0
                console.log("CURSOR", this._index)
            }
        }

        get displayCursor() {
            return this.#displayCursor
        }

        set displayCursor(displayCursor) {
            this.#displayCursor = displayCursor
        }

        get index() {
            return this._index
        }
        set index(index) {
            if (this._length > 1) {
                this._index = index < 0 ? 0 : index % this._length
            }
            if (this.#displayCursor) this.#displayCursor(this.index)
        }
        get length() {
            return this._length
        }
        set length(length) {
            this._length = length < 1 ? 1 : length
        }
    }

    class PlayList {

        // #active = false

        constructor(datafile) {

            this.order = 'chronological'
            this.inverse = true
            this.data = undefined

                // Fetch data
                ;
            (async () => {
                try {
                    const response = await fetch(datafile);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${datafile}: ${response.status} - ${response.statusText}`);
                    }
                    this.data = await response.json();
                    PubSub.publish(Σ._MODEL_LOADED_, this.data);
                    for (const key in this.data.songs) {
                        const song = this.data.songs[key]
                        song.key = key
                        song.cover = ((key) => {
                            if (key == "brouillard") {
                                const random_boolean = Math.random() < 0.5
                                if (random_boolean) {
                                    return "brouillard-psycho_I.jpg"
                                } else {
                                    return "brouillard-psycho_II.jpg"
                                }
                            }
                            return key + ".jpg"
                        })(key)
                        song.isVideo = (song.media.length > 0 && song.media[0].type === 'video')
                        song.isSound = (song.media.length > 0 && song.media[0].type === 'sound')
                        for (const m in song.media) {
                            const media = song.media[m]
                            media.buttonId = `${media.type}_${media.id}`
                            switch (media.type) {
                                case 'video':
                                    media.label = 'watch'
                                    break;

                                case 'sound':
                                    media.label = 'listen'
                                    break;

                                default:
                                    break;
                            }
                            // console.log(key, m, media)
                        }
                    }
                    this.sortKeys()
                    this.cursor = new Cursor(this.data.orderedKeys.length)
                } catch (error) {
                    alert(error);
                }
            })();
        }

        close() {
            console.log("model closed")
        }

        sortKeys(order) {

            const compareText = (a, b) => {
                const textA = this.data.songs[a].text.toLowerCase()
                const textB = this.data.songs[b].text.toLowerCase()
                const comp = textA.localeCompare(textB)
                return this.inverse ? -comp : comp
            }

            const compareDuration = (a, b) => {
                const dA = this.data.songs[a].duration.split(":")
                const dB = this.data.songs[b].duration.split(":")
                let diff = dA[0] - dB[0]
                if (diff === 0) {
                    diff = dA[1] - dB[1]
                }
                return this.inverse ? -diff : diff
            }

            const compareChronological = (a, b) => {
                const parseDate = (dateString) => {
                    const date = new Date(dateString)
                    return isNaN(date) ? 0 : date.getTime()
                }
                const dateA = parseDate(this.data.songs[a].date)
                const dateB = parseDate(this.data.songs[b].date)
                return this.inverse ? dateB - dateA : dateA - dateB
            }

            order = order || this.order
            let keys = [...this.data.orderedKeys]

            if (order === "random") {
                keys = Utils.shuffleArray(keys)
            } else if (order === "alphabetical") {
                keys = keys.sort(compareText)
            } else if (order === "duration") {
                keys = keys.sort(compareDuration)
            } else if (order === "chronological") {
                keys = keys.sort(compareChronological)
            }

            this.order = order
            this.data.orderedKeys = keys

            return keys
        }

        findSongByMediaId = (mediaId) => {
            const songs = this.data.songs || {};

            for (const [songKey, songValue] of Object.entries(songs)) {
                const mediaItems = songValue.media || [];

                for (const mediaItem of mediaItems) {
                    if (mediaItem.id === mediaId) {
                        return songKey;
                    }
                }
            }
            return null;
        }

        findPositionInOrderedKeys(key) {
            return this.data.orderedKeys.indexOf(key);
        }
        
        /*
        get active() {
            return this.#active
        }
 
        set active(active) {
            this.#active = active
        }
        */

    }

    return PlayList
})();

export default Model