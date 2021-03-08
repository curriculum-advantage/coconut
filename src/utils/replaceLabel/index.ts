import createLabel from '../createLabel';
//I can safely leave this to debug with some extra time Monday. It's super close. Just need the text to show up,
//OR i will have to add the label to the parent in the actual file if that's the issue

export const replaceLabel = (label, text) => {
  const { parent, ...labelProperties } = label;
  const newLabel = createLabel({
    ...labelProperties,
    text,
    parent,
  });
  label.removeFromParent();
  return newLabel;
};
