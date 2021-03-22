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
import TextImage from '../TextImage';

class MultiLabel extends cc.LayerColor {
  constructor({
    anchor = [0, 0],
    areaClick = false,
    clickHandler = () => {},
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
  } = {}, objectParameters: { styleSyntaxes?: object } = {}) {
    super(cc.color(255, 255, 255, 0));
    this.setAnchorPoint(...anchor);
    this.setContentSize(containerWidth, containerHeight);
    this.setPosition(...position);

    let displayedText;
    let numberReplacedFillIns = 0;
    const lineOffset = fontSize * lineHeight;
    const wordOffset = fontSize / wordSpace;
    let positionY = containerHeight - lineOffset - 5;
    let positionX = 0;
    let currentLine = [];
    let lines = [];
    let labels = [];
    let entities = [];
    let symbols = [];
    let drawingSyntaxes = [];
    let fillIns = [];
    const hasOtherSyntaxes = Object.keys(objectParameters).length > 0;
    const otherSyntaxes = hasOtherSyntaxes && objectParameters.styleSyntaxes
      ? objectParameters.styleSyntaxes
      : {};
    let previousWasShift = false;

    let wasClicked = false;

    const browser = detect();

    // Current supported markup
    const styleSyntaxes = {
      ...otherSyntaxes,
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

    const updateRangeValues = (unStyledText, syntax): string => {
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
     * Iterate over the list of style syntaxes and marked up the specified text with each existing
     * styling
     * @param {string} unmarkText the text to be marked up for styling prior to rendering
     * @returns {string} the marked up text to be styled prior to rendering
     */
    const notateStyles = (unmarkText): string => {
      let updatedText = unmarkText;
      ObjectValues(styleSyntaxes).forEach((syntax) => {
        if (updatedText.includes(syntax)) {
          const endSyntax = syntax.replace('[', '[/');
          while (updatedText.includes(endSyntax)) {
            updatedText = updateRangeValues(updatedText, syntax);
          }
        }
      });
      return updatedText;
    };

    /**
     * Iterate over a the list of supported styling and check a given string to see if its marked
     * for any of the supported styling.
     * @param {string} markText the marked up text to check.
     * @returns {object} an objected containing all the styling to be applied to the marked up text.
     */
    const getStyling = (markText): object => {
      const styles = {};
      ObjectValues(styleSyntaxes).forEach((syntax) => {
        if (markText.includes(syntax)) {
          styles[findKey(styleSyntaxes, (o) => o === syntax)] = true;
        }
      });
      return styles;
    };

    /**
     * Remove all the markup from the specified string
     * @param markText the string with all the marking for the supported styling.
     * @returns {string} the string without the styling markup
     */
    const cleanText = (markText): string => {
      let cleanedText = markText;
      ObjectValues(styleSyntaxes).forEach((syntax) => {
        if (syntax === '[BLANK]' && cleanedText.includes(syntax)) {
          cleanedText = cleanedText.replace(
            new RegExp(escapeRegExp(syntax), 'g'),
            fillIns[numberReplacedFillIns],
          );
          numberReplacedFillIns += 1;
        } else if (syntax.includes('ANGLE')) {
          cleanedText = cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'), '    ');
        } else if (syntax.includes('SQRT')) {
          cleanedText = cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'), '  ');
        } else cleanedText = cleanedText.replace(new RegExp(escapeRegExp(syntax), 'g'), '');
      });
      return cleanedText;
    };

    const breakLine = (): void => {
      positionX = 0;
      positionY -= lineOffset;
      lines.push(currentLine.slice());
      currentLine = [];
    };

    const concat = (label, changeY = true): void => {
      const previousLabel = currentLine.length > 0
        ? currentLine[currentLine.length - 1]
        : labels[labels.length - 1];
      const previousBoundingBox = previousLabel.getBoundingBox();
      if (!previousWasShift && positionY !== previousBoundingBox.y) {
        previousLabel.setPosition(positionX, positionY);
        currentLine.push(previousLabel);
        lines = lines.map((line, index) => {
          if (index === lines.length - 1) {
            return line.filter((_lineLabel, labelIndex) => labelIndex !== line.length - 1);
          }
          return line;
        });
      } else if (previousBoundingBox.x > positionX) {
        previousLabel.setPosition(positionX, positionY);
        positionX += previousBoundingBox.width;
      }

      positionX = previousLabel.getBoundingBox().x + previousBoundingBox.width;
      label.setPositionX(positionX);
      if (changeY) label.setPositionY(positionY);
    };

    const shouldBreakLine = (width, hasLinebreak): boolean => positionX + width > containerWidth
      || hasLinebreak;

    const checkWidth = (width, hasLinebreak): void => {
      if (shouldBreakLine(width, hasLinebreak)) breakLine();
    };

    const offsetForScript = (label, hasSubscript, hasSuperScript): boolean => {
      const shouldUpdateFontSize = hasSubscript || hasSuperScript;
      if (shouldUpdateFontSize) {
        label.setFontSize(fontSize * 0.6);
        const labelYPosition = label.getPositionY();
        const labelYPositionOffset = hasSubscript
          ? label.getBoundingBox().height * 0.05
          : label.getBoundingBox().height * 0.5;
        label.setPositionY(labelYPosition + labelYPositionOffset);
        concat(label, false);
      }

      return shouldUpdateFontSize;
    };

    /**
     * Shift the specified up or down by 1/3 the line height
     * @param label the label being offset
     * @param shouldShiftUp flag for whether the label should be shifted up
     * @param shouldShiftDown flag for whether the label should be shifed down
     */
    const shift = (label, shouldShiftUp, shouldShiftDown): void => {
      previousWasShift = false;
      if (shouldShiftUp || shouldShiftDown) {
        const shiftDirection = shouldShiftUp ? 1 : -1;
        const shiftBy = (lineOffset / 3) * shiftDirection;
        label.setPositionY(label.getPositionY() + shiftBy);
        previousWasShift = true;
      }
    };

    const shouldOffsetBold = (bold): boolean => bold && browser
      && (browser.name === 'ie' || browser.name === 'edge');

    /**
     * Position a specific label by default starting at the top left corner in sequence lines and
     * rows in order to fix the specified node dimensions.
     * @param {cc.LabelTTF} label the label to be position
     * @param {object} styling object containing the label styling.
     */
    const setDefaultPosition = (label, styling): void => {
      const { width } = label;
      checkWidth(width, styling.breakSyntax);
      if (styling.concatSyntax) concat(label);
      else {
        if (shouldOffsetBold(styling.boldSyntax)) {
          label.setDimensions(
            label.getBoundingBox().width,
            label.getBoundingBox().height + (fontSize * 0.24),
          );
        }
        label.setPosition(positionX, positionY);
      }
      offsetForScript(label, styling.subScriptSyntax, styling.superScriptSyntax);
      shift(label, styling.shiftUpSyntax, styling.shouldShiftDown);
      currentLine.push(label);
      positionX += width + wordOffset;
    };

    const formatSuperSubScript = (text): string => {
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

    const createTextLabel = (labelText, labelWeight, labelStyle, color, display = 'flex'): typeof cc.Sprite => new TextImage({
      parent: this,
      text: labelText,
      fontSize,
      display,
      fontWeight: labelWeight,
      fontStyle: labelStyle,
      anchor: [0, 0],
      position: [0, 0],
      color,
    });

    /**
     * Convert Fraction labeled text into fraction
     * '_' is used as space marker
     * @param text the Fraction text
     * @param color the color of the fraction
     * @returns {TextImage}
     */
    const getFractionLabel = (text, styleFontWeight, styleFontStyle, color): typeof cc.Node => {
      let fraction;
      let fText = text.replace(new RegExp('_', 'g'), ' ').split('|');
      fText = fText.map((value) => formatSuperSubScript(value));
      if (fText.length === 3) {
        fraction = `${fText[0]}<sup>${fText[1]}</sup>&frasl;<sub>${fText[2]}</sub>`;
      } else fraction = `<sup>${fText[0]}</sup>&frasl;<sub>${fText[1]}</sub>`;

      return createTextLabel(fraction, styleFontWeight, styleFontStyle, color, 'block');
    };

    const getOtherDrawSyntaxes = (styling = {}): object => {
      const additionalSyntaxes = {};
      Object.getOwnPropertyNames(otherSyntaxes).forEach((syntax) => {
        additionalSyntaxes[syntax.replace('Syntax', '')] = styling[syntax];
      });

      return additionalSyntaxes;
    };

    const checkForChildLevelSyntax = (drawObject, styling): void => {
      if (hasOtherSyntaxes) Object.assign(drawObject, getOtherDrawSyntaxes(styling));
    };

    const createStyledLabel = (styling, text): object => {
      const styleFontWeight = styling.boldSyntax ? 900 : fontWeight;
      const styleFontStyle = styling.italicSyntax ? 'italic' : fontStyle;
      const color = styling.highlightSyntax ? fontColorHighlight : fontColorPrimary;
      let labelText = formatSuperSubScript(text);
      labelText = styling.blankSyntax ? labelText : labelText.replace(/_/g, ' ');
      const textLabel = styling.fractionSyntax
        ? getFractionLabel(labelText, styleFontWeight, styleFontStyle, color)
        : createTextLabel(labelText, styleFontWeight, styleFontStyle, color);

      if (textLabel.setDimensions) {
        const { width, height } = textLabel.getContentSize();
        textLabel.setDimensions(width, height + 2);
      }
      return { styleFontStyle, color, textLabel };
    };

    const createAndAddLabel = (text) => {
      const styling = getStyling(text);
      const updatedText = cleanText(text);

      // @ts-ignore
      const { styleFontStyle, color, textLabel } = createStyledLabel(styling, updatedText);

      const drawObject = {
        // @ts-ignore
        underline: styling.underlineSyntax,
        color,
        styleFontStyle,
      };
      checkForChildLevelSyntax(drawObject, styling);
      drawingSyntaxes.push(drawObject);

      setDefaultPosition(textLabel, styling);
      labels.push(textLabel);
    };

    const setHorizontalPosition = (): void => {
      lines.forEach((line) => {
        const lastWordInLine = line[line.length - 1];
        const { width, x } = lastWordInLine.getBoundingBox();
        const offset = (containerWidth - (x + width)) / (horizontalAlignment === 'center' ? 2 : 1);

        line.forEach((word) => {
          word.setPositionX(word.getPositionX() + offset);
        });
      });
    };

    const addListener = (): void => {
      cc.eventManager.addListener({
        event: cc.EventListener.TOUCH_ONE_BY_ONE,
        swallowTouches: false,
        onTouchBegan: () => true,
        onTouchEnded: (event) => {
          if (areaClick && isPointOnTarget(event, this)) {
            wasClicked = true;
            // @ts-ignore
            clickHandler(labels);
          } else {
            labels.some((label, index) => {
              if (isPointOnTarget(event, label)) {
                // @ts-ignore
                clickHandler(label, index);
                return true;
              }
              return false;
            });
          }
        },
      }, this);
    };

    // create default blank underscore strings for every fill-in-blank formatting syntax found
    const initiateFillIns = (text): void => {
      const regExp = new RegExp(escapeRegExp(styleSyntaxes.blankSyntax), 'g');
      const fillInCount = (text.match(regExp) || []).length;
      fillIns = new Array(fillInCount).fill(defaultFillIn);
    };

    const reset = (): void => {
      positionX = 0;
      numberReplacedFillIns = 0;
      positionY = containerHeight - lineOffset - 5;
      previousWasShift = false;
      labels.forEach((label) => label.removeFromParent());
      symbols.forEach((symbol) => symbol.removeFromParent());
      entities.forEach((entity) => entity.removeFromParent());

      currentLine = [];
      lines = [];
      labels = [];
      symbols = [];
      drawingSyntaxes = [];
      entities = [];
      // @ts-ignore
      if (hasOtherSyntaxes && objectParameters.reset) objectParameters.reset();
    };

    /**
     * Draw a line under the at a specified location
     *
     * @param {object} the bounding box of the label being used as the anchor point.
     *
     * @param {array} color the color of the text decoration.
     */
    const underlineLabel = ({ x, y, width }, color): void => {
      let yOffset = 3;
      if (browser.name === 'ie' || browser.name === 'edge') yOffset = 0;
      const underline = createRect({
        parent: this,
        position: [x - 2, y + yOffset],
        size: [width + 3, fontSize * 0.05],
        color: [...color, 255],
      });
      underline.setAnchorPoint(0, 0);
      entities.push(underline);
    };

    /**
     * Called after the adjusting the labels positioning. Draw the marked syntaxes in the proper
     * locations.
     */
    const addAndPositionDrawingMarkup = (): void => {
      drawingSyntaxes.forEach((drawingSyntax, index) => {
        if (drawingSyntax.underline) {
          underlineLabel(labels[index].getBoundingBox(), drawingSyntax.color);
        }
        if (hasOtherSyntaxes) {
          // @ts-ignore
          objectParameters.drawSymbol(
            drawingSyntax,
            labels[index].getBoundingBox(),
            drawingSyntax.color,
          );
        }
      });
    };

    const reposition = (): void => {
      const actualHeight = containerHeight + (-1 * positionY);
      this.setContentSize(containerWidth, actualHeight);
      const changeInHeight = (actualHeight - containerHeight);
      positionY = actualHeight - lineOffset - 5;
      lines.forEach((line) => {
        line.forEach((label) => {
          label.setPositionY(label.getBoundingBox().y + changeInHeight);
        });
        positionY -= lineOffset;
      });

      this.setPositionY(position[1] - changeInHeight);
    };

    const render = (text = displayedText): void => {
      reset();
      text.split(' ').forEach((string) => createAndAddLabel(string));
      lines.push(currentLine.slice());
      currentLine = [];
      if (horizontalAlignment !== 'left') setHorizontalPosition();
      reposition();
      addAndPositionDrawingMarkup();
    };

    this.setString = (text): void => {
      displayedText = text;
      const updatedText = notateStyles(text);
      initiateFillIns(displayedText);
      render(updatedText);
      addListener();
    };

    /**
     * Display a white solid background unless otherwise specified
     */
    this.showBackground = (): void => {
      this.setOpacity(255);
    };

    this.fillInBlank = (index, fillInText): void => {
      fillIns[index] = fillInText;
      render();
    };

    this.resetBlank = (index): void => {
      fillIns[index] = defaultFillIn;
      render();
    };

    this.getLabels = (): Array<typeof cc.Sprite> => labels;

    this.wasClicked = (): boolean => wasClicked;

    this.resetClicked = (): void => {
      wasClicked = false;
    };
  }
}

export default MultiLabel;
