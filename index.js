"use strict";

import { fadeIn, fadeOut } from "./fadeInFadeOut.js";

$(document).ready(function () {
  const file = $("head meta[name='file']").attr("content") || "index.json";
  const $hide_sort_button = $("head meta[name='hide_sort_button']");
  let hide_sort_button = false;
  if ($hide_sort_button.length != 0) {
    if ($hide_sort_button.attr("content") == "true") {
      hide_sort_button = true;
    }
  }

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
      /*      bandlab: undefined, */
    };

    Object.keys(templates).map(function (key, index) {
      templates[key] = Handlebars.compile(
        document.getElementById(key + "-template").innerHTML
      );
    });

    const urlParams = new URLSearchParams(window.location.search);
    const no_recursion = urlParams.get("no_recursion") || false;

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
    let theOtherPlayer = undefined;
    let $theButton = undefined;

    let theBackground = {
      start: () => {},
      stop: () => {},
      toggle: () => {},
    };

    const backgroundClass = (background, background_animated) => {
      const start = () => {
        $start_pause_button
          .children("img")
          .attr("src", "/vinyl/svgos/pause.svg");
        // /vinyl/svgos/vinyl_rotating.svg
        $("html").css({
          background:
            "url(" + background_animated + ") no-repeat center center",
          "background-size": "contain",
        });
        return "started";
      };
      const stop = () => {
        $start_pause_button
          .children("img")
          .attr("src", "/vinyl/svgos/play.svg");
        // /vinyl/svgos/vinyl.svg
        $("html").css({
          background: "url(" + background + ") no-repeat center center",
          "background-size": "contain",
        });
        return "stopped";
      };
      const toggle = () => {
        if (
          $start_pause_button.children("img").attr("src") ==
          "/vinyl/svgos/pause.svg"
        ) {
          return stop();
        } else {
          return start();
        }
      };
      return {
        start: start,
        stop: stop,
        toggle: toggle,
      };
    };

    //  destroy if exists
    function destroyiframeIfExists($button) {
      if (theOtherPlayer) {
        theOtherPlayer.destroy();
        theOtherPlayer = undefined;
      }
      if ($thePlayer) {
        $thePlayer.forEach((p, k) => {
          p.remove();
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
        $button.html("<span style='color:lightblue'>close&nbsp;×</span>");
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
          "background-color": "#212529",
        },
        boh: { ow: ow, oh: oh },
        $parentCard: $parentCard,
      };
    }

    function showiframe(e, template) {
      e.preventDefault();
      e.stopPropagation();

      // destroy
      theBackground.stop();
      $theButton = destroyiframeIfExists($(e.currentTarget));

      if ($theButton) {
        // create
        if ($theButton.attr("class").indexOf("sound") != -1) {
          theBackground.start();
        }
        const styleAndParentCard = getStyleAndParentCard($theButton);
        const $iframe = $(
          template({
            id: $theButton.data("id"),
          })
        ).css(styleAndParentCard.style);

        $thePlayer = [$iframe];
        $thePlayer.forEach((p) => styleAndParentCard.$parentCard.append(p));
        if ($theButton.attr("class").indexOf("vid") != -1) {
          theOtherPlayer = new Plyr("#yt-widget", {
            autoplay: true,
            ratio: "4:3",
            settings: ["captions"],
          });
          $(theOtherPlayer.elements.container).css(styleAndParentCard.style);
        }
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

          $firstButton.trigger("click");
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

    function insertCards(datums, $parent, order) {
      let cards = [...datums.order];
      if (order == "shuffle") {
        cards = shuffleArray(cards);
      } else if (order == "bpm") {
        cards = cards.sort((a, b) => {
          const bpmA = datums.songs[a].bpm;
          const bpmB = datums.songs[b].bpm;
          return bpmB - bpmA;
        });
      } else if (order == "chronological") {
        cards = cards.sort((a, b) => {
          const dateA = dayjs(datums.songs[a].date);
          const dateB = dayjs(datums.songs[b].date);
          return dateA.isBefore(dateB) ? 1 : -1;
        });
      }

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
                    return "psycho_I.jpg";
                  } else {
                    return "psycho_II.jpg";
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

    const $start_pause_button = $("#start_pause_button");
    $start_pause_button.on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if ("stopped" == theBackground.toggle()) {
        /* destroyiframeIfExists(); */
      }
    });

    $.get(file).done(function (data) {
      if (no_recursion && data.no_recursion) {
        // remove recursive card
        const index = data.order.indexOf(data.no_recursion);
        if (index > -1) {
          data.order.splice(index, 1);
        }
      }

      if (data.brandlink) {
        $("#vinyl_brand")
          .attr("href", data.brandlink)
          .attr("target", "_" + data.id);
      }
      const styleTemplate = Handlebars.compile(
        document.getElementById("style-template").innerHTML
      );
      $("head").append(styleTemplate($("title").text()));

      if (data.copyright) {
        $("#copyright").text(data.copyright);
      }

      if (data.navbarheader) {
        $.get(data.navbarheader).done(function (header) {
          $("#navbarHeader").prepend($(header));
        });
      }

      if (data.icon) {
        $("#vinyl_brand img").attr("src", data.icon);
      }

      if (data.background && data.background_animated) {
        $("html").css({
          background: "url(" + data.background + ") no-repeat center center",
          "background-size": "contain",
        });
        theBackground = backgroundClass(
          data.background,
          data.background_animated
        );
      } else {
        $("#start_pause_button").remove();
      }

      const $row = $("#songs");
      insertCards(data, $row);
      fadeIn($row.children(".col"), 111);

      if (!hide_sort_button) {
        $("#default_order_button").on("click", (e) => {
          fadeOut($row.children(".col"), 111, () => {
            $row.empty();
            insertCards(data, $row);
            fadeIn($row.children(".col"), 222);
          });
        });
        $("#chronological_order_button").on("click", (e) => {
          fadeOut($row.children(".col"), 222, () => {
            $row.empty();
            insertCards(data, $row, "chronological");
            fadeIn($row.children(".col"), 444);
          });
        });
        $("#bpm_order_button").on("click", (e) => {
          fadeOut($row.children(".col"), 222, () => {
            $row.empty();
            insertCards(data, $row, "bpm");
            fadeIn($row.children(".col"), 444);
          });
        });
        $("#shuffle_order_button").on("click", (e) => {
          fadeOut($row.children(".col"), 333, () => {
            $row.empty();
            insertCards(data, $row, "shuffle");
            fadeIn($row.children(".col"), 666);
          });
        });
      } else {
        $("#order_button_group").remove();
      }
    });
  });
});
