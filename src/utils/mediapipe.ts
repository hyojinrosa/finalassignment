import handsScript from '@mediapipe/hands/hands.js?raw';
import drawingUtilsScript from '@mediapipe/drawing_utils/drawing_utils.js?raw';
import type {
  Hands as HandsConstructor,
  LandmarkConnectionArray,
  NormalizedLandmark,
  Results,
} from '@mediapipe/hands';
import type {
  drawConnectors as DrawConnectorsFn,
  drawLandmarks as DrawLandmarksFn,
} from '@mediapipe/drawing_utils';

interface MediapipeGlobals {
  Hands?: typeof HandsConstructor;
  HAND_CONNECTIONS?: LandmarkConnectionArray;
  drawConnectors?: typeof DrawConnectorsFn;
  drawLandmarks?: typeof DrawLandmarksFn;
}

const g = globalThis as unknown as MediapipeGlobals;

if (!g.Hands || !g.HAND_CONNECTIONS) {
  new Function(handsScript).call(globalThis);
}

if (!g.drawConnectors || !g.drawLandmarks) {
  new Function(drawingUtilsScript).call(globalThis);
}

if (!g.Hands || !g.HAND_CONNECTIONS) {
  throw new Error('@mediapipe/hands 초기화에 실패했습니다.');
}

if (!g.drawConnectors || !g.drawLandmarks) {
  throw new Error('@mediapipe/drawing_utils 초기화에 실패했습니다.');
}

export type Hands = HandsConstructor;
export const Hands = g.Hands;
export const HAND_CONNECTIONS = g.HAND_CONNECTIONS;
export const drawConnectors = g.drawConnectors;
export const drawLandmarks = g.drawLandmarks;

export type { LandmarkConnectionArray, NormalizedLandmark, Results };
