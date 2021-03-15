import html2canvas from 'html2canvas';
import { primaryFont } from '../../lib/constants';

const generateTextSpan = ({
  text = '',
  opacity = 255,
  fontName = primaryFont,
  fontSize = 16,
  fontWeight = 400,
  fontStyle = 'normal' as FontStyle,
  color = [0, 0, 0] as Color,
} = {}): Element => {
  const textElement = document.createElement('span');
  textElement.textContent = text;
  textElement.style.fontSize = String(fontSize);
  textElement.style.fontWeight = String(fontWeight);
  textElement.style.opacity = String(opacity);
  textElement.style.fontStyle = fontStyle;
  textElement.style.fontFamily = fontName;
  textElement.style.color = `rgb(${color.join(', ')})`;
  textElement.style.width = 'max-content';
  textElement.style.height = 'auto';
  textElement.style.margin = '0 auto';
  document.body.append(textElement);
  return textElement;
};

const getCanvas = (textElement): html2canvas => html2canvas(textElement, {
  backgroundColor: null,
  scale: 1,
  useCORS: true,
  logging: false,
});

const createTextSprite = (imageTexture, position: [number, number], width, height, parent, anchor, zOrder: number) => {
  const textSprite = new cc.Sprite();
  textSprite.initWithTexture(imageTexture);
  textSprite.setPosition(...position);
  textSprite.setAnchorPoint(...anchor);
  textSprite.setContentSize(width, height);
  parent.addChild(textSprite, zOrder);
  return textSprite;
};

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
 * const text = createLabel(MyGameLayer, {
 *   text: 'Title of Game',
 *   color: [255, 255, 255],
 *   fontSize: 22,
 *   position: [0, 0],
 * });
 *
 * @example
 *
 * this.text = createLabel(this, {
 *   text: 'Some paragraph text here.',
 *   fontWeight: 700,
 *   opacity: 100,
 * });
 */
const createLabel = async ({
  parent = null,
  text = '',
  opacity = 255,
  fontName = primaryFont,
  fontSize = 16,
  horizontalAlign = 'left' as HorizontalAlignment,
  verticalAlign = 'top' as VerticalAlignment,
  fontWeight = 400,
  fontStyle = 'normal' as FontStyle,
  position = [250, 250] as Point,
  color = [0, 0, 0] as Color,
  strokeColor = [255, 0, 0] as Color,
  strokeSize = 0,
  anchor = [0.5, 0.5] as Point,
  zOrder = 0,
} = {}): Promise<any> => {
  const textElement = generateTextSpan({
    text,
    opacity,
    fontName,
    fontSize,
    fontWeight,
    fontStyle,
    color,
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      getCanvas(textElement).then((canvas) => {
        cc.loader.loadImg(canvas.toDataURL(), { isCrossOrigin: false }, (error, textureImage) => {
          const imageTexture = new cc.Texture2D();
          imageTexture.initWithElement(textureImage);
          imageTexture.handleLoadedTexture();
          const width = textElement.clientWidth;
          const height = textElement.clientHeight;
          textElement.remove();
          resolve(createTextSprite(imageTexture, position, width, height, parent, anchor, zOrder));
        });
        return null;
      }).catch(() => null);
    }, 1);
  });
};

export default createLabel;
