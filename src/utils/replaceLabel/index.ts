import createLabel from '../createLabel';
// I can safely leave this to debug with some extra time Monday. It's super close. Just need the text to show up,
// OR i will have to add the label to the parent in the actual file if that's the issue

export const replaceLabel = (newParent, label, newText) => {
  // const { fontSize, ...labelProperties } = label;
  const {
    opacity,
    fontName,
    fontSize,
    dimensions,
    horizontalAlign,
    verticalAlign,
    fontWeight,
    fontStyle,
    position,
    color,
    strokeColor,
    strokeSize,
    anchor,
    zOrder,
  } = label;

  const newLabel = createLabel({
    parent: newParent,
    text: newText,
    opacity,
    fontName,
    fontSize,
    dimensions,
    horizontalAlign,
    verticalAlign,
    fontWeight,
    fontStyle,
    position,
    color,
    strokeColor,
    strokeSize,
    anchor,
    zOrder,
  });
  label.removeFromParent();
  return newLabel;
};
