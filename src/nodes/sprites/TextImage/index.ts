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
  constructor({
    parent = null,
    text = '',
    opacity = 1,
    fontName = primaryFont,
    fontSize = 16,
    horizontalAlign = 'left' as HorizontalAlignment,
    verticalAlign = 'top' as VerticalAlignment,
    fontWeight = 400,
    fontStyle = 'normal' as FontStyle,
    position = [250, 250] as Point,
    color = [0, 0, 0] as Color,
    strokeColor = [255, 0, 0],
    strokeWidth = 0,
    anchor = [0.5, 0.5] as Point,
    zOrder = 0,
    containerWidth = 0,
    containerHeight = 0,
  } = {}) {
    super();

    // this.setVisible(false);

    const textElement = this.#generateTextSpan({
      text,
      horizontalAlign,
      verticalAlign,
      containerWidth,
      containerHeight,
      strokeColor,
      strokeWidth,
      opacity,
      fontFamily: fontName,
      fontSize,
      fontWeight,
      fontStyle,
      color,
    });

    const width = textElement.clientWidth;
    const height = textElement.clientHeight;

    this.setContentSize(width, height);
    this.setPosition(...position);
    this.setAnchorPoint(...anchor);

    this.#generateSprite(textElement, parent, zOrder);
  }

  #generateTextSpan = ({
    text = '',
    containerWidth = 0,
    containerHeight = 0,
    opacity = 1,
    fontFamily = primaryFont,
    fontSize = 16,
    fontWeight = 400,
    fontStyle = 'normal' as FontStyle,
    horizontalAlign = 'left' as HorizontalAlignment,
    verticalAlign = 'top' as VerticalAlignment,
    color = [0, 0, 0] as Color,
    strokeColor = [255, 255, 255],
    strokeWidth = 0,
  } = {}): Element => {
    const textElement = document.createElement('p');

    textElement.innerHTML = text;

    textElement.style.fontSize = `${fontSize}px`;
    textElement.style.fontWeight = String(fontWeight);
    textElement.style.opacity = String(opacity);
    textElement.style.fontStyle = fontStyle;
    textElement.style.fontFamily = fontFamily;

    textElement.style.color = `rgb(${color.join(', ')})`;
    textElement.style.webkitTextStroke = strokeColor.length === 4
      ? `${strokeWidth}px rgba(${strokeColor.join(', ')})`
      : `${strokeWidth}px rgb(${strokeColor.join(', ')})`;

    if (containerWidth === 0) textElement.style.width = 'max-content';
    else textElement.style.width = `${containerWidth}px`;
    if (containerHeight === 0) textElement.style.height = 'auto';
    else textElement.style.height = `${containerHeight}px`;

    textElement.style.margin = '0 auto';
    textElement.style.display = 'flex';
    textElement.style.justifyContent = horizontalAlign;
    textElement.style.alignItems = verticalAlign;

    document.body.append(textElement);
    return textElement;
  };

  #generateSprite = (textElement: Element,
    parent: typeof cc.Node,
    zOrder: number): void => {
    this.#getCanvas(textElement).then((canvas) => {
      textElement.remove();

      const id = Guid.generate();
      cc.textureCache.cacheImage(id, canvas);

      this.#createTextSprite(cc.textureCache.getTextureForKey(id), parent, zOrder);
      return null;
    }).catch(() => null);
  };

  #getCanvas = (textElement): Promise<HTMLCanvasElement> => html2canvas(textElement, {
    backgroundColor: null,
    scale: 1,
    logging: false,
  });

  #createTextSprite = (imageTexture, parent, zOrder: number): void => {
    this.setTexture(imageTexture);
    parent.addChild(this, zOrder);
    this.setVisible(true);
  };
}

export default TextImage;
