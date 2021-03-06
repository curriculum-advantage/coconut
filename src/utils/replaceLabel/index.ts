import createLabel from '../createLabel';

export const replaceLabel = (label, text) => {
  console.log('oldLabel:', label);
  console.log('text:', text);
  // how to remove current label?
  // will have to grab off every single possible param here
  const { ...labelProps } = label;
  const newLabel = createLabel({
    ...labelProps,
    fontSize: 30,
  });
  // 1. get label's parent
  // 2. detach label from parent
  // 3. attach new label to label's parent
  return newLabel;
};
