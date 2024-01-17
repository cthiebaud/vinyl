import handlebars from 'https://cdn.jsdelivr.net/npm/handlebars@4.7.8/+esm'
import PubSub from 'https://cdn.jsdelivr.net/npm/pubsub-js@1.9.4/+esm'

import { PlayList } from "./PlayList.js"
import { Controller } from "./Controller.js"
import { ElementAnimator } from './ElementAnimator.js'
import { Utils } from './utils.js'

export default class Vinyl {
  constructor() {
    this.lastOrder = 'chronological'
    this.inverse = false
    this.controller = undefined
    this.templates = {
      song: undefined,
      vid: undefined,
      sound: undefined,
    }
  }

  sortCards(datums, order) {
    order = order || this.lastOrder
    let cards = [...datums.order]

    const compareText = (a, b) => {
      const textA = datums.songs[a].text.toLowerCase()
      const textB = datums.songs[b].text.toLowerCase()
      const comp = textA.localeCompare(textB)
      return this.inverse ? -comp : comp
    }

    const compareDuration = (a, b) => {
      const dA = datums.songs[a].duration.split(":")
      const dB = datums.songs[b].duration.split(":")
      let diff = dB[0] - dA[0]
      if (diff === 0) {
        diff = dB[1] - dA[1]
      }
      return this.inverse ? -diff : diff
    }

    const compareChronological = (a, b) => {
      const parseDate = (dateString) => {
        const date = new Date(dateString)
        return isNaN(date) ? 0 : date.getTime()
      }

      const dateA = parseDate(datums.songs[a].date)
      const dateB = parseDate(datums.songs[b].date)

      return this.inverse ? dateA - dateB : dateB - dateA
    }

    if (order === "random") {
      cards = Utils.shuffleArray(cards)
    } else if (order === "alphabetical") {
      cards = cards.sort(compareText)
    } else if (order === "duration") {
      cards = cards.sort(compareDuration)
    } else if (order === "chronological") {
      cards = cards.sort(compareChronological)
    }

    // Disable the clicked item
    if (order !== 'random') {
      const sortButtonOrder = document.getElementById(order)
      if (sortButtonOrder) {
        sortButtonOrder.classList.add('disabled')
      }
    }

    const sortButtonDropdown = document.querySelector('#sort_button [data-bs-toggle="dropdown"]')
    if (sortButtonDropdown) {
      sortButtonDropdown.textContent = order
    }

    const btnCheck = document.getElementById('btn-check')
    if (btnCheck) {
      btnCheck.disabled = order === "random"
    }

    this.lastOrder = order

    return cards
  }

  insertCards(datums, parent, order) {
    const cards = this.sortCards(datums, order)
    cards.forEach((key) => {
      const cardElement = document.createElement('div')
      cardElement.innerHTML = this.templates.song({
        key: key,
        val: datums.songs[key],
        covers: datums.covers || "covers",
        cover: () => {
          if (datums.songs[key].extension) {
            return key + datums.songs[key].extension
          }
          if (key == "brouillard") {
            const random_boolean = Math.random() < 0.5
            if (random_boolean) {
              return "brouillard-psycho_I.jpg"
            } else {
              return "brouillard-psycho_II.jpg"
            }
          }
          return key + ".jpg"
        },
      })

      parent.appendChild(cardElement.firstElementChild)
    })

    // this.addEventHandlers()
  }

  async fetchBodyAndDataFile() {
    try {
      // Fetch body
      document.body.innerHTML = await (async (htmlfile) => {
        const response = await fetch(htmlfile);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${htmlfile}: ${response.status} - ${response.statusText}`);
        }
        return await response.text();
      })("/vinyl/body.html");

      // compile handlebars templates from the body just fetched
      Object.keys(this.templates).map((key) => {
        this.templates[key] = handlebars.compile(
          document.getElementById(key + "-template").innerHTML
        )
      })

      // Fetch data
      const data = await (async () => {
        const fileMeta = document.querySelector("head meta[name='file']")
        const datafile = fileMeta ? fileMeta.getAttribute("content") || "index.json" : "index.json"
        const response = await fetch(datafile);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${datafile}: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
      })();

      // feed body with data
      const navbarHeader = document.getElementById('navbarHeader')
      const vinylBrand = document.getElementById('vinyl_brand')
      const vinylBrandSvg = document.getElementById('vinyl_brand_svg')
      const copyright = document.getElementById('copyright')
      const htmlElement = document.querySelector('html')
      const sortButton = document.getElementById('sort_button')
      const songsElement = document.getElementById('songs')

      if (data.brandlink) {
        vinylBrand.href = data.brandlink
        vinylBrand.target = "_" + data.id
      }

      if (data.copyright) {
        copyright.innerHTML = data.copyright
      }

      if (data.navbarheader) {
        const headerResponse = await fetch(data.navbarheader)

        if (!headerResponse.ok) {
          throw new Error(`Failed to fetch header: ${headerResponse.status} - ${headerResponse.statusText}`)
        }

        const header = await headerResponse.text()
        navbarHeader.insertAdjacentHTML('afterbegin', header)
      }

      if (data.brandLogoSVG) {
        this.playList = new PlayList(vinylBrandSvg, data.brandLogoSVG)
      }

      if (data.background) {
        htmlElement.style.background = "url(" + data.background + ") no-repeat center center"
        htmlElement.style.backgroundSize = "contain"
      }

      this.insertCards(data, songsElement)

      ElementAnimator.fadeIn(songsElement.children, 111)

      // Click handler for dropdown items
      document.querySelectorAll('#sort_button .dropdown-item').forEach(item => {
        item.addEventListener('click', event => {
          var selectedItemText = event.target.textContent
          console.log('Selected item:', selectedItemText)

          sortButton.querySelector('.dropdown-toggle').textContent = selectedItemText

          if (event.target.id !== 'random') {
            event.target.classList.add('disabled')
          }

          document.querySelectorAll('.dropdown-item:not(#random)').forEach(otherItem => {
            otherItem.classList.remove('disabled')
          })

          ElementAnimator.fadeOut(songsElement.children, 100, () => {
            songsElement.innerHTML = ""
            this.insertCards(data, songsElement, selectedItemText)
            ElementAnimator.fadeIn(songsElement.children, 200)
          })
        })
      })

      // Click handler for the inverse checkbox 
      document.getElementById('btn-check').addEventListener('click', event => {
        var isChecked = event.target.checked
        this.inverse = isChecked
        console.log('inverse is :', isChecked)

        ElementAnimator.fadeOut(songsElement.children, 100, () => {
          songsElement.innerHTML = ""
          this.insertCards(data, songsElement)
          ElementAnimator.fadeIn(songsElement.children, 200)
        })
      })

      /////////////
      // CONTROLLER
      console.log("READY TO CREATE CONTROLLER")
      this.controller = new Controller.clazz()

      // CREATE MEDIA PLAYER
      const onCreateMediaPlayer = (msg, data) => {
        console.log(msg, data);

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
        temp.innerHTML = this.templates[data.templateId]({
          id: data.mediaId,
        })
        this.thePlayer = temp.firstElementChild
        this.thePlayer.style.cssText = Object.keys(styleAndancestorCard.style).map(property => `${property}: ${styleAndancestorCard.style[property]}`).join(';');
        styleAndancestorCard.ancestorCard.appendChild(this.thePlayer)
      }

      this.tokenCreateMediaPlayer = PubSub.subscribe(Controller.symbols._CREATE_MEDIA_PLAYER_, onCreateMediaPlayer)

      // DESTROY MEDIA PLAYER
      const onDestroyMediaPlayer = (msg, data) => {
        console.log(msg, data);

        if (typeof this.thePlayer !== 'undefined') {
          if (typeof this.thePlayer.destroy === "function") {
            this.thePlayer.destroy()
          }
          console.log("removing", this.thePlayer)
          this.thePlayer.remove()
          this.thePlayer = undefined
        }

        // Be on the safe side
        document.querySelectorAll('.widgette').forEach(widget => widget.remove())
        document.querySelectorAll('.btn-group [type="button"]').forEach(button => button.innerHTML = button.dataset.text)
      }

      this.tokenDestroyMediaPlayer = PubSub.subscribe(Controller.symbols._DESTROY_MEDIA_PLAYER, onDestroyMediaPlayer)

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
            PubSub.publish(Controller.symbols._CLICKED_, {
              buttonId: button.id,
              mediaId: button.dataset.id,
              templateId: key
            })
          })
        })
      })

    } catch (error) {
      console.error("Error fetching body:", error)
    }
  }
}
