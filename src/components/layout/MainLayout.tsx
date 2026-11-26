import type { ReactNode } from 'react';
import type { UseAudioPitchReturn } from '../../hooks/useAudioPitch';
import type { MilestoneBadge } from '../../utils/userProgressStorage';
import { Header } from './Header';
import { LivePitchFooter } from './LivePitchFooter';
import { TabNavigation } from './TabNavigation';

interface MainLayoutProps {
  userName: string;
  primaryBadge: MilestoneBadge | null;
  isCameraActive: boolean;
  audioPitch: UseAudioPitchReturn;
  onOpenSettings: () => void;
  children: ReactNode;
}

export function MainLayout({
  userName,
  primaryBadge,
  isCameraActive,
  audioPitch,
  onOpenSettings,
  children,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-rose-50/60 via-amber-50/50 to-sky-50/70 text-stone-900">
      <div className="sticky top-0 z-30">
        <Header
          userName={userName}
          primaryBadge={primaryBadge}
          isCameraActive={isCameraActive}
          isMicActive={audioPitch.isListening}
          onOpenSettings={onOpenSettings}
        />
        <TabNavigation />
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <LivePitchFooter audioPitch={audioPitch} />
    </div>
  );
}
