import CreateCallableConstructor from '../index';

class JSEventManagerImpl {
  #canvas = document.getElementById('gameCanvas');

  #touchTimeout = 5000;

  #touchBegan;

  #touchMoved;

  #touchEnded;

  #enabled = true;

  #touchesIntegerDict = {};

  #touches = [];

  #maxTouches = 5;

  #preTouchPool = [];

  #preTouchPoolPointer = 0;

  #indexBitsUsed = 0;

  #preTouchPoint = cc.p(0, 0);

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
    if (!preTouch) preTouch = touch;
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

  #getUnUsedIndex = () => {
    let temp = this.#indexBitsUsed;
    const now = cc.sys.now();

    for (let i = 0; i < this.#maxTouches; i += 1) {
      if (!(temp & 0x00000001)) {
        this.#indexBitsUsed |= (1 << i);
        return i;
      }
      const touch = this.#touches[i];
      if (now - touch._lastModified > this.#touchTimeout) {
        this.#removeUsedIndexBit(i);
        delete this.#touchesIntegerDict[touch.getID()];
        return i;
      }

      temp >>= 1;
    }
    return -1;
  };

  #removeUsedIndexBit = (index) => {
    if (index < 0 || index >= this.#maxTouches) return;

    let temp = 1 << index;
    temp = ~temp;
    this.#indexBitsUsed &= temp;
  };

  #getSetOfTouchesEndOrCancel = (touches) => {
    let selTouch;
    let index;
    let touchID;
    const handleTouches = [];
    const locTouches = this.#touches;
    const locTouchesIntDict = this.#touchesIntegerDict;
    for (let i = 0, len = touches.length; i < len; i += 1) {
      selTouch = touches[i];
      touchID = selTouch.getID();
      index = locTouchesIntDict[touchID];

      if (index == null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (locTouches[index]) {
        locTouches[index]._setPoint(selTouch._point);
        locTouches[index]._setPrevPoint(selTouch._prevPoint);
        handleTouches.push(locTouches[index]);
        this.#removeUsedIndexBit(index);
        delete locTouchesIntDict[touchID];
      }
    }
    return handleTouches;
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

  #getCanvasPosition = () => {
    const pos = this.#getHTMLElementPosition(this.#canvas);
    pos.left -= document.body.scrollLeft;
    pos.top -= document.body.scrollTop;
    return pos;
  };

  #getTouchesByEvent = (event, pos) => {
    const touchArr = [];
    const locView = cc.director.getOpenGLView();
    let touchEvent;
    let touch;
    let preLocation;
    const locPreTouch = this.#preTouchPoint;

    const { length } = event.changedTouches;
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
          // use Touch Pool
          preLocation = this.#getPreTouch(touch).getLocation();
          touch._setPrevPoint(preLocation.x, preLocation.y);
          this.#setPreTouch(touch);
        } else {
          touch = new cc.Touch(location.x, location.y);
          touch._setPrevPoint(locPreTouch.x, locPreTouch.y);
        }
        locPreTouch.x = location.x;
        locPreTouch.y = location.y;
        touchArr.push(touch);
      }
    }
    return touchArr;
  };

  #handleTouchesBegin = (touches) => {
    let selTouch;
    let index;
    let curTouch;
    let touchID;
    const handleTouches = [];
    const locTouchIntDict = this.#touchesIntegerDict;
    const now = cc.sys.now();
    for (let i = 0, len = touches.length; i < len; i += 1) {
      selTouch = touches[i];
      touchID = selTouch.getID();
      index = locTouchIntDict[touchID];

      if (index == null) {
        const unusedIndex = this.#getUnUsedIndex();
        if (unusedIndex === -1) {
          continue;
        }

        curTouch = new cc.Touch(selTouch._point.x, selTouch._point.y, selTouch.getID());
        this.#touches[unusedIndex] = new cc.Touch(selTouch._point.x, selTouch._point.y,
          selTouch.getID());
        curTouch._lastModified = now;
        curTouch._setPrevPoint(selTouch._prevPoint);
        locTouchIntDict[touchID] = unusedIndex;
        handleTouches.push(curTouch);
      }
    }
    if (handleTouches.length > 0) {
      cc.director.getOpenGLView()._convertTouchesWithScale(handleTouches);
      return new cc.EventTouch(handleTouches);
    }
    return undefined;
  };

  #handTouchBegan = (onTouchBegan) => {
    this.#touchBegan = onTouchBegan;
    this.#canvas.addEventListener('touchstart', (event) => {
      if (this.#enabled) {
        if (!event.changedTouches) return;

        const cocosTouchEvent = this.#handleTouchesBegin(
          this.#getTouchesByEvent(event, this.#getCanvasPosition()),
        );

        if (onTouchBegan && cocosTouchEvent) {
          const touches = cocosTouchEvent.getTouches();
          for (let i = 0; i < touches.length; i += 1) {
            const currentTouch = touches[i];
            onTouchBegan(currentTouch, cocosTouchEvent);
          }
        }
      }
    }, false);
  };

  #handleTouchesMove = (touches) => {
    let selTouch;
    let index;
    let touchID;
    const handleTouches = [];
    const locTouches = this.#touches;
    const now = cc.sys.now();
    for (let i = 0, len = touches.length; i < len; i += 1) {
      selTouch = touches[i];
      touchID = selTouch.getID();
      index = this.#touchesIntegerDict[touchID];

      if (index == null) {
        continue;
      }
      if (locTouches[index]) {
        locTouches[index]._setPoint(selTouch._point);
        locTouches[index]._setPrevPoint(selTouch._prevPoint);
        locTouches[index]._lastModified = now;
        handleTouches.push(locTouches[index]);
      }
    }
    if (handleTouches.length > 0) {
      cc.director.getOpenGLView()._convertTouchesWithScale(handleTouches);
      return new cc.EventTouch(handleTouches);
    }
    return undefined;
  };

  #handleTouchMoved = (onTouchMoved) => {
    this.#touchMoved = onTouchMoved;
    this.#canvas.addEventListener('touchmove', (event) => {
      if (this.#enabled) {
        if (!event.changedTouches) return;

        const cocosTouchEvent = this.#handleTouchesMove(
          this.#getTouchesByEvent(event, this.#getCanvasPosition()),
        );
        if (onTouchMoved && cocosTouchEvent) {
          const touches = cocosTouchEvent.getTouches();
          for (let i = 0; i < touches.length; i += 1) {
            const currentTouch = touches[i];
            onTouchMoved(currentTouch, cocosTouchEvent);
          }
        }
      }
    }, false);
  };

  #handleTouchesEnd = (touches) => {
    const handleTouches = this.#getSetOfTouchesEndOrCancel(touches);
    if (handleTouches.length > 0) {
      cc.director.getOpenGLView()._convertTouchesWithScale(handleTouches);
      return new cc.EventTouch(handleTouches);
    }
    return undefined;
  };

  #handleTouchEnd = (onTouchEnded) => {
    this.#touchEnded = onTouchEnded;
    this.#canvas.addEventListener('touchend', (event) => {
      if (this.#enabled) {
        if (!event.changedTouches) return;

        const cocosTouchEvent = this.#handleTouchesEnd(
          this.#getTouchesByEvent(event, this.#getCanvasPosition()),
        );

        if (onTouchEnded && cocosTouchEvent) {
          const touches = cocosTouchEvent.getTouches();
          for (let i = 0; i < touches.length; i += 1) {
            const currentTouch = touches[i];
            onTouchEnded(currentTouch, cocosTouchEvent);
          }
        }
      }
    }, false);
  };

  addListener = ({
    onTouchBegan,
    onTouchMoved,
    onTouchEnded,
  }) => {
    this.#handTouchBegan(onTouchBegan);
    this.#handleTouchMoved(onTouchMoved);
    this.#handleTouchEnd(onTouchEnded);
  };

  setEnabled = (enabled) => {
    this.#enabled = enabled;
  };

  isEnabled = () => this.#enabled;

  removeAllListeners = () => {
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
