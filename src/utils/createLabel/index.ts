// eslint-disable-next-line max-len:
/*
  * TODO: Waiting on TypeScript ranges feature to accurately type acceptable numbers for color,
  * opacity, anchor, etc.
  *
  * TODO: node/scene/layer/label typings for cc (cocos)
  */

// TODO:
import html2canvas from 'html2canvas';
import { primaryFont } from '../../lib/constants';
import {
  setBaseTextStyles,
  setStrokeTextStyles,
  textAlignment,
} from './helpers';

const generateTextSpan = ({
  text = '',
  opacity = 255,
  fontName = primaryFont,
  fontSize = 16,
  fontWeight = 400,
  fontStyle = 'normal' as FontStyle,
  color = [0, 0, 0] as Color,
  width = 20,
  height = 20,
} = {}) => {
  const textElement = document.createElement('span');
  textElement.textContent = text;
  textElement.style.fontSize = String(fontSize);
  textElement.style.fontWeight = String(fontWeight);
  textElement.style.opacity = String(opacity);
  textElement.style.fontStyle = fontStyle;
  textElement.style.fontFamily = fontName;
  textElement.style.color = `rgb(${color.join(', ')})`;
  textElement.style.width = `${width}px`;
  textElement.style.height = `${height}px`;
  textElement.style.margin = '0 auto';
  document.body.append(textElement);
  return textElement;
};

const getCanvas = (textElement, width, height) => html2canvas(textElement, {
  backgroundColor: '#232453',
  width: width + 10,
  height: height + 2,
});

const createTextSprite = (imageTexture, position: [number, number], width, height, parent, anchor, zOrder: number) => {
  const textSprite = new cc.Sprite();
  textSprite.initWithTexture(imageTexture);
  textSprite.setPosition(...position);
  textSprite.setAnchorPoint(...anchor);
  textSprite.x -= 18;
  textSprite.y -= 3;
  textSprite.setContentSize(width - 6, height - 2);
  textSprite.setScale(0.5, 0.5);
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
 * @param options.dimension Maximum size of the label, forcing new lines when necessary.
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
} = {}) => {
  const label = new cc.LabelTTF(
    text,
    fontName,
    fontSize,
    textAlignment(false, horizontalAlign),
    textAlignment(true, verticalAlign),
  );

  setBaseTextStyles(label, fontWeight, fontStyle, color, opacity);
  setStrokeTextStyles(label, strokeSize, strokeColor);
  // setLabel(label, anchor, position);
  // addLabel(label, parent, zOrder);

  const {
    width,
    height,
  } = label.getContentSize();

  const textElement = generateTextSpan({
    text,
    opacity,
    fontName,
    fontSize,
    fontWeight,
    fontStyle,
    color,
    width,
    height,
  });

  const canvas = await getCanvas(textElement, width, height);
  const textureImage = await cc.loader.loadImg(canvas.toDataURL(), { isCrossOrigin: false }, () => {});

  const imageTexture = new cc.Texture2D();
  imageTexture.initWithElement(textureImage);
  imageTexture.handleLoadedTexture();

  textElement.remove();
  return createTextSprite(imageTexture, position, width, height, parent, anchor, zOrder);
};

export default createLabel;
