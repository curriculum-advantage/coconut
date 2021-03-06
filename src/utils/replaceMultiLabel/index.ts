import MultiLabel from '../../nodes/sprites/MultiLabel';

export const replaceMultiLabel = (label, text) => {
  const { parent, ...labelProperties } = label;
  const newMultiLabel = new MultiLabel({
    parent,
    defaultText: text,
    ...labelProperties,
  });
  label.removeFromParent();
  return newMultiLabel;
};
