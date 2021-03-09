import createLabel from '../createLabel';
// I can safely leave this to debug with some extra time Monday. It's super close. Just need the text to show up,
// OR i will have to add the label to the parent in the actual file if that's the issue

export const replaceLabel = (newParent, label, newText) => {
  // const { fontSize, ...labelProperties } = label;
  const {
    propParent,
    propText,
    propOpacity,
    propFontName,
    propFontSize,
    propDimensions,
    propHorizontalAlign,
    propVerticalAlign,
    propFontWeight,
    propFontStyle,
    propPosition,
    propColor,
    propStrokeColor,
    propStrokeSize,
    propAnchor,
    propZOrder,
  } = label;
  console.log(
    'PROPS',
    propParent,
    propText,
    propOpacity,
    propFontName,
    propFontSize,
    propDimensions,
    propHorizontalAlign,
    propVerticalAlign,
    propFontWeight,
    propFontStyle,
    propPosition,
    propColor,
    propStrokeColor,
    propStrokeSize,
    propAnchor,
    propZOrder,
  );

  const newLabel = createLabel({
    parent: newParent,
    text: newText,
  });
  label.removeFromParent();
  return newLabel;
};
