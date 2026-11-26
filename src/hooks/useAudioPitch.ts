import { useCallback, useEffect, useRef, useState } from 'react';
import type { PitchAnalysisResult } from '../types/danso';
import { analyzeAudioBuffer } from '../utils/pitchDetection';

export interface UseAudioPitchReturn {
  isListening: boolean;
  analysis: PitchAnalysisResult;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

const INITIAL_ANALYSIS: PitchAnalysisResult = {
  frequencyHz: null,
  clarity: 0,
  volumeRms: 0,
  westernNote: null,
  gugakNote: null,
  matchedNote: null,
  centsOff: null,
};

/**
 * Web Audio API(AnalyserNode) + YIN 알고리즘으로 마이크 입력의 실시간 음정(Pitch)을 분석하는 훅.
 */
export function useAudioPitch(): UseAudioPitchReturn {
  const [isListening, setIsListening] = useState(false);
  const [analysis, setAnalysis] = useState<PitchAnalysisResult>(INITIAL_ANALYSIS);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopListening = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setIsListening(false);
    setAnalysis(INITIAL_ANALYSIS);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;

      source.connect(analyser);

      streamRef.current = stream;
      audioCtxRef.current = audioCtx;
      setError(null);
      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);

      const tick = () => {
        analyser.getFloatTimeDomainData(buffer);
        const result = analyzeAudioBuffer(buffer, audioCtx.sampleRate);
        setAnalysis(result);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '마이크 권한을 가져올 수 없습니다.';
      setError(message);
      setIsListening(false);
    }
  }, []);

  useEffect(() => stopListening, [stopListening]);

  return { isListening, analysis, error, startListening, stopListening };
}
