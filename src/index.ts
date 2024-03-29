import 'core-js';

import BackgroundLayer from './nodes/layers/BackgroundLayer';

import { MultiLabel } from './nodes/sprites/MultiLabelImpl';
import { ImageLabel } from './nodes/sprites/ImageLabelImpl';
import { JSEventManager } from './nodes/util/JSEventManagerImpl';

import Paragraph from './utils/Paragraph';
import Input from './utils/Input';
import addChildren from './utils/addChildren';
import createDoubleTapDetector from './utils/createDoubleTapDetector';
import createRect from './utils/createRect';
import createSprite from './utils/createSprite';
import createSwipeDetector from './utils/createSwipeDetector';
import frameAnimation from './utils/frameAnimation';
import getCachedFrame from './utils/getCachedFrame';
import isPointOnTarget from './utils/isPointOnTarget';
import log from './utils/log';
import setGlobalScale from './utils/setGlobalScale';
import validNumberInput from './utils/validNumberInput';
import validValue from './utils/validValue';
import {
  stopCurrentAudio,
  queueAudio,
  playEffect,
  playBackgroundAudio,
  stopBackgroundAudio,
} from './utils/audioManager';
import {
  itemExists,
  populateArray,
  createPrandoIntGenerator,
  prandoShuffle,
  prandoDigits,
  createPrandoDistributor,
} from './utils/questionGeneration';
import { markDebugLoaded, updateDebugScore } from './utils/debug';
import { stopHintInterval, setHintInterval, resetHintInterval } from './utils/hintAudio';
import createPseudorandomNumberGenerator from './utils/createPseudorandomNumberGenerator';
import getParameterByName from './utils/getParameterByName';
import setGlobals from './utils/setGlobals';
import embeddedQuestionsGenerator from './utils/embeddedQuestionsGenerator';
import isTouchDevice from './utils/isTouchDevice';

export {
  BackgroundLayer,

  ImageLabel,
  MultiLabel,
  Paragraph,
  Input,
  JSEventManager,

  addChildren,
  createDoubleTapDetector,
  createRect,
  createSprite,
  createSwipeDetector,
  frameAnimation,
  getCachedFrame,
  isPointOnTarget,
  isTouchDevice,
  log,
  setGlobalScale,
  validNumberInput,
  validValue,
  stopCurrentAudio,
  queueAudio,
  playEffect,
  playBackgroundAudio,
  stopBackgroundAudio,

  markDebugLoaded,
  updateDebugScore,

  itemExists,
  populateArray,
  createPrandoIntGenerator,
  prandoShuffle,
  prandoDigits,
  createPrandoDistributor,

  createPseudorandomNumberGenerator,
  getParameterByName,
  setGlobals,
  embeddedQuestionsGenerator,

  stopHintInterval,
  setHintInterval,
  resetHintInterval,
};

const coconut = {
  BackgroundLayer,

  ImageLabel,
  MultiLabel,
  Paragraph,
  Input,
  JSEventManager,

  addChildren,
  createDoubleTapDetector,
  createRect,
  createSprite,
  createSwipeDetector,
  frameAnimation,
  getCachedFrame,
  isPointOnTarget,
  isTouchDevice,
  log,
  setGlobalScale,
  validNumberInput,
  validValue,
  stopCurrentAudio,
  queueAudio,
  playEffect,
  playBackgroundAudio,
  stopBackgroundAudio,

  markDebugLoaded,
  updateDebugScore,

  itemExists,
  populateArray,
  createPrandoIntGenerator,
  prandoShuffle,
  prandoDigits,
  createPrandoDistributor,

  createPseudorandomNumberGenerator,
  getParameterByName,
  setGlobals,
  embeddedQuestionsGenerator,

  stopHintInterval,
  setHintInterval,
  resetHintInterval,
};

export default coconut;
