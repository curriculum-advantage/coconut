import html2canvas from 'html2canvas';
import { primaryFont } from '../../../lib/constants';
import CreateCallableConstructor from '../../util';

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
 * @param options.color Color of the displayed text.
 * @param options.strokeColor Stroke color of the displayed text. Requires a `strokeSize` greater than 0.
 * @param options.strokeSize Stroke size of the displayed text.
 * @param options.anchor Anchor point of the label, to be used by `position`. @see
 *   {@link https://docs.cocos2d-x.org/cocos2d-x/en/basic_concepts/sprites.html|Cocos2d-x Sprites}
 * @param options.zOrder the sprite stacking order in it's parent.
 * @param options.containerWidth the base width of the sprite. Auto if value not set.
 * @param options.containerHeight the base height of the sprite. Auto if value not set.
 * @param options.dimensions the height and width of the sprite. Overrides options.containerWidth and
 *  options.containerHeight if set.
 *  @param options.backgroundColor sets a color of the sprite background
 *  @param options.cleanDom flag for cleaning the dom by removing the generated html elements
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

  readonly #fontSize;

  readonly #horizontalAlign;

  readonly #verticalAlign;

  readonly #textAlign;

  readonly #fontWeight;

  readonly #fontStyle;

  readonly #lineHeight;

  readonly #wordSpacing;

  readonly #position;

  readonly #strokeColor;

  readonly #strokeWidth;

  readonly #anchor;

  readonly #containerWidth;

  readonly #containerHeight;

  readonly #display;

  readonly #cleanDom;

  #text;

  #id;

  #color;

  #backgroundColor;

  // eslint-disable-next-line max-lines-per-function,max-statements
  constructor({
    parent = null,
    text = '',
    opacity = 1,
    fontName = primaryFont,
    fontSize = 16,
    fontWeight = 400,
    fontStyle = 'normal' as FontStyle,
    lineHeight = 'normal',
    wordSpacing = 'normal',
    display = 'flex',
    horizontalAlign = 'flex-start' as HorizontalAlignment,
    verticalAlign = 'flex-start' as VerticalAlignment,
    textAlign = 'left',
    position = [250, 250] as Point,
    color = [0, 0, 0] as Color,
    strokeColor = [255, 0, 0],
    strokeWidth = 0,
    anchor = [0.5, 0.5] as Point,
    zOrder = 0,
    containerWidth = 0,
    containerHeight = 0,
    dimensions = null as Size,
    backgroundColor = null,
    cleanDom = true,
  } = {}) {
    super();
    this.setVisible(false);

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
    this.#color = color;
    this.#strokeColor = strokeColor;
    this.#strokeWidth = strokeWidth;
    this.#anchor = anchor;
    this.#zOrder = zOrder;
    this.#containerWidth = dimensions ? dimensions[0] : containerWidth;
    this.#containerHeight = dimensions ? dimensions[1] : containerHeight;
    this.#display = display;
    this.#backgroundColor = backgroundColor;
    this.#cleanDom = cleanDom;

    this.setString(text);
    if (parent) parent.addChild(this, this.#zOrder);
  }

  setString = (text): void => {
    this.#text = text;
    const textElement = this.#generateTextSpan(text);

    const width = textElement.clientWidth;
    const height = textElement.clientHeight;

    this.setContentSize(width, height);
    this.setPosition(...this.#position);
    this.setAnchorPoint(...this.#anchor);

    this.#id = textElement.outerHTML;
    const cacheTexture = cc.textureCache.getTextureForKey(this.#id);
    if (cacheTexture) {
      if (this.#cleanDom) textElement.remove();
      this.#createTextSprite(cacheTexture);
    } else {
      this.#generateSprite(textElement);
    }
  };

  getString = (): string => this.#text;

  setDimensions = (size, height) => {
    if (typeof size === 'number') {
      this.setContentSize(size, height);
    } else if (Array.isArray(size)) {
      this.setContentSize(...size);
    } else if (typeof size === 'object') {
      const { width, height: sHeight } = size;
      this.setContentSize(width, sHeight);
    }
  };

  getDimensions = (): object => this.getContentSize();

  setColor = (color: Color): void => {
    this.#color = color;
    this.setString(this.#text);
  };

  setBackgroundColor = (color: Color): void => {
    this.#backgroundColor = color;
    this.setString(this.#text);
  };

  // eslint-disable-next-line max-statements
  #generateTextSpan = (text): Element => {
    const textElement = document.createElement('p');

    textElement.innerHTML = text;

    textElement.style.fontSize = `${this.#fontSize}px`;
    textElement.style.fontWeight = String(this.#fontWeight);
    textElement.style.opacity = String(this.#opacity);
    textElement.style.fontStyle = this.#fontStyle;
    textElement.style.fontFamily = this.#fontName;

    textElement.style.color = `rgb(${this.#color.join(', ')})`;
    textElement.style.webkitTextStroke = this.#strokeColor.length === 4
      ? `${this.#strokeWidth}px rgba(${this.#strokeColor.join(', ')})`
      : `${this.#strokeWidth}px rgb(${this.#strokeColor.join(', ')})`;

    if (this.#containerWidth === 0) textElement.style.width = 'max-content';
    else textElement.style.width = `${this.#containerWidth}px`;
    if (this.#containerHeight === 0) textElement.style.height = 'auto';
    else textElement.style.height = `${this.#containerHeight}px`;

    if (this.#cleanDom) {
      textElement.style.margin = '0 auto';
      textElement.style.position = 'absolute';
      textElement.style.left = '50%';
      textElement.style.top = '50%';
      textElement.style.zIndex = '-999';
    }

    textElement.style.display = this.#display;
    textElement.style.justifyContent = this.#horizontalAlign;
    textElement.style.alignItems = this.#verticalAlign;
    textElement.style.textAlign = this.#textAlign;
    textElement.style.overflow = 'hidden';

    textElement.style.lineHeight = this.#lineHeight;
    textElement.style.wordSpacing = this.#wordSpacing;

    document.body.append(textElement);
    return textElement;
  };

  #generateSprite = (textElement: Element): void => {
    this.#getCanvas(textElement).then((canvas) => {
      if (this.#cleanDom) textElement.remove();
      cc.textureCache.cacheImage(this.#id, canvas);

      this.#createTextSprite(cc.textureCache.getTextureForKey(this.#id));
      return null;
    }).catch(() => null);
  };

  #getCanvas = (textElement): Promise<HTMLCanvasElement> => html2canvas(textElement, {
    backgroundColor: this.#backgroundColor,
    scale: 1,
    logging: false,
  });

  #createTextSprite = (imageTexture): void => {
    this.setTexture(imageTexture);
    this.setVisible(true);
  };
}

export const ImageLabel = CreateCallableConstructor(ImageLabelImpl);

export default ImageLabelImpl;
