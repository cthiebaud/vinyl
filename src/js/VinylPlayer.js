import handlebars from 'https://cdn.jsdelivr.net/npm/handlebars@4.7.8/+esm'

import { PlayList } from "./PlayList.js";
import ElementAnimator from './ElementAnimator.js';

export default class VinylPlayer {
  constructor() {
    this.fileMeta = document.querySelector("head meta[name='file']")
    this.file = this.fileMeta ? this.fileMeta.getAttribute("content") || "index.json" : "index.json"
    this.playList = null
    this.lastOrder = 'chronological'
    this.inverse = false

    this.templates = {
      // compile the templates
      song: undefined,
      vid: undefined,
      sound: undefined,
      markdown: undefined,
      url: undefined,
      instagram: undefined,
      score: undefined,
    };
  }

  destroyiframeIfExists(button) {
    if (thePlayer) {
      thePlayer.forEach(player => {
        Array.from(player.entries()).forEach(([index, elem]) => {
          console.log("removing", index, elem);
          if (typeof elem.destroy === "function") {
            elem.destroy();
          }
        });
        console.log("removing", player);
        player.remove();
      });
      thePlayer = undefined;
    }

    // Be on the safe side
    document.querySelectorAll('.widgette').forEach(widget => widget.remove());

    if (this.theButton) {
      this.theButton.innerHTML = this.theButton.dataset.text;
      if (!button || this.theButton.id === button.id) {
        this.theButton = undefined;
        return undefined;
      }
    }

    if (button) {
      button.innerHTML = "<span'>close</span>"; // Style 'color:lightblue'
    }

    return button;
  }

  sortCards(datums, order) {
    order = order || this.lastOrder;
    let cards = [...datums.order];

    const compareText = (a, b) => {
      const textA = datums.songs[a].text.toLowerCase();
      const textB = datums.songs[b].text.toLowerCase();
      const comp = textA.localeCompare(textB);
      return this.inverse ? -comp : comp;
    };

    const compareDuration = (a, b) => {
      const dA = datums.songs[a].duration.split(":");
      const dB = datums.songs[b].duration.split(":");
      let diff = dB[0] - dA[0];
      if (diff === 0) {
        diff = dB[1] - dA[1];
      }
      return this.inverse ? -diff : diff;
    };

    const compareChronological = (a, b) => {
      /*
      const dateA = dayjs(datums.songs[a].date);
      const dateB = dayjs(datums.songs[b].date);
      let diff = dateA.isBefore(dateB) ? 1 : -1;
      return this.inverse ? -diff : diff;
      */
      return 0
    };

    if (order === "random") {
      cards = shuffleArray(cards);
    } else if (order === "alphabetical") {
      cards = cards.sort(compareText);
    } else if (order === "duration") {
      cards = cards.sort(compareDuration);
    } else if (order === "chronological") {
      cards = cards.sort(compareChronological);
    }

    // Disable the clicked item
    if (order !== 'random') {
      const sortButtonOrder = document.getElementById(order);
      if (sortButtonOrder) {
        sortButtonOrder.classList.add('disabled');
      }
    }

    const sortButtonDropdown = document.querySelector('#sort_button [data-bs-toggle="dropdown"]');
    if (sortButtonDropdown) {
      sortButtonDropdown.textContent = order;
    }

    const btnCheck = document.getElementById('btn-check');
    if (btnCheck) {
      btnCheck.disabled = order === "random";
    }

    this.lastOrder = order;

    return cards;
  }

  insertCards(datums, parent, order) {
    const cards = this.sortCards(datums, order);
    cards.forEach((key) => {
      const cardElement = document.createElement('div');
      cardElement.innerHTML = this.templates.song({
        key: key,
        val: datums.songs[key],
        covers: datums.covers || "covers",
        cover: () => {
          if (datums.songs[key].extension) {
            return key + datums.songs[key].extension;
          }
          if (key == "brouillard") {
            const random_boolean = Math.random() < 0.5;
            if (random_boolean) {
              return "brouillard-psycho_I.jpg";
            } else {
              return "brouillard-psycho_II.jpg";
            }
          }
          return key + ".jpg";
        },
      });

      parent.appendChild(cardElement.firstElementChild);
    });

    // addEventHandlers();

  }

  async fetchBody() {
    try {
      // Fetch body
      const response0 = await fetch("/vinyl/body.html")

      if (!response0.ok) {
        throw new Error(`Failed to fetch: ${response0.status} - ${response0.statusText}`)
      }

      document.body.innerHTML = await response0.text()

      handlebars.registerHelper({
        'isNotBoolean:'(condition, first, second) {
          return condition !== true ? first : second;
        }
      });

      Object.keys(this.templates).map((key) => {
        this.templates[key] = handlebars.compile(
          document.getElementById(key + "-template").innerHTML
        );
      });

      const response = await fetch(this.file);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      const vinylBrand = document.getElementById('vinyl_brand');
      const copyright = document.getElementById('copyright');
      const navbarHeader = document.getElementById('navbarHeader');
      const vinylBrandSvg = document.getElementById('vinyl_brand_svg');
      const htmlElement = document.querySelector('html');
      const sortButton = document.getElementById('sort_button');
      const songsElement = document.getElementById('songs');

      if (data.brandlink) {
        vinylBrand.href = data.brandlink;
        vinylBrand.target = "_" + data.id;
      }

      if (data.copyright) {
        copyright.innerHTML = data.copyright;
      }

      if (data.navbarheader) {
        const headerResponse = await fetch(data.navbarheader);

        if (!headerResponse.ok) {
          throw new Error(`Failed to fetch header: ${headerResponse.status} - ${headerResponse.statusText}`);
        }

        const header = await headerResponse.text();
        navbarHeader.insertAdjacentHTML('afterbegin', header);
      }

      if (data.brandLogoSVG) {
        this.playList = new PlayList(vinylBrandSvg, data.brandLogoSVG, this.destroyiframeIfExists);
        console.log("NEW play list", this.playList);
      }

      if (data.background) {
        htmlElement.style.background = "url(" + data.background + ") no-repeat center center";
        htmlElement.style.backgroundSize = "contain";
      }

      this.insertCards(data, songsElement);

      ElementAnimator.fadeIn(songsElement.children, 111);

      // Click handler for dropdown items
      document.querySelectorAll('#sort_button .dropdown-item').forEach(item => {
        item.addEventListener('click', event => {
          var selectedItemText = event.target.textContent;
          console.log('Selected item:', selectedItemText);

          sortButton.querySelector('.dropdown-toggle').textContent = selectedItemText;

          if (event.target.id !== 'random') {
            event.target.classList.add('disabled');
          }

          document.querySelectorAll('.dropdown-item:not(#random)').forEach(otherItem => {
            otherItem.classList.remove('disabled');
          });

          ElementAnimator.fadeOut(songsElement.children, 100, () => {
            songsElement.innerHTML = "";
            this.insertCards(data, songsElement, selectedItemText);
            ElementAnimator.fadeIn(songsElement.children, 200);
          });
        });
      });

      // Click handler for the checkbox 
      document.getElementById('btn-check').addEventListener('click',  event => {
        var isChecked = event.target.checked;
        this.inverse = isChecked;
        console.log('inverse is :', isChecked);

        ElementAnimator.fadeOut(songsElement.children, 100, () => {
          songsElement.innerHTML = "";
          this.insertCards(data, songsElement);
          ElementAnimator.fadeIn(songsElement.children, 200);
        });
      });

    } catch (error) {
      console.error("Error fetching body:", error)
    }
  }
}
