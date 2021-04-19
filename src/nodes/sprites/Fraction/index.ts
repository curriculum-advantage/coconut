import ImageLabelImpl, { ImageLabel } from '../ImageLabelImpl';
import createRect from '../../../utils/createRect';
import { containsSuperScript } from '../MultiLabelImpl/helpers/superSubScripts';

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

class Fraction extends cc.Node {
  readonly #whole;

  readonly #numerator;

  readonly #denominator;

  readonly #color;

  readonly #fontSize;

  readonly #cleanDom;

  readonly #fontWeight;

  readonly #fontStyle;

  readonly #onLoadComplete;

  #adjustedFontSize;

  #width = 0;

  #height = 0;

  #wholeNumberOffset = 5;

  constructor({
    whole = '',
    numerator = '',
    denominator = '',
    fontSize = 12,
    fontWeight = '400',
    fontStyle = 'normal' as FontStyle,
    color = [0, 0, 0] as Color,
    cleanDom = true,
    onLoadComplete = null,
  } = {}) {
    super();
    this.#whole = whole;
    this.#numerator = numerator;
    this.#denominator = denominator;
    this.#fontWeight = fontWeight;
    this.#fontStyle = fontStyle;
    this.#color = color;
    this.#fontSize = fontSize;
    this.#adjustedFontSize = fontSize;
    this.#cleanDom = cleanDom;
    this.#onLoadComplete = onLoadComplete;

    // @ts-ignore
    pipe(
      this.#setWholeNumber,
      this.#setNumerator,
      this.#setDenominator,
      this.#repositionX,
      this.#drawFractionBar,
      this.#recalculateSizePositionX,
      this.#repositionY,
    )();
  }

  #updateContentSize = (changeWidthBy: number, changeHeightBy: number): void => {
    this.#width += changeWidthBy;
    this.#height = changeHeightBy;

    this.setContentSize(this.#width, this.#height);
  };

  #addNumberLabel = (text: string, position: Point): ImageLabelImpl => new ImageLabel({
    text,
    position,
    parent: this,
    anchor: [0, 0],
    color: this.#color,
    cleanDom: this.#cleanDom,
    fontStyle: this.#fontStyle,
    fontWeight: this.#fontWeight,
    fontSize: this.#adjustedFontSize,
    onLoadComplete: this.#onLoadComplete,
    verticalAlign: containsSuperScript(text) ? 'flex-end' : 'flex-start',
  });

  #setWholeNumber = (): ImageLabelImpl => this.#addNumberLabel(this.#whole, [0, 0]);

  #setNumerator = (pipeObject: ImageLabelImpl): ImageLabelImpl => {
    const {
      width: pipeObjectWidth,
      height: pipeObjectHeight,
      x,
    } = pipeObject.getBoundingBox();

    const yPosition = pipeObjectHeight / 2;
    const xPosition = x + pipeObjectWidth + this.#wholeNumberOffset;

    if (this.#whole !== '') this.#adjustedFontSize *= 0.85;

    return this.#addNumberLabel(this.#numerator, [xPosition, yPosition]);
  };

  #setDenominator = (pipeObject: ImageLabelImpl): Record<string, ImageLabelImpl> => {
    const {
      x,
      y,
      height: pipeObjectHeight,
    } = pipeObject.getBoundingBox();
    const yPosition = (y - pipeObjectHeight) + (pipeObjectHeight * 0.35) - 8;
    const denominatorLabel = this.#addNumberLabel(this.#denominator, [x, yPosition]);

    return {
      numeratorLabel: pipeObject,
      denominatorLabel,
    };
  };

  #repositionX = (pipeObject: Record<string, ImageLabelImpl>): Record<string, any> => {
    const {
      numeratorLabel,
      denominatorLabel,
    } = pipeObject;
    const numeratorWidth = numeratorLabel.getBoundingBox().width;
    const denominatorWidth = denominatorLabel.getBoundingBox().width;

    let to = numeratorWidth;
    let from = numeratorLabel.x;

    if (denominatorWidth > numeratorWidth) {
      to = denominatorWidth;
      from = denominatorLabel.x;
      const changeInNumeratorXPosition = (denominatorWidth - numeratorWidth) / 2;
      numeratorLabel.setPositionX(numeratorLabel.getBoundingBox().x + changeInNumeratorXPosition);
    } else if (numeratorWidth > denominatorWidth) {
      const changeInDenominatorXPosition = (numeratorWidth - denominatorWidth) / 2;
      denominatorLabel.setPositionX(
        numeratorLabel.getBoundingBox().x + changeInDenominatorXPosition,
      );
    }

    return {
      to,
      from,
      numeratorLabel,
      denominatorLabel,
    };
  };

  #drawFractionBar = ({
    to,
    from,
    numeratorLabel,
    denominatorLabel,
  }: Record<string, any>): Record<string, any> => {
    const {
      y,
      height: pipeObjectHeight,
    } = numeratorLabel.getBoundingBox();
    const yPosition = y + (pipeObjectHeight * 0.35) - 5;
    createRect({
      parent: this,
      position: [from, yPosition - 1],
      size: [to, this.#fontSize / 20],
      color: this.#color,
    });

    return {
      to,
      from,
      numeratorLabel,
      denominatorLabel,
    };
  };

  #recalculateSizePositionX = ({
    to,
    from,
    numeratorLabel,
    denominatorLabel,
  }: Record<string, any>): Record<string, any> => {
    const offsetFrom = this.#whole === '' ? -(this.#wholeNumberOffset + 0.5) : 0;
    const actualWidth = from + to + offsetFrom;
    const { height: numeratorHeight } = numeratorLabel.getBoundingBox();
    const { height: denominatorHeight } = denominatorLabel.getBoundingBox();
    const actualHeight = (denominatorHeight * 0.65) + (numeratorHeight * 0.65) + 4;

    this.#updateContentSize(actualWidth, actualHeight);

    if (offsetFrom !== 0) {
      const changeInX = Math.abs(0 - from);
      this.getChildren()
        .forEach((child) => child.setPositionX(child.getBoundingBox().x - changeInX));
    }
    return {
      actualHeight,
      numeratorLabel,
    };
  };

  #repositionY = (pipeObject: Record<string, any>): void => {
    const {
      y,
      height: pipeObjectHeight,
    } = pipeObject.numeratorLabel.getBoundingBox();
    const changeInY = pipeObject.actualHeight - Math.abs(0 - y - pipeObjectHeight);
    this.getChildren()
      .forEach((child) => child.setPositionY(child.getBoundingBox().y + changeInY));
  };
}

export default Fraction;
