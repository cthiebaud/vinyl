"use strict";

import { fadeIn, fadeOut } from "./fadeInFadeOut.js";
import { PlayList } from "./PlayList.js";

$(document).ready(function () {
  const file = $("head meta[name='file']").attr("content") || "index.json";

  let playList = null
  let lastOrder = 'chronological'
  let inverse = false;

  // fetch body
  $.get("/vinyl/body.html").done(function (body) {
    $("body").append(body);

    const canonical = encodeURI($('head link[rel="canonical"]').attr("href"));
    $("#vinyl_share").attr(
      "href",
      "https://www.facebook.com/sharer/sharer.php?u=" +
      canonical +
      "&amp;src=sdkpreparse"
    );

    const templates = {
      // compile the templates
      song: undefined,
      vid: undefined,
      sound: undefined,
      markdown: undefined,
      url: undefined,
      instagram: undefined,
      score: undefined,
    };

    Handlebars.registerHelper({
      'isNotBoolean:'(condition, first, second) {
        return condition !== true ? first : second;
      }
    });

    Object.keys(templates).map(function (key) {
      templates[key] = Handlebars.compile(
        document.getElementById(key + "-template").innerHTML
      );
    });

    // http://stackoverflow.com/questions/20789373/shuffle-array-in-ng-repeat-angular
    // -> Fisher–Yates shuffle algorithm
    function shuffleArray(array) {
      var m = array.length,
        t,
        i;
      // While there remain elements to shuffle
      while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);
        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
      }
      return array;
    }

    let $thePlayer = undefined;
    let $theButton = undefined;

    //  destroy if exists
    function destroyiframeIfExists($button) {
      if ($thePlayer) {
        $thePlayer.forEach(($p, k) => {
          $p.each((index, elem) => {
            console.log("removing", k, index, elem)
            if (typeof elem.destroy === "function") {
              elem.destroy()
            }
          })
          console.log("removing", k, $p)
          $p.remove();
        });
        $thePlayer = undefined;
      }

      // be on the safe side
      $(".widgette").remove();

      if ($theButton) {
        $theButton.html($theButton.data("text"));
        if (!$button || $theButton.prop("id") === $button.prop("id")) {
          $theButton = undefined;
          return undefined;
        }
      }
      if ($button) {
        $button.html("<span'>close</span>"); // style='color:lightblue
      }
      return $button;
    }

    function getStyleAndParentCard($button) {
      const $parentCard = $button.parents("div.card");
      const $img = $parentCard.children("img");
      const pos = $img.position();
      const oh = $img.outerHeight();
      const ow = $img.outerWidth();

      return {
        style: {
          position: "absolute",
          top: pos.top,
          left: pos.left,
          width: ow + "px",
          height: oh + "px",
        },
        boh: { ow: ow, oh: oh },
        $parentCard: $parentCard,
      };
    }

    function showiframe(e, template) {
      e.preventDefault();
      e.stopPropagation();

      // destroy
      $theButton = destroyiframeIfExists($(e.currentTarget));

      if ($theButton) {
        const styleAndParentCard = getStyleAndParentCard($theButton);
        const $iframe = $(
          template({
            id: $theButton.data("id"),
          })
        ).css(styleAndParentCard.style);

        $thePlayer = [$iframe];
        $thePlayer.forEach((p) => styleAndParentCard.$parentCard.append(p));

        const player = document.querySelector('media-player');
        player.addEventListener('play', (e) => {
          e.stopPropagation();
          console.log("play")
          playList.onStart()
        })
        player.addEventListener('pause', (e) => {
          e.stopPropagation();
          console.log("pause")
          playList.onStop()
        })
        player.addEventListener('stop', (e) => {
          e.stopPropagation();
          console.log("stop")
          playList.onStop()
        })
        player.addEventListener('ended', (e) => {
          e.stopPropagation();
          console.log("ended")
          playList.onStop()
        })
        player.addEventListener('destroy', (e) => {
          e.stopPropagation();
          console.log("destroy")
          playList.onStop()
        })
      }
    }

    function addEventHandlers() {
      $("div.card img.img-fluid").on("click", (e) => {
        const $firstButton = $(e.currentTarget)
          .parent()
          .find(".btn-group [type='button']:first-child");
        if ($firstButton.length) {
          e.preventDefault();
          e.stopPropagation();

          $firstButton.first().trigger("click");
        } else if ($(e.currentTarget).data("url")) {
          e.preventDefault();
          e.stopPropagation();

          window.open($(e.currentTarget).data("url"));
        }
      });

      Object.keys(templates).map(function (key, index) {
        $("div.card [type='button']." + key).on("click", (e) =>
          showiframe(e, templates[key])
        );
      });
    }

    function sortCards(datums, order) {
      order = order || lastOrder
      let cards = [...datums.order];
      if (order == "random") {
        cards = shuffleArray(cards);
      } else if (order == "alphabetical") {
        cards = cards.sort((a, b) => {
          const textA = datums.songs[a].text;
          const textB = datums.songs[b].text;
          const comp = textA.toLowerCase().localeCompare(textB.toLowerCase())
          return inverse ? -comp : comp;
        });
      } else if (order == "duration") {
        cards = cards.sort((a, b) => {
          const dA = datums.songs[a].duration.split(":");
          const dB = datums.songs[b].duration.split(":");
          let diff = dB[0] - dA[0];
          if (diff == 0) {
            diff = dB[1] - dA[1];
          }
          return inverse ? -diff : diff;
        });
      } else if (order == "chronological") {
        cards = cards.sort((a, b) => {
          const dateA = dayjs(datums.songs[a].date);
          const dateB = dayjs(datums.songs[b].date);
          let diff = dateA.isBefore(dateB) ? 1 : -1;
          return inverse ? -diff : diff;
        });
      }
      // Disable the clicked item
      if (order !== 'random') {
        $(`#sort_button #${order}`).addClass('disabled');
      }
      $('#sort_button [data-bs-toggle="dropdown"]').text(order)
      const btnCheck = document.getElementById('btn-check')
      if (order === "random") {
        btnCheck.disabled = true
      } else {
        btnCheck.disabled = false
      }
      lastOrder = order;

      return cards;
    }

    function insertCards(datums, $parent, order) {
      const cards = sortCards(datums, order);
      cards.forEach((key) => {
        $parent.append(
          $(
            templates.song({
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
            })
          )
        );
      });

      addEventHandlers();
    }

    $.get(file).done(function (data) {
      if (data.brandlink) {
        $("#vinyl_brand")
          .attr("href", data.brandlink)
          .attr("target", "_" + data.id);
      }

      if (data.copyright) {
        $("#copyright").html(data.copyright);
      }

      if (data.navbarheader) {
        $.get(data.navbarheader).done(function (header) {
          $("#navbarHeader").prepend($(header));
        });
      }

      if (data.brandLogoSVG) {
        const vinyl_brand_svg = document.getElementById('vinyl_brand_svg')
        playList = new PlayList(vinyl_brand_svg, data.brandLogoSVG)
        console.log(playList)
      }

      if (data.background) {
        $("html").css({
          background: "url(" + data.background + ") no-repeat center center",
          "background-size": "contain",
        });
      }

      const $row = $("#songs");
      insertCards(data, $row);
      fadeIn($row.children(".col"), 111);

      // Click handler for dropdown items
      $('#sort_button .dropdown-item').on('click', function () {
        // Access the text content of the clicked item
        var selectedItemText = $(this).text();

        // Perform actions based on the selected item
        console.log('Selected item:', selectedItemText);

        // Set the text of the dropdown-toggle to the selected item
        $('#sort_button .dropdown-toggle').text(selectedItemText);

        // Disable the clicked item if it is not random (random is never disabled)
        if (this.id !== 'random') {
          $(this).addClass('disabled');
        }

        // Enable every other dropdown item
        $('.dropdown-item').not(this).removeClass('disabled');

        // Add your custom logic here
        fadeOut($row.children(".col"), 100, () => {
          $row.empty();
          insertCards(data, $row, selectedItemText);
          fadeIn($row.children(".col"), 200);
        });

      });

      // Click handler for the checkbox
      $('#sort_button #btn-check').on('click', function () {
        // Check if the checkbox is checked or unchecked
        var isChecked = $(this).prop('checked');
        inverse = isChecked
        // Perform actions based on the checkbox state
        console.log('inverse is :', isChecked);
        // Add your custom logic here
        fadeOut($row.children(".col"), 100, () => {
          $row.empty();
          insertCards(data, $row);
          fadeIn($row.children(".col"), 200);
        });
      });
    });
  });
});
