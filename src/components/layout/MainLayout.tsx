import type { ReactNode } from 'react';
import type { UseAudioPitchReturn } from '../../hooks/useAudioPitch';
import type { AppTabId } from '../../types/danso';
import { SejongChatbot } from '../chat/SejongChatbot';
import { Header } from './Header';
import { LivePitchFooter } from './LivePitchFooter';
import { TabNavigation } from './TabNavigation';

interface MainLayoutProps {
  activeTab: AppTabId;
  onChangeTab: (tab: AppTabId) => void;
  isCameraActive: boolean;
  audioPitch: UseAudioPitchReturn;
  children: ReactNode;
}

export function MainLayout({
  activeTab,
  onChangeTab,
  isCameraActive,
  audioPitch,
  children,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-hanji via-stone-50 to-bamboo-50/40 text-stone-900">
      <div className="sticky top-0 z-30">
        <Header
          isCameraActive={isCameraActive}
          isMicActive={audioPitch.isListening}
        />
        <TabNavigation activeTab={activeTab} onChangeTab={onChangeTab} />
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <SejongChatbot />
      <LivePitchFooter audioPitch={audioPitch} />
    </div>
  );
}
