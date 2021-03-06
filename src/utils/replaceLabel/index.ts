import createLabel from '../createLabel';

export const replaceLabel = (label, text) => {
  const { parent, ...labelProperties } = label;
  const newLabel = createLabel({
    text,
    parent,
    ...labelProperties,
  });
  label.removeFromParent();
  return newLabel;
};
