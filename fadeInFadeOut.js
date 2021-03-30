function isElementPartInViewport(el) {
  var box = el.getBoundingClientRect();
  return !(
    (window.innerHeight || document.documentElement.clientHeight) < box.top ||
    box.bottom < 0 ||
    (window.innerWidth || document.documentElement.clientWidth) < box.left ||
    box.right < 0
  );
}

function delayIfVisible(el, delay) {
  if (isElementPartInViewport(el)) {
    return delay;
  } else {
    console.log(0, el);
    return 0;
  }
}

export function fadeIn($elements, delay, eventually, shuffle) {
  if ($elements.length == 0) {
    return;
  }
  let elem = $elements.toArray().map((element) => element);
  const opacity = 1;
  if (shuffle) {
    shuffle(elem);
  }
  const last = () => {
    if (eventually) {
      eventually();
    }
  };

  // https://css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
  // +
  // https://stackoverflow.com/a/60683747/1070215
  function methodThatReturnsAPromise(nextElement) {
    return new Promise((resolve, reject) => {
      $(nextElement).fadeTo(delayIfVisible(nextElement, delay), opacity, () => {
        console.log(`Resolve! ${dayjs().format("hh:mm:ss")}`);

        resolve();
      });
    });
  }
  elem.reduce((accumulatorPromise, nextElement) => {
    console.log(`Loop! ${dayjs().format("hh:mm:ss")}`);

    return accumulatorPromise.then(() => {
      return methodThatReturnsAPromise(nextElement);
    });
  }, Promise.resolve());
}

export function fadeOut($elements, delay, eventually) {
  //stackoverflow.com/a/8333110/1070215
  $elements.fadeTo(delay, 0);
  $(":animated")
    .promise()
    .done(function () {
      if (eventually) {
        eventually();
      }
    });
}
