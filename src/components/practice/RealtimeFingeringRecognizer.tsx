import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import {
  Hands,
  HAND_CONNECTIONS,
  drawConnectors,
  drawLandmarks,
  type Results,
} from '../../utils/mediapipe';
import { Camera, CameraOff, CircleCheck, CircleDot } from 'lucide-react';
import type { HoleStates } from '../../types/danso';
import {
  DEFAULT_VIRTUAL_HOLES,
  detectCoveredHoles,
  matchNoteByHoles,
  mirrorLandmarks,
} from '../../utils/fingeringDetection';

interface RealtimeFingeringRecognizerProps {
  onCameraActiveChange?: (isActive: boolean) => void;
  onCoveredHolesChange?: (holes: HoleStates) => void;
}

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

/**
 * react-webcam + MediaPipe Hands 기반 실시간 단소 운지 인식 컴포넌트.
 * 5개의 가상 지공 위에 손가락 랜드마크가 놓이면 빨간색 -> 초록색으로 시각 피드백을 제공합니다.
 */
export function RealtimeFingeringRecognizer({
  onCameraActiveChange,
  onCoveredHolesChange,
}: RealtimeFingeringRecognizerProps) {
  const webcamRef = useRef<Webcam | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const rafRef = useRef<number | null>(null);
  const isSendingRef = useRef(false);
  const radiusScaleRef = useRef(1);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [detectedHandsCount, setDetectedHandsCount] = useState(0);
  const [coveredHoles, setCoveredHoles] = useState<HoleStates>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [radiusScale, setRadiusScale] = useState(1);
  const [cameraError, setCameraError] = useState<string | null>(null);

  radiusScaleRef.current = radiusScale;

  const drawVirtualHolesOnCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, holesState: HoleStates, scale: number) => {
      const { width, height } = ctx.canvas;

      for (const hole of DEFAULT_VIRTUAL_HOLES) {
        const cx = hole.x * width;
        const cy = hole.y * height;
        const r = hole.radius * height * scale;
        const isClosed = holesState[hole.index];

        ctx.save();
        // 바깥쪽 반투명 광채
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = isClosed
          ? 'rgba(34, 197, 94, 0.24)'
          : 'rgba(239, 68, 68, 0.2)';
        ctx.fill();

        // 가상 구멍 본체 (열림: 빨간색, 막힘: 초록색)
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = isClosed
          ? 'rgba(34, 197, 94, 0.72)'
          : 'rgba(239, 68, 68, 0.45)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isClosed ? '#16a34a' : '#dc2626';
        ctx.stroke();

        // 구멍 번호 라벨
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hole.shortLabel, cx, cy);
        ctx.restore();
      }
    },
    [],
  );

  // MediaPipe Hands 초기화
  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65,
    });

    hands.onResults((results: Results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 거울 모드(Webcam mirrored)에 맞춰 X 좌표 반전
      const mirroredHands = (results.multiHandLandmarks ?? []).map(
        mirrorLandmarks,
      );

      // 가상 5지공 충돌 판정
      const nextCovered = detectCoveredHoles(
        mirroredHands,
        DEFAULT_VIRTUAL_HOLES,
        canvas.width / canvas.height,
        radiusScaleRef.current,
      );

      // 1) 가상 구멍 5개 오버레이 그리기 (빨강 <-> 초록)
      drawVirtualHolesOnCanvas(ctx, nextCovered, radiusScaleRef.current);

      // 2) 손가락 뼈대 및 관절 랜드마크 그리기
      for (const landmarks of mirroredHands) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: '#a3e635',
          lineWidth: 2.5,
        });
        drawLandmarks(ctx, landmarks, {
          color: '#f59e0b',
          lineWidth: 1,
          radius: 3.5,
        });
      }

      setDetectedHandsCount(mirroredHands.length);
      setCoveredHoles((prev) => {
        const changed = prev.some((val, idx) => val !== nextCovered[idx]);
        return changed ? nextCovered : prev;
      });
    });

    handsRef.current = hands;
    setIsModelReady(true);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      void hands.close();
      handsRef.current = null;
    };
  }, [drawVirtualHolesOnCanvas]);

  // 상위 컴포넌트에 지공 상태 및 카메라 활성 상태 전달
  useEffect(() => {
    onCoveredHolesChange?.(coveredHoles);
  }, [coveredHoles, onCoveredHolesChange]);

  useEffect(() => {
    onCameraActiveChange?.(isCameraOn);
  }, [isCameraOn, onCameraActiveChange]);

  // 카메라 활성화 시 프레임 루프 실행
  useEffect(() => {
    if (!isCameraOn) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setDetectedHandsCount(0);
      setCoveredHoles([false, false, false, false, false]);
      return undefined;
    }

    let cancelled = false;

    const processFrame = async () => {
      if (cancelled) return;

      const video = webcamRef.current?.video;
      const hands = handsRef.current;

      if (
        video &&
        hands &&
        video.readyState >= 2 &&
        !isSendingRef.current
      ) {
        isSendingRef.current = true;
        try {
          await hands.send({ image: video });
        } finally {
          isSendingRef.current = false;
        }
      }

      rafRef.current = requestAnimationFrame(() => {
        void processFrame();
      });
    };

    rafRef.current = requestAnimationFrame(() => {
      void processFrame();
    });

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isCameraOn]);

  const detectedNote = matchNoteByHoles(coveredHoles);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            실시간 운지 인식 (react-webcam + MediaPipe Hands)
          </h2>
          <p className="text-xs text-stone-500">
            화면의 빨간색 가상 지공 위에 손가락을 올리면 초록색(막힘)으로 변합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCameraError(null);
            setIsCameraOn((prev) => !prev);
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors ${
            isCameraOn
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-bamboo-600 hover:bg-bamboo-700'
          }`}
        >
          {isCameraOn ? (
            <>
              <CameraOff className="h-4 w-4" />
              웹캠 중지
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              웹캠 시작
            </>
          )}
        </button>
      </div>

      {/* 웹캠 + 가상 지공 & 랜드마크 캔버스 오버레이 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-900">
        {isCameraOn && (
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: VIDEO_WIDTH,
              height: VIDEO_HEIGHT,
              facingMode: 'user',
            }}
            onUserMediaError={(err) => {
              const message =
                typeof err === 'string'
                  ? err
                  : err.message || '카메라 접근 권한을 확인해 주세요.';
              setCameraError(message);
              setIsCameraOn(false);
            }}
            className="h-full w-full object-cover"
          />
        )}

        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        {/* 중앙 단소 가이드 바 (시각 보조) */}
        {isCameraOn && (
          <div className="pointer-events-none absolute inset-y-[16%] left-1/2 w-10 -translate-x-1/2 rounded-full border border-amber-300/40 bg-amber-100/10" />
        )}

        {!isCameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-stone-300">
            <Camera className="h-10 w-10 text-stone-500" />
            <p className="text-sm font-medium">
              &lsquo;웹캠 시작&rsquo;을 누르면 5개의 가상 지공과 손가락 추적이 시작됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 5지공 실시간 상태 아이콘 바 (빨강 = 열림 / 초록 = 막힘) */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {DEFAULT_VIRTUAL_HOLES.map((hole) => {
          const isClosed = coveredHoles[hole.index];
          return (
            <div
              key={hole.index}
              className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2.5 text-center transition-all duration-150 ${
                isClosed
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}
            >
              {isClosed ? (
                <CircleCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <CircleDot className="h-5 w-5 text-red-500" />
              )}
              <span className="mt-1 text-xs font-bold">{hole.shortLabel}</span>
              <span className="text-[11px] font-medium">
                {isClosed ? '막힘' : '열림'}
              </span>
            </div>
          );
        })}
      </div>

      {/* 감지된 운지 율명 & 감도 조절 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            감지된 손: <strong className="text-stone-900">{detectedHandsCount}개</strong>
          </span>
          <span>
            인식된 운지:{' '}
            <strong className="text-bamboo-700">
              {detectedNote
                ? `${detectedNote.id} (${detectedNote.koreanName})`
                : '일치 율명 없음'}
            </strong>
          </span>
          <span>모델: {isModelReady ? '준비 완료' : '로딩 중'}</span>
        </div>

        <label className="flex items-center gap-2">
          <span>구멍 판정 크기</span>
          <input
            type="range"
            min={0.75}
            max={1.45}
            step={0.05}
            value={radiusScale}
            onChange={(e) => setRadiusScale(Number(e.target.value))}
            className="w-24 accent-bamboo-600"
          />
        </label>
      </div>

      {cameraError && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {cameraError}
        </p>
      )}
    </div>
  );
}

