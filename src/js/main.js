import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'

import { Symbols as Σ } from "./Symbols.js"
import View from './_View.js'
import Model from "./_Model.js"
import Controller from "./_Controller.js"

let model = null
let view = null
let controller = new Controller()

window.addEventListener('beforeunload', function (event) {
    console.log("beforeunload!", model, model.close, view, view.close)
    if (model && model.close) model.close()
    if (view && view.close) view.close()
    if (controller && controller.close) controller.close() 
}, { once: true });

document.addEventListener("DOMContentLoaded", function () {

    // console.log("DOMContentLoaded!")

    // Subscribe to the messages published by Model and View
    const dataPromise = new Promise(resolve => PubSub.subscribe(Σ._MODEL_LOADED_, (_, data) => resolve(data)));
    const htmlPromise = new Promise(resolve => PubSub.subscribe(Σ._VIEW_LOADED_, (_, data) => resolve(data)));

    {
        const fileMeta = document.querySelector("head meta[name='file']")
        const datafile = fileMeta ? fileMeta.getAttribute("content") || "index.json" : "index.json"
        model = new Model(datafile)
    }

    {
        view = new View()
    }

    // Wait for both promises to resolve
    Promise.all([dataPromise, htmlPromise]).then(([data, htmlData]) => {
        // Now you can perform the setup logic that depends on both operations being completed
        view.afterFetchBodyAndDataFile(model)
        // console.log("Setup completed");
    });


}, { once: true });
