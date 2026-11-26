import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoadingScreen } from './components/common/LoadingScreen';
import { HomeMenuScreen } from './components/home/HomeMenuScreen';
import { NameOnboardingModal } from './components/home/NameOnboardingModal';
import { MainLayout } from './components/layout/MainLayout';
import { SettingsModal } from './components/settings/SettingsModal';
import { LearningTab } from './components/tabs/LearningTab';
import { PracticeTab } from './components/tabs/PracticeTab';
import { RhythmGameTab } from './components/tabs/RhythmGameTab';
import { SejongChatbotComingSoon } from './components/tabs/SejongChatbotComingSoon';
import { VirtualInstrumentTab } from './components/tabs/VirtualInstrumentTab';
import { useAudioPitch } from './hooks/useAudioPitch';
import {
  clearUserProgress,
  getPrimaryBadge,
  loadUserProgress,
  recordRhythmGameResult,
  recordSongPracticed,
  saveUserName,
  type UserProgressData,
} from './utils/userProgressStorage';

export function App() {
  const location = useLocation();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [progress, setProgress] = useState<UserProgressData>(() =>
    loadUserProgress(),
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  const audioPitch = useAudioPitch();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsEntering(false);
    }, 550);
    return () => window.clearTimeout(timer);
  }, []);

  const showOnboarding = !progress.userName || isEditingName;
  const primaryBadge = getPrimaryBadge(progress);

  useEffect(() => {
    if (location.pathname !== '/practice') {
      setIsCameraActive(false);
    }
  }, [location.pathname]);

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setIsCameraActive(active);
  }, []);

  const handleSubmitName = useCallback((name: string) => {
    setProgress((prev) => saveUserName(prev, name));
    setIsEditingName(false);
  }, []);

  const handleSongComplete = useCallback((songTitle: string) => {
    setProgress((prev) => recordSongPracticed(prev, songTitle));
  }, []);

  const handleGameComplete = useCallback(
    (jangdanName: string, songTitle: string, score: number) => {
      setProgress((prev) =>
        recordRhythmGameResult(prev, jangdanName, songTitle, score),
      );
    },
    [],
  );

  const handleResetProgress = useCallback(() => {
    const empty = clearUserProgress();
    setProgress(empty);
    setIsEditingName(false);
  }, []);

  if (isEntering) {
    return <LoadingScreen message="국악 마을로 가는 중..." />;
  }

  return (
    <>
      <MainLayout
        userName={progress.userName}
        primaryBadge={primaryBadge}
        isCameraActive={isCameraActive}
        audioPitch={audioPitch}
        onOpenSettings={() => setIsSettingsOpen(true)}
      >
        <Routes>
          <Route
            path="/"
            element={
              <HomeMenuScreen
                progress={progress}
                onEditName={() => setIsEditingName(true)}
              />
            }
          />
          <Route path="/learning" element={<LearningTab />} />
          <Route
            path="/practice"
            element={
              <PracticeTab
                audioPitch={audioPitch}
                onCameraActiveChange={handleCameraActiveChange}
                onSongComplete={handleSongComplete}
              />
            }
          />
          <Route
            path="/virtual"
            element={
              <VirtualInstrumentTab onSongComplete={handleSongComplete} />
            }
          />
          <Route
            path="/rhythm"
            element={
              <RhythmGameTab
                audioPitch={audioPitch}
                onGameComplete={handleGameComplete}
              />
            }
          />
          <Route path="/chatbot" element={<SejongChatbotComingSoon />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>

      <SettingsModal
        isOpen={isSettingsOpen}
        progress={progress}
        onEditName={() => setIsEditingName(true)}
        onResetProgress={handleResetProgress}
        onClose={() => setIsSettingsOpen(false)}
      />

      <NameOnboardingModal
        key={isEditingName ? 'edit' : `init-${progress.userName}`}
        isOpen={showOnboarding}
        initialName={progress.userName}
        onSubmitName={handleSubmitName}
        onCancel={
          progress.userName ? () => setIsEditingName(false) : undefined
        }
      />
    </>
  );
}

export default App;
