function isElementPartInViewport(el) {
  var box = el.getBoundingClientRect();

  return !(
    (window.innerHeight || document.documentElement.clientHeight) < box.top 
    ||
    box.bottom < 0
    ||
    (window.innerWidth || document.documentElement.clientWidth) < box.left
    ||
    box.right < 0
  );
}

function delayIfVisible(el, delay) {
  if (isElementPartInViewport(el)) {
    return delay;
  } else { 
    console.log(0, el);
    return 0;
  };
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

  

  // // elegant, but something must be missing, animations are not queued
  //   elem
  //     .reduce((acc, e) => Promise.resolve(acc).then((a) => $(e).fadeTo( delayIfVisible(e, delay), opacity, () => a)), undefined)
  //     .then(last);
  
  // respirons à fond !
  $(elem[0]).fadeTo( delayIfVisible(elem[0], delay), opacity, elem.length <= 1 ? last : () => {
    $(elem[1]).fadeTo( delayIfVisible(elem[1], delay), opacity, elem.length <= 2 ? last : () => { 
      $(elem[2]).fadeTo( delayIfVisible(elem[2], delay), opacity, elem.length <= 3 ? last : () => { 
        $(elem[3]).fadeTo( delayIfVisible(elem[3], delay), opacity, elem.length <= 4 ? last : () => { 
          $(elem[4]).fadeTo( delayIfVisible(elem[4], delay), opacity, elem.length <= 5 ? last : () => { 
            $(elem[5]).fadeTo( delayIfVisible(elem[5], delay), opacity, elem.length <= 6 ? last : () => { 
              $(elem[6]).fadeTo( delayIfVisible(elem[6], delay), opacity, elem.length <= 7 ? last : () => { 
                $(elem[7]).fadeTo( delayIfVisible(elem[7], delay), opacity, elem.length <= 8 ? last : () => { 
                  $(elem[8]).fadeTo( delayIfVisible(elem[8], delay), opacity, elem.length <= 9 ? last : () => { 
                    $(elem[9]).fadeTo( delayIfVisible(elem[9], delay), opacity, elem.length <= 10 ? last : () => { 
                      $(elem[10]).fadeTo( delayIfVisible(elem[10], delay), opacity, elem.length <= 11 ? last : () => { 
                        $(elem[11]).fadeTo( delayIfVisible(elem[11], delay), opacity, elem.length <= 12 ? last : () => { 
                          $(elem[12]).fadeTo( delayIfVisible(elem[12], delay), opacity, elem.length <= 13 ? last : () => { 
                            $(elem[13]).fadeTo( delayIfVisible(elem[13], delay), opacity, elem.length <= 14 ? last : () => { 
                              $(elem[14]).fadeTo( delayIfVisible(elem[14], delay), opacity, elem.length <= 15 ? last : () => { 
                                $(elem[16]).fadeTo( delayIfVisible(elem[15], delay), opacity,
                                  last
                                );
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  // ouf !

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
