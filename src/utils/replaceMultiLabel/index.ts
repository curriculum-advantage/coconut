import MultiLabel from '../../nodes/sprites/MultiLabel';

export const replaceMultiLabel = (parent, label, text) => {
  const { parent, ...labelProperties } = label;
  const newMultiLabel = new MultiLabel({
    defaultText: text,
    ...labelProperties,
  });
  label.removeFromParent();
  parent.addChild(newMultiLabel);
  return newMultiLabel;
};
