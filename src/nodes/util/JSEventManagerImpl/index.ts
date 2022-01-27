import CreateCallableConstructor from '../index';

class JSEventManagerImpl {
  #canvas = document.getElementById('gameCanvas');

  #touchBegan;

  #touchMoved;

  #touchEnded;

  #enabled = true;

  #preTouchPoint = cc.p(0, 0);

  #preTouchPool = [];

  #preTouchPoolPointer = 0;

  #getPreTouch = (touch) => {
    let preTouch = null;
    const locPreTouchPool = this.#preTouchPool;
    const id = touch.getID();
    for (let i = locPreTouchPool.length - 1; i >= 0; i -= 1) {
      if (locPreTouchPool[i].getID() === id) {
        preTouch = locPreTouchPool[i];
        break;
      }
    }
    if (!preTouch) {
      preTouch = touch;
    }
    return preTouch;
  };

  #setPreTouch = (touch) => {
    let find = false;
    const locPreTouchPool = this.#preTouchPool;
    const id = touch.getID();
    for (let i = locPreTouchPool.length - 1; i >= 0; i -= 1) {
      if (locPreTouchPool[i].getID() === id) {
        locPreTouchPool[i] = touch;
        find = true;
        break;
      }
    }
    if (!find) {
      if (locPreTouchPool.length <= 50) {
        locPreTouchPool.push(touch);
      } else {
        locPreTouchPool[this.#preTouchPoolPointer] = touch;
        this.#preTouchPoolPointer = (this.#preTouchPoolPointer + 1) % 50;
      }
    }
  };

  // eslint-disable-next-line max-statements
  #getTouchesByEvent = (event, pos) => {
    const touchArr = [];
    const locView = cc.director.getOpenGLView();
    const locPreTouch = this.#preTouchPoint;
    const { length } = event.changedTouches;
    let touchEvent;
    let touch;
    let preLocation;

    for (let i = 0; i < length; i += 1) {
      touchEvent = event.changedTouches[i];
      if (touchEvent) {
        let location;
        if (cc.sys.BROWSER_TYPE_FIREFOX === cc.sys.browserType) {
          location = locView.convertToLocationInView(touchEvent.pageX, touchEvent.pageY, pos);
        } else {
          location = locView.convertToLocationInView(touchEvent.clientX, touchEvent.clientY, pos);
        }
        if (touchEvent.identifier != null) {
          touch = new cc.Touch(location.x, location.y, touchEvent.identifier);
          preLocation = this.#getPreTouch(touch).getLocation();
          // eslint-disable-next-line no-underscore-dangle
          touch._setPrevPoint(preLocation.x, preLocation.y);
          this.#setPreTouch(touch);
        } else {
          touch = new cc.Touch(location.x, location.y);
          // eslint-disable-next-line no-underscore-dangle
          touch._setPrevPoint(locPreTouch.x, locPreTouch.y);
        }
        locPreTouch.x = location.x;
        locPreTouch.y = location.y;
        touchArr.push(touch);
      }
    }
    return touchArr;
  };

  #getHTMLElementPosition = (element) => {
    const docElem = document.documentElement;
    const win = window;
    let box;
    if (cc.isFunction(element.getBoundingClientRect)) {
      box = element.getBoundingClientRect();
    } else {
      box = {
        left: 0,
        top: 0,
        width: parseInt(element.style.width, 10),
        height: parseInt(element.style.height, 10),
      };
    }
    return {
      left: box.left + win.scrollX - docElem.clientLeft,
      top: box.top + win.scrollY - docElem.clientTop,
      width: box.width,
      height: box.height,
    };
  };

  #getStartTouches = (touches) => {
    let selTouch;
    let curTouch;
    const handleTouches = [];
    const now = cc.sys.now();
    for (let i = 0, len = touches.length; i < len; i += 1) {
      selTouch = touches[i];

      // eslint-disable-next-line no-underscore-dangle
      curTouch = new cc.Touch(selTouch._point.x, selTouch._point.y, selTouch.getID());
      // eslint-disable-next-line no-underscore-dangle
      curTouch._lastModified = now;
      // eslint-disable-next-line no-underscore-dangle
      curTouch._setPrevPoint(selTouch._prevPoint);
      handleTouches.push(curTouch);
    }
    if (handleTouches.length > 0) {
      // eslint-disable-next-line no-underscore-dangle
      cc.director.getOpenGLView()
        ._convertTouchesWithScale(handleTouches);
      return new cc.EventTouch(handleTouches);
    }
    return undefined;
  };

  #handleOnTouchBegan = (event) => {
    if (!event.changedTouches) return undefined;

    const pos = this.#getHTMLElementPosition(this.#canvas);
    pos.left -= document.body.scrollLeft;
    pos.top -= document.body.scrollTop;

    const touches = this.#getTouchesByEvent(event, pos);
    return this.#getStartTouches(touches);
  };

  addListener = ({
    onTouchBegan,
    onTouchMoved,
    onTouchEnded,
  }) => {
    this.#touchMoved = onTouchMoved;
    this.#touchEnded = onTouchEnded;

    if (onTouchBegan) {
      this.#touchBegan = onTouchBegan;
      this.#canvas.addEventListener('touchstart', (event) => {
        const originalTouches = this.#handleOnTouchBegan(event);

        if (originalTouches) {
          const touches = originalTouches.getTouches();
          for (let i = 0; i < touches.length; i += 1) {
            const currentTouch = touches[i];
            onTouchBegan(currentTouch, event);
          }
        }
      }, false);

      if (onTouchMoved) {
        this.#touchMoved = onTouchMoved;
        this.#canvas.addEventListener('touchmove', (event) => {
          const originalTouches = this.#handleOnTouchBegan(event);

          if (originalTouches) {
            const touches = originalTouches.getTouches();
            for (let i = 0; i < touches.length; i += 1) {
              const currentTouch = touches[i];
              onTouchMoved(currentTouch, event);
            }
          }
        }, false);
      }

      if (onTouchEnded) {
        this.#touchEnded = onTouchEnded;
        this.#canvas.addEventListener('touchend', (event) => {
          const originalTouches = this.#handleOnTouchBegan(event);

          if (originalTouches) {
            const touches = originalTouches.getTouches();
            for (let i = 0; i < touches.length; i += 1) {
              const currentTouch = touches[i];
              onTouchEnded(currentTouch, event);
            }
          }
        }, false);
      }
    }
  };

  setEnabled = (enabled: boolean): void => {
    this.#enabled = enabled;
  };

  isEnabled = (): boolean => this.#enabled;

  removeAllListeners = (): void => {
    if (this.#touchBegan) {
      this.#canvas.removeEventListener('touchstart', this.#touchBegan);
      this.#touchBegan = undefined;
    }

    if (this.#touchMoved) {
      this.#canvas.removeEventListener('touchmove', this.#touchMoved);
      this.#touchMoved = undefined;
    }

    if (this.#touchEnded) {
      this.#canvas.removeEventListener('touchend', this.#touchEnded);
      this.#touchEnded = undefined;
    }
  };
}

export const JSEventManager = CreateCallableConstructor(JSEventManagerImpl);

export default JSEventManagerImpl;
