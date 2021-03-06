import createLabel from '../createLabel';

export const replaceLabel = (label, text) => {
  console.log('oldLabel:', label);
  console.log('text:', text);
  // how to remove current label?
  // will have to grab off every single possible param here
  const { parent, ...labelProperties } = label;
  console.log('file: index.ts ~ line 9 ~ labelProperties', labelProperties);
  const newLabel = createLabel({
    parent,
    ...labelProperties,
    fontSize: 20,
  });
  // 1. get label's parent
  console.log('file: index.ts ~ line 9 ~ parent', parent);
  // 2. detach label from parent
  label.removeFromParent();
  // 3. attach new label to label's parent
  parent.addChild(newLabel);
  return newLabel;
};
