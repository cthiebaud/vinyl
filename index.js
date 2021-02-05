"use strict";

import { fadeIn, fadeOut } from "./fadeInFadeOut.js";

$(document).ready(function () {
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
    };

    Object.keys(templates).map(function (key, index) {
      templates[key] = Handlebars.compile(
        document.getElementById(key + "-template").innerHTML
      );
    });

    const urlParams = new URLSearchParams(window.location.search);
    const no_recursion = urlParams.get("no_recursion") || false;
    const file = $("head meta[name='file']").attr("content") || "index.json";

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

    let theBackground = {
      start: () => {},
      stop: () => {},
      toggle: () => {},
    };

    const backgroundClass = (background, background_animated) => {
      const start = () => {
        $start_pause_button
          .children("img")
          .attr("src", "/vinyl/svgs/pause.svg");
        // /vinyl/svgs/vinyl_rotating.svg
        $("html").css({
          background:
            "url(" + background_animated + ") no-repeat center center",
          "background-size": "contain",
        });
        return "started";
      };
      const stop = () => {
        $start_pause_button.children("img").attr("src", "/vinyl/svgs/play.svg");
        // /vinyl/svgs/vinyl.svg
        $("html").css({
          background: "url(" + background + ") no-repeat center center",
          "background-size": "contain",
        });
        return "stopped";
      };
      const toggle = () => {
        if (
          $start_pause_button.children("img").attr("src") ==
          "/vinyl/svgs/pause.svg"
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
      if ($thePlayer) {
        $thePlayer.forEach((p) => p.remove());
        $thePlayer = undefined;
      }
      if ($theButton) {
        $theButton.html($theButton.data("text"));
        if (!$button || $theButton.prop("id") === $button.prop("id")) {
          $theButton = undefined;
          return undefined;
        }
      }
      if ($button) {
        $button.html("<span style='color:lightblue'>close ×</span>");
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
        qwe: { ow: ow, oh: oh },
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

    function insertCards(datums, $parent) {
      const shuffle = shuffleArray([...datums.order]);

      shuffle.forEach((key) => {
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
      fadeIn($row.children(".col"), 111, () => {});

      $("#shuffle_button").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        fadeOut($row.children(".col"), 333, () => {
          $row.empty();
          insertCards(data, $row);
          fadeIn($row.children(".col"), 666, () => {}, shuffleArray);
        });
      });
    });
  });
});
