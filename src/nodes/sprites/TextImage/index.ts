import html2canvas from 'html2canvas';
import { primaryFont } from '../../../lib/constants';
import Guid from '../../../utils/guid/guid';

/**
 * Creates a Cocos label
 *
 * @param parent Parent node (scene/layer/sprite) that the label should be added to.
 * @param options Options object.
 * @param options.text Text that the label will display.
 * @param options.opacity Opacity of the displayed text.
 * @param options.fontName Font of the displayed text.
 * @param options.fontSize Font size of the displayed text.
 * @param options.horizontalAlign Horizontal alignment of the displayed text.
 * @param options.verticalAlign Vertical alignment of the displayed text.
 * @param options.fontWeight Font weight of the displayed text.
 * @param options.fontStyle Font style of the displayed text.
 * @param options.position Position (relative to `parent`) that the label `anchor` is placed at.
 * @param options.color Color of the displayed text.
 * @param options.strokeColor Stroke color of the displayed text. Requires a `strokeSize` greater
 * * @param options.display the base dom display behavior
 * than 0.
 * @param options.strokeSize Stroke size of the displayed text.
 * @param options.anchor Anchor point of the label, to be used by `position`. @see
 *   {@link https://docs.cocos2d-x.org/cocos2d-x/en/basic_concepts/sprites.html|Cocos2d-x Sprites}
 *
 * @example
 *
 * const text = new TextImage(MyGameLayer, {
 *   text: 'Title of Game',
 *   color: [255, 255, 255],
 *   fontSize: 22,
 *   position: [0, 0],
 * });
 *
 * @example
 *
 * this.text = new TextImage(this, {
 *   text: 'Some paragraph text here.',
 *   fontWeight: 700,
 *   opacity: 100,
 * });
 */
class TextImage extends cc.Sprite {
  readonly #zOrder;

  readonly #parent;

  readonly #opacity;

  readonly #fontName;

  readonly #fontSize;

  readonly #horizontalAlign;

  readonly #verticalAlign;

  readonly #fontWeight;

  readonly #fontStyle;

  readonly #position;

  readonly #color;

  readonly #strokeColor;

  readonly #strokeWidth;

  readonly #anchor;

  readonly #containerWidth;

  readonly #containerHeight;

  readonly #display;

  constructor({
    parent = null,
    text = '',
    opacity = 1,
    fontName = primaryFont,
    fontSize = 16,
    fontWeight = 400,
    fontStyle = 'normal' as FontStyle,
    horizontalAlign = 'left' as HorizontalAlignment,
    verticalAlign = 'top' as VerticalAlignment,
    position = [250, 250] as Point,
    color = [0, 0, 0] as Color,
    strokeColor = [255, 0, 0],
    strokeWidth = 0,
    anchor = [0.5, 0.5] as Point,
    zOrder = 0,
    containerWidth = 0,
    containerHeight = 0,
    display = 'flex',
  } = {}) {
    super();
    this.setVisible(false);

    this.#parent = parent;
    this.#opacity = opacity;
    this.#fontName = fontName;
    this.#fontSize = fontSize;
    this.#fontWeight = fontWeight;
    this.#fontStyle = fontStyle;
    this.#horizontalAlign = horizontalAlign;
    this.#verticalAlign = verticalAlign;
    this.#position = position;
    this.#color = color;
    this.#strokeColor = strokeColor;
    this.#strokeWidth = strokeWidth;
    this.#anchor = anchor;
    this.#zOrder = zOrder;
    this.#containerWidth = containerWidth;
    this.#containerHeight = containerHeight;
    this.#display = display;
    this.setString(text);
    this.#parent.addChild(this, this.#zOrder);
  }

  setString = (text): void => {
    const textElement = this.#generateTextSpan(text);

    const width = textElement.clientWidth;
    const height = textElement.clientHeight;

    this.setContentSize(width, height);
    this.setPosition(...this.#position);
    this.setAnchorPoint(...this.#anchor);

    this.#generateSprite(textElement);
  };

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

    textElement.style.margin = '0 auto';
    textElement.style.display = this.#display;
    textElement.style.justifyContent = this.#horizontalAlign;
    textElement.style.alignItems = this.#verticalAlign;

    document.body.append(textElement);
    return textElement;
  };

  #generateSprite = (textElement: Element): void => {
    this.#getCanvas(textElement).then((canvas) => {
      textElement.remove();

      const id = Guid.generate();
      cc.textureCache.cacheImage(id, canvas);

      this.#createTextSprite(cc.textureCache.getTextureForKey(id));
      return null;
    }).catch(() => null);
  };

  #getCanvas = (textElement): Promise<HTMLCanvasElement> => html2canvas(textElement, {
    backgroundColor: null,
    scale: 1,
    logging: false,
  });

  #createTextSprite = (imageTexture): void => {
    this.setTexture(imageTexture);
    this.setVisible(true);
  };
}

export default TextImage;
