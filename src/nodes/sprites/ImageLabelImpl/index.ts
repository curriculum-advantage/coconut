import html2canvas from 'html2canvas';
import hash from 'hash-it';
import { primaryFont } from '../../../lib/constants';
import CreateCallableConstructor from '../../util';
import isPointOnTarget from '../../../utils/isPointOnTarget';
import Queue from '../../../utils/Queue';

/**
 * Creates a Cocos image sprite as a label.
 *
 * @param parent Parent node (scene/layer/sprite) that the label should be added to.
 * @param options.text Text that the label will display.
 * @param option.display used to override the default dom display behavior.
 * @param options.textAlign used in conjunction with option.display to change the default dom text align behavior.
 * @param options.opacity Opacity of the displayed text.
 * @param options.fontName Font of the displayed text.
 * @param options.fontSize Font size of the displayed text.
 * @param options.horizontalAlign Horizontal alignment of the displayed text.
 * @param options.verticalAlign Vertical alignment of the displayed text.
 * @param options.fontWeight Font weight of the displayed text.
 * @param options.fontStyle Font style of the displayed text.
 * @param options.lineHeight specifies the height of a line.
 * @param options.wordSpacing increases or decreases the white space between words.
 * @param options.position Position (relative to `parent`) that the label `anchor` is placed at.
 * @param options.fontColor Color of the displayed text.
 * @param options.strokeColor Stroke fontColor of the displayed text. Requires a `strokeSize` greater than 0.
 * @param options.strokeSize Stroke size of the displayed text.
 * @param options.anchor Anchor point of the label, to be used by `position`. @see
 *   {@link https://docs.cocos2d-x.org/cocos2d-x/en/basic_concepts/sprites.html|Cocos2d-x Sprites}
 * @param options.zOrder the sprite stacking order in it's parent.
 * @param options.containerWidth the base width of the sprite. Auto if value not set.
 * @param options.containerHeight the base height of the sprite. Auto if value not set.
 * @param options.dimensions the height and width of the sprite. Overrides options.containerWidth and
 *  options.containerHeight if set.
 *  @param options.backgroundColor sets a fontColor of the sprite background
 *  @param options.cleanDom flag for cleaning the dom by removing the generated html elements
 *  @param options.onLoadComplete callback function for when the image have been created
 *  @oaram options.isVisible default visibility
 * @example
 *
 * this.text = new ImageLabel({
 *   text: 'Some paragraph text here.',
 *   fontWeight: 700,
 *   opacity: 100,
 * });
 */
class ImageLabelImpl extends cc.Sprite {
  readonly #zOrder;

  readonly #opacity;

  readonly #fontName;

  readonly #horizontalAlign;

  readonly #verticalAlign;

  readonly #textAlign;

  readonly #fontWeight;

  readonly #fontStyle;

  readonly #lineHeight;

  readonly #wordSpacing;

  readonly #anchor;

  readonly #containerWidth;

  readonly #containerHeight;

  readonly #display;

  readonly #cleanDom;

  #queue = new Queue();

  #rendering = false;

  #onLoadCompleteCallback;

  #text;

  #fontSize;

  #textElement;

  #fontColor;

  #backgroundColor;

  #strokeColor;

  #strokeWidth;

  #position;

  #listener;

  #clickHandler;

  #addShadow;

  #shadowProperty;

  #isVisible;

  // eslint-disable-next-line max-lines-per-function,max-statements
  constructor({
    parent = undefined,
    text = '',
    opacity = 1,
    fontName = primaryFont,
    fontSize = 16,
    fontWeight = '400',
    fontStyle = 'normal' as FontStyle,
    lineHeight = 'normal',
    wordSpacing = 'normal',
    display = 'flex',
    horizontalAlign = 'flex-start' as HorizontalAlignment,
    verticalAlign = 'flex-start' as VerticalAlignment,
    textAlign = 'left',
    position = [250, 250] as Point,
    color = [0, 0, 0] as Color,
    strokeColor = [0, 0, 0],
    strokeWidth = 0,
    anchor = [0.5, 0.5] as Point,
    zOrder = 0,
    containerWidth = 0,
    containerHeight = 0,
    dimensions = undefined as Size,
    backgroundColor = null,
    cleanDom = true,
    onLoadComplete = undefined,
    isVisible = true,
  } = {}) {
    super();

    this.#opacity = opacity;
    this.#fontName = fontName;
    this.#fontSize = fontSize;
    this.#fontWeight = fontWeight;
    this.#fontStyle = fontStyle;
    this.#lineHeight = lineHeight;
    this.#wordSpacing = wordSpacing;
    this.#horizontalAlign = horizontalAlign;
    this.#verticalAlign = verticalAlign;
    this.#textAlign = textAlign;
    this.#position = position;
    this.#fontColor = color;
    this.#strokeColor = strokeColor;
    this.#strokeWidth = strokeWidth;
    this.#anchor = anchor;
    this.#zOrder = zOrder;
    this.#containerWidth = dimensions ? dimensions[0] : containerWidth;
    this.#containerHeight = dimensions ? dimensions[1] : containerHeight;
    this.#display = display;
    this.#backgroundColor = backgroundColor;
    this.#cleanDom = cleanDom;
    this.#onLoadCompleteCallback = onLoadComplete;
    this.#isVisible = isVisible;

    this.setString(text);
    if (parent) parent.addChild(this, this.#zOrder);
  }

  /**
   * Sets the label string
   *
   * @param text the html string used to generate the label image
   *
   * @param onLoadComplete optional callback function on render complete
   */
  setString = (text: string, onLoadComplete = this.#onLoadCompleteCallback): void => {
    this.#onLoadCompleteCallback = onLoadComplete;
    this.#isVisible = true;
    this.#queue.enqueue(text);
    if (!this.#rendering) {
      this.#setStringFromQueue(this.#queue.dequeue());
    }
  };

  /**
   * returns the encoded html used to generate the label image
   */
  getString = (): string => this.#textElement.textContent;

  /**
   * Sets the content size / dimension of the label
   *
   * @param size dimensions or width of dimensions
   * @param height optional height of dimensions
   */
  setDimensions = (size: [number, number] | { width: number; height: number } | number, height: number): void => {
    if (typeof size === 'number') {
      this.setContentSize(size, height);
    } else if (Array.isArray(size)) {
      this.setContentSize(...size);
    } else if (typeof size === 'object') {
      const {
        width,
        height: sHeight,
      } = size;
      this.setContentSize(width, sHeight);
    }
  };

  /**
   * Returns the dimensions of image label.
   */
  getDimensions = (): Record<string, number> => this.getContentSize();

  /**
   * Sets the color of the image label font
   *
   * @param color array of either rgb or rgba
   */
  setFontColor = (color: Color): void => {
    this.#fontColor = color;
    this.setString(this.#text);
  };

  /**
   * Return the label font size
   */
  getFontSize = (): number => this.#fontSize;

  /**
   * Sets the font size of the image label
   *
   * @param fontSize the label text font size
   */
  setFontSize = (fontSize: number): void => {
    this.#fontSize = fontSize;
    this.setString(this.#text);
  };

  /**
   * Sets the background color of the image label
   *
   * @param color array of either rgb or rgba
   */
  setBackgroundColor = (color: Color): void => {
    this.#backgroundColor = color;
    this.setString(this.#text);
  };

  /**
   * Enabled text stroke
   *
   * @param color Stroke fontColor of the displayed text. Requires a `strokeSize` greater than 0.
   * @param size Stroke size of the displayed text.
   */
  enableStroke = (color: Color, size: number): void => {
    this.#strokeColor = color;
    this.#strokeWidth = size;
    this.setString(this.#text);
  };

  /**
   * Disables text stroke
   */
  disableStroke = (): void => {
    this.#strokeColor = [0, 0, 0];
    this.#strokeWidth = 0;
    this.setString(this.#text);
  };

  /**
   * Enable click detection for the image label
   *
   * @param clickHandler callback function for when the label is clicked. Instance of the
   * ImageLabel is pass to the callback as a parameter
   */
  setClickHandler = (clickHandler: (ImageLabelImpl) => void): void => {
    this.#clickHandler = clickHandler;
    this.#addListener();
  };

  /**
   * Toggle click listener if setClickHandler was called
   *
   * @param enable whether or not the click listener is enabled
   */
  setClickEnabled = (enable: boolean): void => {
    if (this.#listener) {
      this.#listener.setEnabled(enable);
    }
  };

  /**
   * Sets the image label (x,y) position in it's parent node
   *
   * @param x the X coordinate for position
   * @param y the Y coordinate for position
   */
  setPosition = (x: number, y: number): void => {
    this.#position = [x, y];
    super.setPosition(x, y);
  };

  /**
   * Sets the image label x position in it's parent node
   *
   * @param x the X coordinate for position
   */
  setPositionX = (x: number): void => {
    this.#position[0] = x;
    super.setPositionX(x);
  };

  /**
   * Sets the image label y position in it's parent node
   *
   * @param y the Y coordinate for position
   */
  setPositionY = (y: number): void => {
    this.#position[1] = y;
    super.setPositionY(y);
  };

  /**
   * Enable and set text shadow for image label
   * @param h The position of the horizontal shadow
   * @param v The position of the vertical shadow
   * @param color array of either rgb or rgba
   * @param b The blur radius. Default value is 0
   */
  enableShadow = (h: number, v: number, color: Color, b = 0): void => {
    this.#addShadow = true;
    const colorType = color.length === 3 ? 'rgb' : 'rgba';
    this.#shadowProperty = `${v}px ${h}px ${b}px ${colorType}(${color.join(', ')})`;
    this.setString(this.#text);
  };

  /**
   * Removes text shadow from image label
   */
  disableShadow = (): void => {
    this.#addShadow = false;
    this.#shadowProperty = undefined;
    this.setString(this.#text);
  };

  #setStringFromQueue = (text: string): void => {
    this.#rendering = true;
    this.#text = text;
    this.#textElement = this.#generateTextSpan(text);

    const width = this.#textElement.clientWidth;
    const height = this.#textElement.clientHeight;

    this.setContentSize(width, height);
    super.setPosition(...this.#position);
    this.setAnchorPoint(...this.#anchor);

    const id = hash(this.#textElement);
    const cacheTexture = cc.textureCache.getTextureForKey(id);

    if (cacheTexture) {
      if (this.#cleanDom) this.#textElement.remove();
      this.#createTextSprite(cacheTexture);
    } else {
      this.#generateSprite(this.#textElement, id);
    }
  };

  // eslint-disable-next-line max-statements
  #generateTextSpan = (text: string): HTMLElement => {
    const textElement = document.createElement('p');

    textElement.innerHTML = text;

    textElement.style.fontSize = `${this.#fontSize}px`;
    textElement.style.fontWeight = String(this.#fontWeight);
    textElement.style.opacity = String(this.#opacity);
    textElement.style.fontStyle = this.#fontStyle;
    textElement.style.fontFamily = this.#fontName;

    textElement.style.color = `rgb(${this.#fontColor.join(', ')})`;
    textElement.style.webkitTextStroke = this.#strokeColor.length === 4
      ? `${this.#strokeWidth}px rgba(${this.#strokeColor.join(', ')})`
      : `${this.#strokeWidth}px rgb(${this.#strokeColor.join(', ')})`;

    textElement.style.width = this.#containerWidth === 0 ? 'max-content' : `${this.#containerWidth}px`;
    textElement.style.height = this.#containerHeight === 0 ? 'auto' : `${this.#containerHeight}px`;

    if (this.#cleanDom) {
      textElement.style.margin = '0 auto';
      textElement.style.position = 'absolute';
      textElement.style.left = '50%';
      textElement.style.top = '50%';
      textElement.style.zIndex = '-999';
    }

    textElement.style.justifyContent = this.#horizontalAlign;
    textElement.style.alignItems = this.#verticalAlign;
    textElement.style.textAlign = this.#textAlign;

    if (this.#addShadow) {
      textElement.style.textShadow = this.#shadowProperty;
    }

    if (text && String(text).trim().length > 0) {
      textElement.style.display = this.#display;
    } else {
      textElement.style.whiteSpace = 'pre';
      textElement.style.display = 'block';
    }

    textElement.style.lineHeight = this.#lineHeight;
    textElement.style.wordSpacing = this.#wordSpacing;

    document.body.append(textElement);
    return textElement;
  };

  #generateSprite = (textElement: HTMLElement, id: number): void => {
    this.#getCanvas(textElement)
      .then((canvas) => {
        if (this.#cleanDom) textElement.remove();
        cc.textureCache.cacheImage(id, canvas);
        this.#createTextSprite(cc.textureCache.getTextureForKey(id));
        return {};
      })
      .catch(() => {});
  };

  #getCanvas = (textElement: HTMLElement): Promise<HTMLCanvasElement> => html2canvas(textElement, {
    backgroundColor: this.#backgroundColor,
    scale: 1,
    logging: false,
  });

  #createTextSprite = (imageTexture: typeof cc.TEXTURE): void => {
    this.setVisible(this.#isVisible);
    this.setTexture(imageTexture);
    this.#rendering = false;
    if (this.#onLoadCompleteCallback) this.#onLoadCompleteCallback(this);
    if (!this.#queue.isEmpty()) {
      this.#setStringFromQueue(this.#queue.dequeue());
    }
  };

  #addListener = (): void => {
    this.#listener = cc.eventManager.addListener({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: false,
      onTouchBegan: () => true,
      onTouchEnded: (event) => {
        if (isPointOnTarget(event, this) && this.#clickHandler) this.#clickHandler(this);
      },
    }, this);
  };
}

export const ImageLabel = CreateCallableConstructor(ImageLabelImpl);

export default ImageLabelImpl;
