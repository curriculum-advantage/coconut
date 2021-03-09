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
  console.log(
    'file: index.ts ~ line 21 ~ zOrder',
    zOrder,
    'file: index.ts ~ line 21 ~ anchor',
    anchor,
    'file: index.ts ~ line 21 ~ strokeSize',
    strokeSize,
    'file: index.ts ~ line 21 ~ strokeColor',
    strokeColor,
    'file: index.ts ~ line 21 ~ color',
    color,
    'file: index.ts ~ line 21 ~ position',
    position,
    'file: index.ts ~ line 21 ~ fontStyle',
    fontStyle,
    'file: index.ts ~ line 21 ~ fontWeight',
    fontWeight,
    'file: index.ts ~ line 21 ~ dimensions',
    dimensions,
    'file: index.ts ~ line 21 ~ horizontalAlign',
    horizontalAlign,
    'file: index.ts ~ line 21 ~ verticalAlign',
    verticalAlign,
    'file: index.ts ~ line 21 ~ fontSize',
    fontSize,
    'file: index.ts ~ line 21 ~ fontName',
    fontName,
    'file: index.ts ~ line 21 ~ opacity',
    opacity,
  );

  const newLabel = createLabel({
    parent: newParent,
    text: newText,
  });
  label.removeFromParent();
  return newLabel;
};
