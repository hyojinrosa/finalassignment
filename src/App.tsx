import { useCallback, useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { LearningTab } from './components/tabs/LearningTab';
import { PracticeTab } from './components/tabs/PracticeTab';
import { RhythmGameTab } from './components/tabs/RhythmGameTab';
import { VirtualInstrumentTab } from './components/tabs/VirtualInstrumentTab';
import { useAudioPitch } from './hooks/useAudioPitch';
import type { AppTabId } from './types/danso';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTabId>('learning');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const audioPitch = useAudioPitch();

  const handleTabChange = useCallback((nextTab: AppTabId) => {
    setActiveTab(nextTab);
    if (nextTab !== 'practice') {
      setIsCameraActive(false);
    }
  }, []);

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setIsCameraActive(active);
  }, []);

  return (
    <MainLayout
      activeTab={activeTab}
      onChangeTab={handleTabChange}
      isCameraActive={isCameraActive}
      audioPitch={audioPitch}
    >
      {activeTab === 'learning' && <LearningTab />}
      {activeTab === 'practice' && (
        <PracticeTab
          audioPitch={audioPitch}
          onCameraActiveChange={handleCameraActiveChange}
        />
      )}
      {activeTab === 'rhythm' && <RhythmGameTab audioPitch={audioPitch} />}
      {activeTab === 'virtual' && <VirtualInstrumentTab />}
    </MainLayout>
  );
}

export default App;
