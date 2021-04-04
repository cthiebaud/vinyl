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

  const toggle = (playing) => {
    if (playing) {
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

export class GlobalPlayer {
  constructor(...args) {
    // console.log("GlobalPlayer constructed!");
    this.playing = false;
    this.start = () => {
      this.playing = true;
    };
    this.stop = () => {
      this.playing = false;
    };
    this.toggle = () => {
      this.playing = !this.playing;
    };
  }

  setBackgroundClass(background, background_animated) {
    const $start_pause_button = $("#start_pause_button");
    const bgClass = backgroundClass(
      $start_pause_button,
      background,
      background_animated
    );
    this.start = () => {
      this.playing = bgClass.start();
      return this.playing;
    };
    this.stop = () => {
      bgClass.stop();
      this.playing = bgClass.stop();
      return this.playing;
    };
    this.toggle = () => {
      this.playing = bgClass.toggle(this.playing);
      return this.playing;
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
