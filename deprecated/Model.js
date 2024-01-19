import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'

import { Symbols as Σ } from "../src/js/Symbols.js"

export const Model = (function () {

    // Private variables or functions
    const document = undefined // try to prevent model from using view stuff

    class ModelClass {
        constructor(datafile) {
            // Fetch data
            (async () => {
                try {
                    const response = await fetch(datafile);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${datafile}: ${response.status} - ${response.statusText}`);
                    }
                    const data = await response.json();
                    PubSub.publish(Σ._MODEL_LOADED_, data);
                } catch (error) {
                    alert(error);
                }
            })();
        }
    }
    return ModelClass
})();
