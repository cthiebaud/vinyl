export class ElementAnimator {
  static isElementPartInViewport(el) {
    const rect = el.getBoundingClientRect();
    return !(
      (window.innerHeight || document.documentElement.clientHeight) < rect.top ||
      rect.bottom < 0 ||
      (window.innerWidth || document.documentElement.clientWidth) < rect.left ||
      rect.right < 0
    );
  }

  static delayIfVisible(el, delay) {
    if (ElementAnimator.isElementPartInViewport(el)) {
      return delay;
    } else {
      return 0;
    }
  }

  static async fadeInElement(element, delay) {
    return new Promise((resolve) => {
      const opacity = 1;
      const options = {
        duration: delay,
        fill: 'forwards',
        easing: 'ease-in-out',
      };

      const keyframes = [
        { opacity: 0 },
        { opacity: opacity },
      ];

      const animation = element.animate(keyframes, options);

      animation.onfinish = () => {
        resolve();
      };
    });
  }

  static async fadeIn(elements, delay) {
    if (elements.length === 0) {
      return;
    }

    const elementsArray = Array.from(elements);

    await elementsArray.reduce(async (accumulator, nextElement) => {
      await accumulator;
      return ElementAnimator.fadeInElement(nextElement, ElementAnimator.delayIfVisible(nextElement, delay));
    }, Promise.resolve());
  }

  static fadeOut(elements, delay, eventually) {
    const elementsArray = [...elements];
    elementsArray.forEach((element) => {
      const options = {
        duration: delay,
        fill: 'forwards',
        easing: 'ease-in-out',
      };

      const keyframes = [
        { opacity: 1 },
        { opacity: 0 },
      ];

      const animation = element.animate(keyframes, options);

      animation.onfinish = () => {
        if (eventually) {
          eventually();
        }
      };
    });
  }
}
