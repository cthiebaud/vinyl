"use strict";

const backgroundClass = (
  $start_pause_button,
  background,
  background_animated
) => {
  const start = () => {
    $start_pause_button.removeClass("start_button");
    $start_pause_button.addClass("stop_button");

    $("html").css({
      background: "url(" + background_animated + ") no-repeat center center",
      "background-size": "contain",
    });

    return true;
  };
  const stop = () => {
    $start_pause_button.addClass("start_button");
    $start_pause_button.removeClass("stop_button");

    $("html").css({
      background: "url(" + background + ") no-repeat center center",
      "background-size": "contain",
    });

    return false;
  };

  return {
    start: start,
    stop: stop,
  };
};

export class GlobalPlayer {
  constructor(...args) {
    this.player = undefined;
    this.data = undefined;
    this.start = undefined;
    this.stop = undefined;
    this.toggle = () => {
      if (this.player && this.player.playing) {
        return this.stop();
      } else {
        return this.start();
      }
    };
  }

  setData(data) {
    this.data = data;
  }

  setBackgroundClass(background, background_animated) {
    const $start_pause_button = $("#start_pause_button");
    const bgClass = backgroundClass(
      $start_pause_button,
      background,
      background_animated
    );
    this.start = () => {
      bgClass.start();
      let index = 0;
      const urlIDs = $("#songs")
        .children()
        .toArray()
        .reduce((result, s) => {
          const w = this.data.songs[$(s).attr("id").slice(0, -1)].watch;
          if (w && w.length > 0) {
            result.push(w[0].id);
          }
          return result;
        }, []);
      console.log(urlIDs);

      const $asd = $(
        '<div id="blah2" data-plyr-provider="youtube" data-plyr-embed-id="' +
          urlIDs[index] +
          '">'
      );

      $("main").prepend($asd);
      $(".album").hide();

      this.player = new Plyr("#blah2", {
        ratio: "4:3",
      });

      //
      this.player.on("ready", (event) => {
        // this.player.on("exitfullscreen", (event) => {
        //   this.player.on("exitfullscreen", (event) => {});
        //   this.stop();
        // });
        // this.player.fullscreen.enter();
        this.player.play();
      });
      this.player.on("ended", (event) => {
        console.log("Plyr ended");
        index = index + 1;
        if (index >= urlIDs.length) {
          this.stop();
        } else {
          this.player.source = {
            type: "video",
            sources: [
              {
                src: urlIDs[index],
                provider: "youtube",
              },
            ],
          };
        }
      });

      return true;
    };
    this.stop = () => {
      bgClass.stop();
      $(".plyr").remove();
      $("#sprite-plyr").remove();
      this.player.destroy();
      this.player = undefined;
      this.player = new Plyr("#blah2", {
        ratio: "4:3",
      });
      $(".album").show();
      return false;
    };
    $start_pause_button.on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!this.toggle()) {
        /* destroyiframeIfExists(); */
      }
    });
  }
}
