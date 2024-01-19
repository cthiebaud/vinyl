import handlebars from 'https://cdn.jsdelivr.net/npm/handlebars@4.7.8/+esm'
import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'

import { Symbols as Σ } from "./Symbols.js"
import { ElementAnimator } from './ElementAnimator.js'

const View = (function () {

  class CursorSpy {
    #displayCursor
    constructor() {
      this.#displayCursor = (index) => {
        if (document.getElementById('cursor')) document.getElementById('cursor').innerHTML = index
      }
    }

    get displayCursor() {
      return this.#displayCursor
    }
  }

  class MediaPlayingSpy {
    #element
    constructor(element, brandLogoImages) {
      this.#element = element
      this.#element.dataset.brandLogoImage = brandLogoImages[0];
      this.#element.dataset.brandLogoImagePlaying = brandLogoImages[1];
      this.#element.src = this.#element.dataset.brandLogoImage;

      this.tokenOnPlay = PubSub.subscribe(Σ._ONPLAY_, (msg, media) => {
        this.rotating = true
      })
      this.tokenOnPause = PubSub.subscribe(Σ._ONPAUSE_, (msg, media) => {
        this.rotating = false
      })
      this.tokenStop = PubSub.subscribe(Σ._STOP_, (msg, media) => {
        this.rotating = false
      })
    }

    close() {
      PubSub.unsubscribe(this.tokenOnPlay), this.tokenOnPlay = undefined
      PubSub.unsubscribe(this.tokenOnPause), this.tokenOnPause = undefined
      PubSub.unsubscribe(this.tokenStop), this.tokenStop = undefined
    }

    get rotating() {
      return this.#element.src.endsWith(this.#element.dataset.brandLogoImagePlaying)
    }

    set rotating(rotating) {
      if (rotating) {
        this.#element.src = this.#element.dataset.brandLogoImagePlaying;
      } else {
        this.#element.src = this.#element.dataset.brandLogoImage;
      }
    }
  }

  class playListController {
    constructor() {
      this.model = undefined

      this.resetCursor = undefined
      this.prevCursor = undefined
      this.cursor = undefined
      this.nextCursor = undefined
    }

    setup(model) {

      this.model = model

      this.resetCursor = document.getElementById('resetCursor')
      this.prevCursor = document.getElementById('prevCursor')
      this.cursor = document.getElementById('cursor')
      this.nextCursor = document.getElementById('nextCursor')

      this.onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        PubSub.publish(Σ._CLICKED_, null)

        /* if (!this.model.active) { */
        this.model.active = true
        const dat = this.model.data.songs[this.model.data.orderedKeys[this.model.cursor.index]].media[0]

        PubSub.publish(Σ._START_, dat)
        /* } else {
          this.model.active = false
        } */
      }
      this.cursor.addEventListener('click', this.onClick);
      this.resetCursor.addEventListener('click', this.model.cursor.reset);
      this.prevCursor.addEventListener('click', this.model.cursor.prev);
      this.nextCursor.addEventListener('click', this.model.cursor.next);


      this.cursor.innerHTML = this.model.cursor.index
    }

    close() {
      this.cursor.removeEventListener("click", this.onClick);
      this.resetCursor.removeEventListener('click', this.model.cursor.reset);
      this.prevCursor.removeEventListener('click', this.model.cursor.prev);
      this.nextCursor.removeEventListener('click', this.model.cursor.next);

      PubSub.unsubscribe(this.onCreateMediaPlayer), this.tokenNext = undefined
      PubSub.unsubscribe(this.onDestroyMediaPlayer), this.tokenNext = undefined
      PubSub.unsubscribe(this.onStart), this.tokenOnStart = undefined

      console.log("view closed")
    }
  }

  class Vinyl {
    constructor() {
      this.templates = {
        song: undefined,
        video: undefined,
        sound: undefined,
      }
      this.playListController = new playListController()

        // Fetch body
        ;
      (async () => {
        try {
          const response = await fetch("/vinyl/body.html");
          if (!response.ok) {
            throw new Error(`Failed to fetch ${htmlfile}: ${response.status} - ${response.statusText}`);
          }
          const htmlContent = await response.text();
          document.body.innerHTML = htmlContent;
          PubSub.publish(Σ._VIEW_LOADED_, {});
        } catch (error) {
          alert(error);
        }
      })();
    }

    sortSongs(order) {
      // sort model
      const sortedKeys = this.model.sortKeys(order)  // if order is undefined, then model.order will be used

      // disable current choice
      if (this.model.order !== 'random') {
        const sortButton = document.getElementById(this.model.order)
        if (sortButton) {
          sortButton.classList.add('disabled')
        }
      }

      // display choice
      const sortButtonDropdown = document.querySelector('#sort_button [data-bs-toggle="dropdown"]')
      if (sortButtonDropdown) {
        sortButtonDropdown.textContent = this.model.order
      }

      // disable invers button for random order
      const btnCheck = document.querySelector('#sort_button .btn-check#btn-inverse')
      if (btnCheck) {
        btnCheck.disabled = this.model.order === "random"
      }

      return sortedKeys
    }

    addEventHandlers() {
      // click on card image
      const cardImages = document.querySelectorAll("div.card img.img-fluid")
      cardImages.forEach((image) => {
        image.addEventListener("click", (e) => {
          const firstButton = e.currentTarget.closest("div.card").querySelector(".btn-group [type='button']:first-child")
          if (firstButton) {
            e.preventDefault()
            e.stopPropagation()
            // emulate click on first button
            firstButton.click()
          }
        })
      })

      // click on card button
      Object.keys(this.templates).forEach((key) => {
        const buttonsWithKeyClass = document.querySelectorAll(`div.card [type='button'].${key}`)
        buttonsWithKeyClass.forEach((button) => {
          button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // post to controller
            PubSub.publish(Σ._CLICKED_, {
              buttonId: button.id,
              id: button.dataset.id,
              type: button.dataset.type
            })
          })
        })
      })
    }

    insertSongs(parentElement, order) {

      const orderedKeys = this.sortSongs(order)

      orderedKeys.forEach((key, index) => {
        const song = this.model.data.songs[key]
        // console.log(key, song)
        const songElement = document.createElement('div')
        songElement.innerHTML = this.templates.song(song)

        parentElement.appendChild(songElement.firstElementChild)
      })

      this.addEventHandlers()
    }

    close() {
      console.log(this, this.playListController)
      if (this.playListController) {
        this.playListController.close()
      }
    }

    async afterFetchBodyAndDataFile(model) {
      this.model = model
      const data = model.data
      model.cursor.displayCursor = new CursorSpy().displayCursor

      try {
        // compile handlebars templates 
        Object.keys(this.templates).map((key) => {
          this.templates[key] = handlebars.compile(
            document.getElementById(key + "-template").innerHTML
          )
        })

        // feed body with data
        const github = document.getElementById('github')
        const vinylBrand = document.getElementById('vinyl_brand')
        const vinylBrandSvgElem = document.getElementById('vinyl_brand_svg')
        const copyright = document.getElementById('copyright')
        const htmlElement = document.querySelector('html')
        const sortButton = document.getElementById('sort_button')
        const songsElement = document.getElementById('songs')

        if (data.github) {
          github.href = data.github
        }

        if (data.brandlink) {
          vinylBrand.href = data.brandlink
          vinylBrand.target = "_" + data.id
        }

        if (data.copyright) {
          copyright.innerHTML = data.copyright
        }

        if (data.background) {
          htmlElement.style.background = "url(" + data.background + ") no-repeat center center"
          htmlElement.style.backgroundSize = "contain"
        }

        if (data.brandLogoSVG) {
          this.spy = new MediaPlayingSpy(vinylBrandSvgElem, data.brandLogoSVG)
        }
        this.playListController.setup(this.model)

        this.insertSongs(songsElement)

        ElementAnimator.fadeIn(songsElement.children, 111)

        // Click handler for dropdown items
        document.querySelectorAll('#sort_button .dropdown-item').forEach(item => {
          item.addEventListener('click', event => {
            var selectedItemText = event.target.textContent
            // console.log('Selected item:', selectedItemText)

            sortButton.querySelector('.dropdown-toggle').textContent = selectedItemText

            if (event.target.id !== 'random') {
              event.target.classList.add('disabled')
            }

            document.querySelectorAll('.dropdown-item:not(#random)').forEach(otherItem => {
              otherItem.classList.remove('disabled')
            })

            ElementAnimator.fadeOut(songsElement.children, 100, () => {
              songsElement.innerHTML = ""
              this.insertSongs(songsElement, selectedItemText)
              ElementAnimator.fadeIn(songsElement.children, 200)
            })
          })
        })

        // Click handler for the inverse checkbox 
        document.getElementById('btn-inverse').addEventListener('click', event => {
          var isChecked = event.target.checked
          this.model.inverse = isChecked
          // console.log('inverse is :', isChecked, event.target)

          ElementAnimator.fadeOut(songsElement.children, 100, () => {
            songsElement.innerHTML = ""
            this.insertSongs(songsElement)
            ElementAnimator.fadeIn(songsElement.children, 200)
          })
        })

        /////////////
        // CONTROLLER

        // CREATE MEDIA PLAYER
        this.onCreateMediaPlayer = (msg, data) => {
          // console.log(msg, data);

          function getStyleAndAncestorCard(button) {
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

          const button = document.getElementById(data.buttonId)
          button.innerHTML = "<span>close</span>"
          const styleAndancestorCard = getStyleAndAncestorCard(button)
          const temp = document.createElement('div')
          temp.innerHTML = this.templates[data.type]({
            id: data.id,
          })
          this.thePlayer = temp.firstElementChild
          this.thePlayer.style.cssText = Object.keys(styleAndancestorCard.style).map(property => `${property}: ${styleAndancestorCard.style[property]}`).join(';');
          styleAndancestorCard.ancestorCard.appendChild(this.thePlayer)

          // vidstack
          const player = document.querySelector('media-player')
          if (player) {
            const playHandler = () => {
              console.log("vidstack play")
              PubSub.publish(Σ._ONPLAY_, null) // vidstack
            }
            const pauseHandler = () => {
              console.log("vidstack pause")
              PubSub.publish(Σ._ONPAUSE_, null) // vidstack
            }
            const stopHandler = () => {
              console.log("vidstack stop")
            }
            const endedHandler = () => {
              PubSub.publish(Σ._NEXT_, this.model) // vidstack
              console.log("vidstack ended")
            }
            const destroyHandler = () => {
              console.log("vidstack destroy")
            }
            player.addEventListener('play', playHandler)
            player.addEventListener('pause', pauseHandler)
            player.addEventListener('stop', stopHandler)
            player.addEventListener('ended', endedHandler)
            player.addEventListener('destroy', destroyHandler)
          }

          // soundcloud
          const widgetIframe = document.getElementById('sc-widget')
          if (widgetIframe) {
            const widget = SC.Widget(widgetIframe)
            if (widget) {
              widget.bind(SC.Widget.Events.READY, function () {
                widget.bind(SC.Widget.Events.PLAY, function () {
                  console.log("soundcloud play")
                  PubSub.publish(Σ._ONPLAY_, null) // soundcloud
                })
                widget.bind(SC.Widget.Events.PAUSE, function () {
                  console.log("soundcloud pause")
                  PubSub.publish(Σ._ONPAUSE_, null) // soundcloud
                })
                widget.bind(SC.Widget.Events.FINISH, function () {
                  PubSub.publish(Σ._NEXT_, this.model) // soundcloud
                  console.log("soundcloud finish")
                })
              })
            }
          }
        }

        this.tokenCreateMediaPlayer = PubSub.subscribe(Σ._CREATE_MEDIA_PLAYER_, this.onCreateMediaPlayer)

        // DESTROY MEDIA PLAYER
        this.onDestroyMediaPlayer = (msg, data) => {
          // console.log(msg, data);

          if (typeof this.thePlayer !== 'undefined') {
            if (typeof this.thePlayer.destroy === "function") {
              // this.thePlayer.destroy()
            }
            // console.log("removing", this.thePlayer)
            this.thePlayer.remove()
            this.thePlayer = undefined
          }

          // Be on the safe side
          document.querySelectorAll('.widgette').forEach(widget => widget.remove())
          document.querySelectorAll('.btn-group [type="button"]').forEach(button => button.innerHTML = button.dataset.label)
        }

        this.tokenDestroyMediaPlayer = PubSub.subscribe(Σ._DESTROY_MEDIA_PLAYER_, this.onDestroyMediaPlayer)

        // START MEDIA PLAYER
        this.onStart = (msg, data) => {
          const button = document.getElementById(data.buttonId)
          const ancestorCard = button.closest(".card")
          ancestorCard.scrollIntoView({
            behavior: 'smooth', // You can use 'auto' for instant scrolling
            block: 'start',     // You can use 'end' or 'center' as well
          });


          const key = this.model.findSongByMediaId(data.id)
          const pos = this.model.findPositionInOrderedKeys(key)
          this.model.cursor.index = pos
        }
        this.tokenOnStart = PubSub.subscribe(Σ._START_, this.onStart)

      } catch (error) {
        console.error("Error fetching body:", error)
      }
    }
  }
  return Vinyl
})();

export default View