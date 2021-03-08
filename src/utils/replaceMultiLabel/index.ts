import MultiLabel from '../../nodes/sprites/MultiLabel';
//I can safely leave this to debug with some extra time Monday. It's super close. Just need the text to show up,
//OR i will have to add the label to the parent in the actual file if that's the issue

export const replaceMultiLabel = (parent, label, text) => {
  const { fontSize, ...labelProperties } = label;
  const newMultiLabel = new MultiLabel({
    ...labelProperties,
    defaultText: text,
  });
  label.removeFromParent();
  parent.addChild(newMultiLabel);
  return newMultiLabel;
};
