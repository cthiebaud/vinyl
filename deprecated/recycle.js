class Recycle {
    destroyiframeIfExists(button) {
        if (typeof thePlayer !== 'undefined') {
            thePlayer.forEach(player => {
                Array.from(player.entries()).forEach(([index, elem]) => {
                    console.log("removing", index, elem)
                    if (typeof elem.destroy === "function") {
                        elem.destroy()
                    }
                })
                console.log("removing", player)
                player.remove()
            })
            thePlayer = undefined
        }

        // Be on the safe side
        document.querySelectorAll('.widgette').forEach(widget => widget.remove())

        if (this.theButton) {
            this.theButton.innerHTML = this.theButton.dataset.text
            if (!button || this.theButton.id === button.id) {
                this.theButton = undefined
                return undefined
            }
        }

        return button
    }

    getStyleAndAncestorCard(button) {
        const ancestorCard = button.closest(".card")
        const img = ancestorCard.querySelector("img")
        const pos = img ? img.getBoundingClientRect() : { top: 0, left: 0 }
        const oh = img ? img.offsetHeight : 0
        const ow = img ? img.offsetWidth : 0

        return {
            style: {
                position: "absolute",
                top: 0, // pos.top + "px",
                left: 0, // pos.left + "px",
                width: ow + "px",
                height: oh + "px",
            },
            ancestorCard: ancestorCard,
        }
    }

    showiframe(currentTarget, template) {

        // destroy
        this.theButton = this.destroyiframeIfExists(currentTarget)

        if (this.theButton) {
            this.theButton.innerHTML = "<span'>close</span>" // Style 'color:lightblue'
            const styleAndancestorCard = this.getStyleAndAncestorCard(this.theButton)
            const temp = document.createElement('div')
            temp.innerHTML = template({
                id: this.theButton.dataset.id,
            })
            const iframe = temp.firstElementChild
            iframe.style.cssText = Object.keys(styleAndancestorCard.style).map(property => `${property}: ${styleAndancestorCard.style[property]}`).join(';');
            this.thePlayer = [iframe]

            this.thePlayer.forEach((p) => styleAndancestorCard.ancestorCard.appendChild(p))

            ////////////////
            const player = document.querySelector('media-player')
            if (player) {
                const playHandler = () => {
                    console.log("play")
                    if (this.playList) this.playList.onStart()
                }

                const pauseHandler = () => {
                    console.log("pause")
                    if (this.playList) this.playList.onStop()
                }

                const stopHandler = () => {
                    console.log("stop")
                    if (this.playList) this.playList.onStop()
                }

                const endedHandler = () => {
                    console.log("ended")
                    if (this.playList) this.playList.onStop()
                }

                const destroyHandler = () => {
                    console.log("destroy")
                    // if (this.playList) this.playList.onStop()
                }

                player.addEventListener('play', playHandler)
                player.addEventListener('pause', pauseHandler)
                player.addEventListener('stop', stopHandler)
                player.addEventListener('ended', endedHandler)
                player.addEventListener('destroy', destroyHandler)
            }

            ///////////////
            const widgetIframe = document.getElementById('sc-widget')
            if (widgetIframe) {
                const widget = SC.Widget(widgetIframe)
                if (widget) {
                    widget.bind(SC.Widget.Events.READY, function () {
                        widget.bind(SC.Widget.Events.PLAY, function () {
                            if (this.playList) this.playList.onStart()
                        })
                        widget.bind(SC.Widget.Events.PAUSE, function () {
                            if (this.playList) this.playList.onStop()
                        })
                        widget.bind(SC.Widget.Events.FINISH, function () {
                            if (this.playList) this.playList.onStop()
                        })
                    })
                }
            }
        }
    }

    addEventHandlers() {
        const cardImages = document.querySelectorAll("div.card img.img-fluid")
        cardImages.forEach((image) => {
            image.addEventListener("click", (e) => {
                const firstButton = e.currentTarget.closest("div.card").querySelector(".btn-group [type='button']:first-child")
                if (firstButton) {
                    e.preventDefault()
                    e.stopPropagation()
                    firstButton.click()
                }
            })
        })

        Object.keys(this.templates).forEach((key) => {
            const buttonsWithKeyClass = document.querySelectorAll(`div.card [type='button'].${key}`)
            buttonsWithKeyClass.forEach((button) => {
                button.addEventListener("click", (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    PubSub.publish(Controller.symbols._START_, {
                        func: () => {
                            this.showiframe(e.target, this.templates[key])
                        }
                    })
                })
            })
        })
    }
}