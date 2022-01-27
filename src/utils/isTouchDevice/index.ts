const isTouchDevice = (): boolean => window.matchMedia('(pointer: coarse)').matches
  || 'ontouchstart' in window
  || navigator.maxTouchPoints > 0;

export default isTouchDevice;
