import { BookOpen, Gamepad2, HandMetal, Radio } from 'lucide-react';
import type { AppTabId } from '../../types/danso';

export interface TabItem {
  id: AppTabId;
  label: string;
  description: string;
  icon: typeof BookOpen;
}

export const APP_TABS: TabItem[] = [
  {
    id: 'learning',
    label: '학습 애니메이션',
    description: '중·임·무·황·태 운지 & 정간보',
    icon: BookOpen,
  },
  {
    id: 'practice',
    label: '실시간 연습',
    description: '웹캠 운지 인식 + 음정 코칭',
    icon: Radio,
  },
  {
    id: 'rhythm',
    label: '리듬 게임 & 악보',
    description: '정간보 뷰어 + 낙하 노트 게임',
    icon: Gamepad2,
  },
  {
    id: 'virtual',
    label: '가상 악기 연주',
    description: '실물 비율 단소 터치 연주',
    icon: HandMetal,
  },
];

interface TabNavigationProps {
  activeTab: AppTabId;
  onChangeTab: (tab: AppTabId) => void;
}

export function TabNavigation({ activeTab, onChangeTab }: TabNavigationProps) {
  return (
    <nav
      aria-label="Finger Hero 학습 모드"
      className="border-b border-stone-200 bg-stone-50/90 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-2 py-2.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
          {APP_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                  isActive
                    ? 'border-bamboo-500 bg-white text-bamboo-700 shadow-sm ring-1 ring-bamboo-500/20'
                    : 'border-transparent bg-transparent text-stone-600 hover:border-stone-200 hover:bg-white/70 hover:text-stone-900'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isActive
                      ? 'bg-bamboo-600 text-white'
                      : 'bg-stone-200/70 text-stone-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {tab.label}
                  </span>
                  <span className="block truncate text-xs text-stone-500">
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
