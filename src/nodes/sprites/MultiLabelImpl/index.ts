// TODO: This file needs heavy cleanup for lint and type errors. Remove all @ts-ignore in file.

import {
  escapeRegExp,
  findKey,
  values as ObjectValues,
} from 'lodash';
import { detect } from 'detect-browser';
import {
  sub,
  sup,
} from './helpers/superSubScripts';
import createRect from '../../../utils/createRect';
import isPointOnTarget from '../../../utils/isPointOnTarget';
import ImageLabelImpl, { ImageLabel } from '../ImageLabelImpl';
import CreateCallableConstructor from '../../util';

class MultiLabelImpl extends cc.LayerColor {
  readonly #position;

  readonly #lineOffset;

  readonly #fontSize;

  readonly #fontColorHighlight;

  readonly #fontColorPrimary;

  readonly #fontStyle;

  readonly #fontWeight;

  readonly #containerWidth;

  readonly #containerHeight;

  readonly #horizontalAlignment;

  readonly #browser;

  readonly #styleSyntaxes;

  readonly #wordOffset;

  readonly #cleanDom;

  readonly #hasOtherSyntaxes;

  readonly #otherSyntaxes;

  readonly #areaClick;

  readonly #clickHandler;

  readonly #defaultFillIn;

  readonly #objectParameters;

  #numberReplacedFillIns = 0;

  #fillIns = [];

  #positionX = 0;

  #currentLine = [];

  #lines = [];

  #labels = [];

  #entities = [];

  #symbols = [];

  #drawingSyntaxes = [];

  #previousWasShift = false;

  #wasClicked = false;

  #positionY;

  #displayedText;

  // eslint-disable-next-line max-lines-per-function,max-statements
  constructor({
    anchor = [0, 0],
    areaClick = false,
    clickHandler = (): void => {},
    containerWidth = 250,
    containerHeight = 100,
    defaultFillIn = '_____',
    fontColorHighlight = [21, 15, 242],
    fontColorPrimary = [0, 0, 0],
    fontSize = 16,
    fontStyle = 'normal', // normal or italic
    fontWeight = 400,
    horizontalAlignment = 'left',
    lineHeight = 1.2,
    position = [250, 250],
    wordSpace = 3.5,
    cleanDom = true,
  } = {},
  objectParameters: { styleSyntaxes?: object; drawSymbol?: Function; reset?: Function } = {}) {
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
    this.#objectParameters = objectParameters;

    this.#fontSize = fontSize;
    this.#lineOffset = fontSize * lineHeight;
    this.#wordOffset = fontSize / wordSpace;
    this.#positionY = containerHeight - this.#lineOffset - 5;


    this.#hasOtherSyntaxes = Object.keys(objectParameters).length > 0;
    this.#otherSyntaxes = this.#hasOtherSyntaxes && objectParameters.styleSyntaxes
      ? objectParameters.styleSyntaxes
      : {};

    this.#browser = detect();

    // Current supported markup
    this.#styleSyntaxes = {
      ...this.#otherSyntaxes,
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
    };
  }

  setString = (text): void => {
    this.#displayedText = text;
    const updatedText = this.#notateStyles(text);
    this.#initiateFillIns(this.#displayedText);
    this.#render(updatedText);
    this.#addListener();
  };

  /**
   * Display a white solid background unless otherwise specified
   */
  showBackground = (): void => {
    this.setOpacity(255);
  };

  fillInBlank = (index, fillInText): void => {
    this.#fillIns[index] = fillInText;
    this.#render();
  };

  resetBlank = (index): void => {
    this.#fillIns[index] = this.#defaultFillIn;
    this.#render();
  };

  getLabels = (): Array<typeof cc.Sprite> => this.#labels;

  wasClicked = (): boolean => this.#wasClicked;

  resetClicked = (): void => {
    this.#wasClicked = false;
  };

  #updateRangeValues = (unStyledText, syntax): string => {
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

      for (const [index, element] of splitString.entries()) {
        if (index >= startingSyntaxIndex && index <= endSyntaxIndex) updateText += syntax;
        updateText += `${element} `;
      }
    }
    return updateText.trim();
  };

  /**
   * Iterate over a the list of supported styling and check a given string to see if its marked
   * for any of the supported styling.
   * @param {string} markText the marked up text to check.
   * @returns {object} an objected containing all the styling to be applied to the marked up text.
   */
  #getStyling = (markText): object => {
    const styles = {};
    ObjectValues(this.#styleSyntaxes).forEach((syntax) => {
      if (markText.includes(syntax)) {
        styles[findKey(this.#styleSyntaxes, (o) => o === syntax)] = true;
      }
    });
    return styles;
  };

  /**
   * Iterate over the list of style syntaxes and marked up the specified text with each existing
   * styling
   * @param {string} unmarkText the text to be marked up for styling prior to rendering
   * @returns {string} the marked up text to be styled prior to rendering
   */
  #notateStyles = (unmarkText): string => {
    let updatedText = unmarkText;
    ObjectValues(this.#styleSyntaxes).forEach((syntax) => {
      if (updatedText.includes(syntax)) {
        const endSyntax = syntax.replace('[', '[/');
        while (updatedText.includes(endSyntax)) {
          updatedText = this.#updateRangeValues(updatedText, syntax);
        }
      }
    });
    return updatedText;
  };

  /**
   * Remove all the markup from the specified string
   * @param markText the string with all the marking for the supported styling.
   * @returns {string} the string without the styling markup
   */
  #cleanText = (markText): string => {
    let cleanedText = markText;
    ObjectValues(this.#styleSyntaxes).forEach((syntax) => {
      if (syntax === '[BLANK]' && cleanedText.includes(syntax)) {
        cleanedText = cleanedText.replace(
          new RegExp(escapeRegExp(syntax), 'g'),
          this.#fillIns[this.#numberReplacedFillIns],
        );
        this.#numberReplacedFillIns += 1;
      } else if (syntax.includes('ANGLE')) {
        cleanedText = cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'), '    ');
      } else if (syntax.includes('SQRT')) {
        cleanedText = cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'), '  ');
      } else cleanedText = cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'), '');
    });
    return cleanedText;
  };

  #breakLine = (): void => {
    this.#positionX = 0;
    this.#positionY -= this.#lineOffset;
    this.#lines.push(this.#currentLine.slice());
    this.#currentLine = [];
  };

  #concat = (label, changeY = true): void => {
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

  #shouldBreakLine = (width, hasLinebreak): boolean => this.#positionX + width > this.#containerWidth
    || hasLinebreak;

  #checkWidth = (width, hasLinebreak): void => {
    if (this.#shouldBreakLine(width, hasLinebreak)) this.#breakLine();
  };

  #offsetForScript = (label, hasSubscript, hasSuperScript): boolean => {
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
  #shift = (label, shouldShiftUp, shouldShiftDown): void => {
    this.#previousWasShift = false;
    if (shouldShiftUp || shouldShiftDown) {
      const shiftDirection = shouldShiftUp ? 1 : -1;
      const shiftBy = (this.#lineOffset / 3) * shiftDirection;
      label.setPositionY(label.getPositionY() + shiftBy);
      this.#previousWasShift = true;
    }
  };

  #shouldOffsetBold = (bold): boolean => bold && this.#browser
    && (this.#browser.name === 'ie' || this.#browser.name === 'edge');

  /**
   * Position a specific label by default starting at the top left corner in sequence lines and
   * rows in order to fix the specified node dimensions.
   * @param {cc.LabelTTF} label the label to be position
   * @param {object} styling object containing the label styling.
   */
  #setDefaultPosition = (label, styling): void => {
    const { width } = label;
    this.#checkWidth(width, styling.breakSyntax);
    if (styling.concatSyntax) this.#concat(label);
    else {
      if (this.#shouldOffsetBold(styling.boldSyntax)) {
        label.setDimensions(
          label.getBoundingBox().width,
          label.getBoundingBox().height + (this.#fontSize * 0.24),
        );
      }
      label.setPosition(this.#positionX, this.#positionY);
    }
    this.#offsetForScript(label, styling.subScriptSyntax, styling.superScriptSyntax);
    this.#shift(label, styling.shiftUpSyntax, styling.shouldShiftDown);
    this.#currentLine.push(label);
    this.#positionX += width + this.#wordOffset;
  };

  #formatSuperSubScript = (text): string => {
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

  #createTextLabel = (labelText, labelWeight, labelStyle, color, display = 'flex'): typeof cc.Sprite => new ImageLabel({
    parent: this,
    text: labelText,
    fontSize: this.#fontSize,
    display,
    fontWeight: labelWeight,
    fontStyle: labelStyle,
    anchor: [0, 0],
    position: [0, 0],
    color,
    cleanDom: this.#cleanDom,
  });

  /**
   * Convert Fraction labeled text into fraction
   * '_' is used as space marker
   * @param text the Fraction text
   * @param styleFontWeight the label font weight
   * @param styleFontStyle the label font style
   * @param color the color of the fraction
   * @returns {ImageLabel}
   */
  #getFractionLabel = (text, styleFontWeight, styleFontStyle, color): typeof cc.Node => {
    let fraction;
    let fText = text.replace(new RegExp('_', 'g'), ' ').split('|');
    fText = fText.map((value) => this.#formatSuperSubScript(value));
    if (fText.length === 3) {
      fraction = `${fText[0]}<sup>${fText[1]}</sup>&frasl;<sub>${fText[2]}</sub>`;
    } else fraction = `<sup>${fText[0]}</sup>&frasl;<sub>${fText[1]}</sub>`;

    return this.#createTextLabel(fraction, styleFontWeight, styleFontStyle, color, 'block');
  };

  #getOtherDrawSyntaxes = (styling = {}): object => {
    const additionalSyntaxes = {};
    Object.getOwnPropertyNames(this.#otherSyntaxes).forEach((syntax) => {
      additionalSyntaxes[syntax.replace('Syntax', '')] = styling[syntax];
    });

    return additionalSyntaxes;
  };

  #checkForChildLevelSyntax = (drawObject, styling): void => {
    if (this.#hasOtherSyntaxes) Object.assign(drawObject, this.#getOtherDrawSyntaxes(styling));
  };

  #createStyledLabel = (styling, text): { styleFontStyle; color; textLabel } => {
    const styleFontWeight = styling.boldSyntax ? 900 : this.#fontWeight;
    const styleFontStyle = styling.italicSyntax ? 'italic' : this.#fontStyle;
    const color = styling.highlightSyntax ? this.#fontColorHighlight : this.#fontColorPrimary;
    let labelText = this.#formatSuperSubScript(text);
    labelText = styling.blankSyntax ? labelText : labelText.replace(/_/g, ' ');
    const textLabel = styling.fractionSyntax
      ? this.#getFractionLabel(labelText, styleFontWeight, styleFontStyle, color)
      : this.#createTextLabel(labelText, styleFontWeight, styleFontStyle, color);

    if (textLabel.setDimensions) {
      const { width, height } = textLabel.getContentSize();
      textLabel.setDimensions(width, height + 2);
    }
    return { styleFontStyle, color, textLabel };
  };

  #createAndAddLabel = (text): void => {
    const styling = this.#getStyling(text);
    const updatedText = this.#cleanText(text);


    const { styleFontStyle, color, textLabel } = this.#createStyledLabel(styling, updatedText);

    const drawObject = {
      // @ts-ignore
      underline: styling.underlineSyntax,
      color,
      styleFontStyle,
    };
    this.#checkForChildLevelSyntax(drawObject, styling);
    this.#drawingSyntaxes.push(drawObject);

    this.#setDefaultPosition(textLabel, styling);
    this.#labels.push(textLabel);
  };

  #setHorizontalPosition = (): void => {
    this.#lines.forEach((line) => {
      const lastWordInLine = line[line.length - 1];
      const { width, x } = lastWordInLine.getBoundingBox();
      const offset = (this.#containerWidth - (x + width)) / (this.#horizontalAlignment === 'center' ? 2 : 1);

      line.forEach((word) => {
        word.setPositionX(word.getPositionX() + offset);
      });
    });
  };

  /**
   * Draw a line under the at a specified location
   *
   * @param {object} the bounding box of the label being used as the anchor point.
   *
   * @param {array} color the color of the text decoration.
   */
  #underlineLabel = ({ x, y, width }, color): void => {
    let yOffset = 3;
    if (this.#browser.name === 'ie' || this.#browser.name === 'edge') yOffset = 0;
    const underline = createRect({
      parent: this,
      position: [x - 2, y + yOffset],
      size: [width + 3, this.#fontSize * 0.05],
      color: [...color, 255],
    });
    underline.setAnchorPoint(0, 0);
    this.#entities.push(underline);
  };

  /**
   * Called after the adjusting the labels positioning. Draw the marked syntaxes in the proper
   * locations.
   */
  #addAndPositionDrawingMarkup = (): void => {
    this.#drawingSyntaxes.forEach((drawingSyntax, index) => {
      if (drawingSyntax.underline) {
        this.#underlineLabel(this.#labels[index].getBoundingBox(), drawingSyntax.color);
      }
      if (this.#hasOtherSyntaxes) {
        this.#objectParameters.drawSymbol(
          drawingSyntax,
          this.#labels[index].getBoundingBox(),
          drawingSyntax.color,
        );
      }
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
    cc.eventManager.addListener({
      event: cc.EventListener.TOUCH_ONE_BY_ONE,
      swallowTouches: false,
      onTouchBegan: () => true,
      onTouchEnded: (event) => {
        if (this.#areaClick && isPointOnTarget(event, this)) {
          this.#wasClicked = true;
          // @ts-ignore
          this.#clickHandler(this.#labels);
        } else {
          this.#labels.some((label, index) => {
            if (isPointOnTarget(event, label)) {
              // @ts-ignore
              this.#clickHandler(label, index);
              return true;
            }
            return false;
          });
        }
      },
    }, this);
  };

  // create default blank underscore strings for every fill-in-blank formatting syntax found
  #initiateFillIns = (text): void => {
    const regExp = new RegExp(escapeRegExp(this.#styleSyntaxes.blankSyntax), 'g');
    const fillInCount = (text.match(regExp) || []).length;
    this.#fillIns = new Array(fillInCount).fill(this.#defaultFillIn);
  };

  #reset = (): void => {
    this.#positionX = 0;
    this.#numberReplacedFillIns = 0;
    this.#positionY = this.#containerHeight - this.#lineOffset - 5;
    this.#previousWasShift = false;
    this.#labels.forEach((label) => label.removeFromParent());
    this.#symbols.forEach((symbol) => symbol.removeFromParent());
    this.#entities.forEach((entity) => entity.removeFromParent());

    this.#currentLine = [];
    this.#lines = [];
    this.#labels = [];
    this.#symbols = [];
    this.#drawingSyntaxes = [];
    this.#entities = [];
    if (this.#hasOtherSyntaxes && this.#objectParameters.reset) this.#objectParameters.reset();
  };

  #render = (text = this.#displayedText): void => {
    this.#reset();
    text.split(' ').forEach((string) => this.#createAndAddLabel(string));
    this.#lines.push(this.#currentLine.slice());
    this.#currentLine = [];
    if (this.#horizontalAlignment !== 'left') this.#setHorizontalPosition();
    this.#reposition();
    this.#addAndPositionDrawingMarkup();
  };
}

export default MultiLabelImpl;

export const MultiLabel = CreateCallableConstructor(ImageLabelImpl);
