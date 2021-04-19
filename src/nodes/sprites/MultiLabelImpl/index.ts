import { escapeRegExp, findKey, values as ObjectValues } from 'lodash';
import { detect } from 'detect-browser';
import { sub, sup } from './helpers/superSubScripts';
import isPointOnTarget from '../../../utils/isPointOnTarget';
import ImageLabelImpl, { ImageLabel } from '../ImageLabelImpl';
import CreateCallableConstructor from '../../util';
import Fraction from '../Fraction';
import { primaryFont } from '../../../lib/constants';

class MultiLabelImpl extends cc.LayerColor {
  readonly #position;

  readonly #lineOffset;

  readonly #fontSize;

  readonly #fontColorHighlight;

  readonly #fontColorPrimary;

  readonly #fontStyle;

  readonly #fontWeight;

  readonly #fontName;

  readonly #containerWidth;

  readonly #containerHeight;

  readonly #horizontalAlignment;

  readonly #browser;

  readonly #styleSyntaxes;

  readonly #wordOffset;

  readonly #cleanDom;

  readonly #areaClick;

  readonly #defaultFillIn;

  readonly #onLoadCompleteCallback;

  #numberReplacedFillIns = 0;

  #fillIns = [];

  #positionX = 0;

  #currentLine = [];

  #lines = [];

  #labels = [];

  #entities = [];

  #symbols = [];

  #loadingPromises = [];

  #previousWasShift = false;

  #wasClicked = false;

  #offsetForFraction = false;

  #positionY;

  #displayedText;

  #cleanDisplayedText;

  #listener;

  #clickHandler;

  #parent;

  #zOrder;

  // eslint-disable-next-line max-lines-per-function,max-statements
  constructor({
    text = '',
    anchor = [0, 0] as Point,
    areaClick = false,
    clickHandler = (): void => {},
    containerWidth = 250,
    containerHeight = 100,
    defaultFillIn = '_____',
    fontColorHighlight = [21, 15, 242] as Color,
    fontColorPrimary = [0, 0, 0] as Color,
    fontName = primaryFont,
    fontSize = 16,
    fontStyle = 'normal' as FontStyle,
    fontWeight = 400,
    horizontalAlignment = 'left' as MultiLabelHorizontalAlignment,
    lineHeight = 1.2,
    position = [250, 250] as Point,
    wordSpace = 3.5,
    cleanDom = true,
    parent = null,
    zOrder = 0,
    onLoadComplete = undefined,
  } = {}) {
    super(cc.color(255, 255, 255, 0));
    this.setAnchorPoint(...anchor);
    this.setContentSize(containerWidth, containerHeight);
    this.setPosition(...position);

    this.#position = position;
    this.#containerWidth = containerWidth;
    this.#containerHeight = containerHeight;
    this.#cleanDom = cleanDom;
    this.#fontColorHighlight = fontColorHighlight;
    this.#fontColorPrimary = fontColorPrimary;
    this.#fontStyle = fontStyle;
    this.#fontWeight = fontWeight;
    this.#horizontalAlignment = horizontalAlignment;
    this.#areaClick = areaClick;
    this.#clickHandler = clickHandler;
    this.#defaultFillIn = defaultFillIn;

    this.#fontSize = fontSize;
    this.#fontName = fontName;
    this.#lineOffset = fontSize * lineHeight;
    this.#wordOffset = fontSize / wordSpace;
    this.#positionY = containerHeight - this.#lineOffset - 5;

    this.#parent = parent;
    this.#zOrder = zOrder;

    this.#onLoadCompleteCallback = onLoadComplete;

    this.#browser = detect();

    // Current supported markup
    this.#styleSyntaxes = {
      highlightSyntax: '[HIGHLIGHT]',
      blankSyntax: '[BLANK]',
      boldSyntax: '[BOLD]',
      italicSyntax: '[ITALIC]',
      underlineSyntax: '[UNDERLINE]',
      breakSyntax: '[BREAK]',
      concatSyntax: '[CONCAT]',
      fractionSyntax: '[FRACTION]',
      superScriptSyntax: '[CWSUPERSCRIPT]',
      subScriptSyntax: '[CWSUBSCRIPT]',
      shiftDownSyntax: '[SHIFTDOWN]',
      shiftUpSyntax: '[SHIFTUP]',
      segmentSyntax: '[SEGMENT]',
      angSyntax: '[ANGLE]',
      arcSyntax: '[ARC]',
      triangleSyntax: '[TRIANGLE]',
      lineSyntax: '[LINE]',
      sqrtSyntax: '[SQRT]',
      vectorSyntax: '[VECTOR]',
    };

    this.setString(text);
  }

  setString = (text: string): void => {
    this.#displayedText = text;
    const updatedText = this.#notateStyles(text);
    this.#initiateFillIns(this.#displayedText);
    this.#render(updatedText);
    if (this.#clickHandler) this.#addListener();
  };

  getString = (): string => this.#cleanDisplayedText;

  /**
   * Display a white solid background unless otherwise specified
   */
  showBackground = (): void => {
    this.setOpacity(255);
  };

  fillInBlank = (index: number, fillInText: string): void => {
    this.#fillIns[index] = fillInText;
    this.#render();
  };

  resetBlank = (index: number): void => {
    this.#fillIns[index] = this.#defaultFillIn;
    this.#render();
  };

  getLabels = (): Array<typeof cc.Sprite> => this.#labels;

  wasClicked = (): boolean => this.#wasClicked;

  resetClicked = (): void => {
    this.#wasClicked = false;
  };

  setClickHandler = (handler: () => void): void => {
    this.#clickHandler = handler;
    this.#addListener();
  };

  setClickEnabled = (enable: boolean): void => {
    if (this.#listener) {
      this.#listener.setEnabled(enable);
    }
  };

  #updateRangeValues = (unStyledText: string, syntax: string): string => {
    let updateText = unStyledText;
    const endSyntax = syntax.replace('[', '[/');
    const splitString = unStyledText.split(' ');
    let endSyntaxIndex = -1;
    let startingSyntaxIndex = -1;
    const endSyntaxExist = splitString.some((value, index) => {
      if (value.includes(endSyntax)) {
        endSyntaxIndex = index;
        return true;
      }
      return false;
    });

    if (endSyntaxExist) {
      for (let index = endSyntaxIndex; index >= 0; index -= 1) {
        if (splitString[index].includes(syntax)) {
          startingSyntaxIndex = index;
          break;
        }
      }

      splitString[startingSyntaxIndex] = splitString[startingSyntaxIndex].replace(syntax, '');
      splitString[endSyntaxIndex] = splitString[endSyntaxIndex].replace(endSyntax, '');

      updateText = '';

      splitString.forEach((element, index) => {
        if (index >= startingSyntaxIndex && index <= endSyntaxIndex) updateText += syntax;
        updateText += `${element} `;
      });
    }
    return updateText.trim();
  };

  /**
   * Iterate over a the list of supported styling and check a given string to see if its marked
   * for any of the supported styling.
   * @param markText the marked up text to check.
   * @returns object an objected containing all the styling to be applied to the marked up text.
   */
  #getStyling = (markText: string): Record<string, boolean> => {
    const styles = {};
    ObjectValues(this.#styleSyntaxes)
      .forEach((syntax) => {
        if (markText.includes(syntax)) {
          styles[findKey(this.#styleSyntaxes, (o) => o === syntax)] = true;
        }
      });
    return styles;
  };

  /**
   * Iterate over the list of style syntaxes and marked up the specified text with each existing
   * styling
   * @param unmarkText the text to be marked up for styling prior to rendering
   * @returns string the marked up text to be styled prior to rendering
   */
  #notateStyles = (unmarkText: string): string => {
    let updatedText = unmarkText;
    ObjectValues(this.#styleSyntaxes)
      .forEach((syntax) => {
        if (updatedText.includes(syntax)) {
          const endSyntax = syntax.replace('[', '[/');
          while (updatedText.includes(endSyntax)) {
            updatedText = this.#updateRangeValues(updatedText, syntax);
          }
        }
      });
    return updatedText;
  };

  #updateForBlankLines = (syntax: string, cleanedText: string): string => {
    if (syntax === this.#styleSyntaxes.blankSyntax && cleanedText.includes(syntax)) {
      this.#numberReplacedFillIns += 1;
      return cleanedText.replace(
        new RegExp(escapeRegExp(syntax), 'g'),
        this.#fillIns[this.#numberReplacedFillIns],
      );
    }
    return cleanedText;
  };

  #updateForTriangle = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.triangleSyntax && syntax === this.#styleSyntaxes.triangleSyntax) {
      return cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        `<span style="font-size:${this.#fontSize + 3}px;">&#9651;</span>`);
    }
    return cleanedText;
  };

  #updateForAngle = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.angSyntax && syntax === this.#styleSyntaxes.angSyntax) {
      return cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        `<span style="font-size:${this.#fontSize * 1.5}px;">&ang;</span>`);
    }
    return cleanedText;
  };

  #updateForSqrtRoot = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.sqrtSyntax && syntax === this.#styleSyntaxes.sqrtSyntax) {
      return `${cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        `<span style="font-size:${this.#fontSize}px;">&radic;</span>
          <span style='text-decoration:overline;'>`)}</span>`;
    }
    return cleanedText;
  };

  #updateForSegment = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.segmentSyntax && syntax === this.#styleSyntaxes.segmentSyntax) {
      return `${cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        '<span style=\'text-decoration: overline;\'>')}</span>`;
    }
    return cleanedText;
  };

  #updateForUnderline = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.underlineSyntax && syntax === this.#styleSyntaxes.underlineSyntax) {
      return `${cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        '<span style=\'text-decoration: underline;\'>')}</span>`;
    }
    return cleanedText;
  };

  #updateForLine = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.lineSyntax && syntax === this.#styleSyntaxes.lineSyntax) {
      return `${cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        `<span style='display: flex; flex-direction: column'>
          <span style='font-size: ${this.#fontSize + 2}px; display: inline-block;'>&harr;</span>`)}</span>`;
    }
    return cleanedText;
  };

  #updateForVector = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.vectorSyntax && syntax === this.#styleSyntaxes.vectorSyntax) {
      return `${cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        `<span style='display: flex; flex-direction: column'>
          <span style='font-size: ${this.#fontSize + 2}px; display: inline-block;'>&rarr;</span>`)}</span>`;
    }
    return cleanedText;
  };

  #updateForArc = (syntax: string, cleanedText: string): string => {
    if (this.#styleSyntaxes.arcSyntax && syntax === this.#styleSyntaxes.arcSyntax) {
      return `${cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'),
        `<span style='display: flex; flex-direction: column'>
          <span style='font-size: ${this.#fontSize + 2}px; display: flex; 
          transform: scaleX(1.5); justify-content: center;'>&profline;</span>`)}</span>`;
    }
    return cleanedText;
  };

  /**
   * Remove all the markup from the specified string
   * @param markText the string with all the marking for the supported styling.
   * @returns string the string without the styling markup
   */
  #cleanText = (markText: string): string => {
    let cleanedText = markText;
    ObjectValues(this.#styleSyntaxes).forEach((syntax) => {
      cleanedText = this.#updateForBlankLines(syntax, cleanedText);
      cleanedText = this.#updateForTriangle(syntax, cleanedText);
      cleanedText = this.#updateForAngle(syntax, cleanedText);
      cleanedText = this.#updateForSqrtRoot(syntax, cleanedText);
      cleanedText = this.#updateForSegment(syntax, cleanedText);
      cleanedText = this.#updateForUnderline(syntax, cleanedText);
      cleanedText = this.#updateForLine(syntax, cleanedText);
      cleanedText = this.#updateForVector(syntax, cleanedText);
      cleanedText = this.#updateForArc(syntax, cleanedText);
      cleanedText = cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'), '');
    });
    return cleanedText;
  };

  #breakLine = (): void => {
    this.#positionX = 0;
    if (this.#offsetForFraction) {
      this.#currentLine.forEach((label) => label.setPositionY(label.getPositionY() - (this.#lineOffset / 2)));
    }
    this.#positionY -= (this.#lineOffset + (this.#offsetForFraction ? this.#lineOffset : 0));
    this.#lines.push(this.#currentLine.slice());
    this.#currentLine = [];
    this.#offsetForFraction = false;
  };

  #concat = (label: ImageLabelImpl, changeY = true): void => {
    const previousLabel = this.#currentLine.length > 0
      ? this.#currentLine[this.#currentLine.length - 1]
      : this.#labels[this.#labels.length - 1];
    const previousBoundingBox = previousLabel.getBoundingBox();
    if (!this.#previousWasShift && this.#positionY !== previousBoundingBox.y) {
      previousLabel.setPosition(this.#positionX, this.#positionY);
      this.#currentLine.push(previousLabel);
      this.#lines = this.#lines.map((line, index) => {
        if (index === this.#lines.length - 1) {
          return line.filter((_lineLabel, labelIndex) => labelIndex !== line.length - 1);
        }
        return line;
      });
    } else if (previousBoundingBox.x > this.#positionX) {
      previousLabel.setPosition(this.#positionX, this.#positionY);
      this.#positionX += previousBoundingBox.width;
    }

    this.#positionX = previousLabel.getBoundingBox().x + previousBoundingBox.width;
    label.setPositionX(this.#positionX);
    if (changeY) label.setPositionY(this.#positionY);
  };

  #shouldBreakLine = (width: number, hasLinebreak: boolean): boolean => this.#positionX + width > this.#containerWidth
    || hasLinebreak;

  #checkWidth = (width: number, hasLinebreak: boolean): void => {
    if (this.#shouldBreakLine(width, hasLinebreak)) this.#breakLine();
  };

  #offsetForScript = (label: ImageLabelImpl, hasSubscript: boolean, hasSuperScript: boolean): boolean => {
    const shouldUpdateFontSize = hasSubscript || hasSuperScript;
    if (shouldUpdateFontSize) {
      label.setFontSize(this.#fontSize * 0.6);
      const labelYPosition = label.getPositionY();
      const labelYPositionOffset = hasSubscript
        ? label.getBoundingBox().height * 0.05
        : label.getBoundingBox().height * 0.5;
      label.setPositionY(labelYPosition + labelYPositionOffset);
      this.#concat(label, false);
    }

    return shouldUpdateFontSize;
  };

  /**
   * Shift the specified up or down by 1/3 the line height
   * @param label the label being offset
   * @param shouldShiftUp flag for whether the label should be shifted up
   * @param shouldShiftDown flag for whether the label should be shifed down
   */
  #shift = (label: ImageLabelImpl, shouldShiftUp: boolean, shouldShiftDown: boolean): void => {
    this.#previousWasShift = false;
    if (shouldShiftUp || shouldShiftDown) {
      const shiftDirection = shouldShiftUp ? 1 : -1;
      const shiftBy = (this.#lineOffset / 3) * shiftDirection;
      label.setPositionY(label.getPositionY() + shiftBy);
      this.#previousWasShift = true;
    }
  };

  #shouldOffsetBold = (bold: boolean): boolean => bold && this.#browser
    && (this.#browser.name === 'ie' || this.#browser.name === 'edge');

  /**
   * Position a specific label by default starting at the top left corner in sequence lines and
   * rows in order to fix the specified node dimensions.
   * @param label the label to be position
   * @param styling object containing the label styling.
   */
  #setDefaultPosition = (label: ImageLabelImpl, styling: Record<string, boolean>): void => {
    const { width } = label;
    const {
      breakSyntax,
      shouldShiftDown,
      boldSyntax,
      superScriptSyntax,
      concatSyntax,
      subScriptSyntax,
      shiftUpSyntax,
    } = styling;
    this.#checkWidth(width, breakSyntax);
    if (concatSyntax) {
      this.#concat(label);
    } else {
      if (this.#shouldOffsetBold(boldSyntax)) {
        label.setDimensions(
          label.getBoundingBox().width,
          label.getBoundingBox().height + (this.#fontSize * 0.24),
        );
      }
      label.setPosition(this.#positionX, this.#positionY);
    }
    this.#offsetForScript(label, subScriptSyntax, superScriptSyntax);
    this.#shift(label, shiftUpSyntax, shouldShiftDown);
    this.#currentLine.push(label);
    this.#positionX += width + this.#wordOffset;
  };

  #formatSuperSubScript = (text: string): string => {
    let updatedText = text;
    if (updatedText.includes('[SUBSCRIPT]') || updatedText.includes('[SUPERSCRIPT]')) {
      const syntax = updatedText.includes('[SUBSCRIPT]') ? '[SUBSCRIPT]' : '[SUPERSCRIPT]';
      const func = updatedText.includes('[SUBSCRIPT]') ? sub : sup;
      const splitString = updatedText.split(syntax);
      const updatedTextMap = splitString.map((value) => {
        if (value.includes('[') && value.includes(']')) {
          const previous = value.split('[');
          const exponent = previous[1].split(']');
          return `${previous[0]}${func(exponent[0])}${exponent[1]}`;
        }
        return value;
      });
      updatedText = updatedTextMap.join('');
    }
    return updatedText;
  };

  #createTextLabel = (labelText: string,
    labelWeight: string,
    labelStyle: FontStyle,
    color: Color,
    onLoadComplete: (value: unknown) => void): typeof cc.Sprite => new ImageLabel({
    color,
    onLoadComplete,
    parent: this,
    text: labelText,
    anchor: [0, 0],
    position: [0, 0],
    fontStyle: labelStyle,
    fontWeight: labelWeight,
    fontSize: this.#fontSize,
    fontName: this.#fontName,
    cleanDom: this.#cleanDom,
    verticalAlign: 'baseline',
  });

  /**
   * Convert Fraction labeled text into fraction
   * '_' is used as space marker
   * @param text the Fraction text
   * @param styleFontWeight the label font weight
   * @param styleFontStyle the label font style
   * @param color the color of the fraction
   * @param resolve async callback method
   * @returns {Fraction}
   */
  #getFractionLabel = (text: string,
    styleFontWeight: string,
    styleFontStyle: FontStyle,
    color: Color,
    resolve: (value: unknown) => void): Fraction => {
    let fraction;
    let fText = text.replace(new RegExp('_', 'g'), ' ')
      .split('|');
    fText = fText.map((value) => this.#formatSuperSubScript(value));
    fraction = fText.length === 3 ? {
      whole: fText[0],
      numerator: fText[1],
      denominator: fText[2],
    } : {
      numerator: fText[0],
      denominator: fText[1],
    };
    fraction = {
      ...fraction,
      color,
      fontWeight: styleFontWeight,
      fontStyle: styleFontStyle,
      fontSize: this.#fontSize,
      cleanDom: this.#cleanDom,
      onLoadComplete: resolve,
    };

    const fractionLabel = new Fraction(fraction);
    this.addChild(fractionLabel);
    this.#offsetForFraction = true;
    return fractionLabel;
  };

  #createStyledLabel = (styling: Record<string, boolean>,
    text: string,
    resolve: (value: unknown) => void): ImageLabelImpl => {
    const styleFontWeight = styling.boldSyntax ? 900 : this.#fontWeight;
    const styleFontStyle = styling.italicSyntax ? 'italic' : this.#fontStyle;
    const color = styling.highlightSyntax ? this.#fontColorHighlight : this.#fontColorPrimary;
    let labelText = this.#formatSuperSubScript(text);
    labelText = styling.blankSyntax ? labelText : labelText.replace(/_/g, '&nbsp;');
    const textLabel = styling.fractionSyntax
      ? this.#getFractionLabel(labelText, styleFontWeight, styleFontStyle, color, resolve)
      : this.#createTextLabel(labelText, styleFontWeight, styleFontStyle, color, resolve);

    if (textLabel.setDimensions) {
      const {
        width,
        height,
      } = textLabel.getContentSize();
      textLabel.setDimensions(width, height + 2);
    }
    return textLabel;
  };

  #createAndAddLabel = (text: string, resolve: (value: unknown) => void): void => {
    const styling = this.#getStyling(text);
    this.#cleanDisplayedText = this.#cleanText(text);

    const textLabel = this.#createStyledLabel(styling, this.#cleanDisplayedText, resolve);

    this.#setDefaultPosition(textLabel, styling);
    this.#labels.push(textLabel);
  };

  #setHorizontalPosition = (): void => {
    this.#lines.forEach((line) => {
      const lastWordInLine = line[line.length - 1];
      const {
        width,
        x,
      } = lastWordInLine.getBoundingBox();
      const offset = (this.#containerWidth - (x + width)) / (this.#horizontalAlignment === 'center' ? 2 : 1);

      line.forEach((word) => {
        word.setPositionX(word.getPositionX() + offset);
      });
    });
  };

  #reposition = (): void => {
    const actualHeight = this.#containerHeight + (-1 * this.#positionY);
    this.setContentSize(this.#containerWidth, actualHeight);
    const changeInHeight = (actualHeight - this.#containerHeight);
    this.#positionY = actualHeight - this.#lineOffset - 5;
    this.#lines.forEach((line) => {
      line.forEach((label) => {
        label.setPositionY(label.getBoundingBox().y + changeInHeight);
      });
      this.#positionY -= this.#lineOffset;
    });

    this.setPositionY(this.#position[1] - changeInHeight);
  };

  #addListener = (): void => {
    this.#listener = cc.eventManager.addListener({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: false,
      onTouchBegan: () => true,
      onTouchEnded: (event) => {
        if (this.#areaClick && isPointOnTarget(event, this)) {
          this.#wasClicked = true;
          this.#clickHandler(this.#labels, this);
        } else {
          this.#labels.some((label, index) => {
            if (isPointOnTarget(event, label)) {
              this.#clickHandler(label, index, this);
              return true;
            }
            return false;
          });
        }
      },
    }, this);
  };

  // create default blank underscore strings for every fill-in-blank formatting syntax found
  #initiateFillIns = (text: string): void => {
    const regExp = new RegExp(escapeRegExp(this.#styleSyntaxes.blankSyntax), 'g');
    const fillInCount = (text.match(regExp) || []).length;
    this.#fillIns = new Array(fillInCount).fill(this.#defaultFillIn);
  };

  #reset = (): void => {
    this.#positionX = 0;
    this.#numberReplacedFillIns = 0;
    this.#positionY = this.#containerHeight - this.#lineOffset - 5;
    this.#previousWasShift = false;
    this.#offsetForFraction = false;
    this.#labels.forEach((label) => label.removeFromParent());
    this.#symbols.forEach((symbol) => symbol.removeFromParent());
    this.#entities.forEach((entity) => entity.removeFromParent());

    this.#currentLine = [];
    this.#lines = [];
    this.#labels = [];
    this.#symbols = [];
    this.#entities = [];
  };

  #render = (text = this.#displayedText): void => {
    this.#reset();
    text.split(' ').forEach((string) => {
      const generateImageLabel = new Promise((resolve) => {
        this.#createAndAddLabel(string, resolve);
      });
      this.#loadingPromises.push(generateImageLabel);
    });
    Promise.all(this.#loadingPromises).then((result) => {
      result.forEach(() => {
        if (this.#parent) this.#parent.addChild(this, this.#zOrder);
      });
      if (this.#onLoadCompleteCallback) this.#onLoadCompleteCallback(this);
      return undefined;
    }).catch(null);
    this.#lines.push(this.#currentLine.slice());
    this.#currentLine = [];
    if (this.#horizontalAlignment !== 'left') this.#setHorizontalPosition();
    this.#reposition();
  };
}

export const MultiLabel = CreateCallableConstructor(MultiLabelImpl);

export default MultiLabelImpl;
