import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Crown,
  Gamepad2,
  HandMetal,
  Home,
  Radio,
} from 'lucide-react';
import type { AppTabId } from '../../types/danso';

export interface TabItem {
  id: AppTabId;
  path: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
}

export const APP_TABS: TabItem[] = [
  {
    id: 'home',
    path: '/',
    label: '메인 홈',
    description: '메뉴 선택 & 나의 기록',
    icon: Home,
  },
  {
    id: 'learning',
    path: '/learning',
    label: '기초 학습',
    description: '단소 원리 & 호흡 애니메이션',
    icon: BookOpen,
  },
  {
    id: 'practice',
    path: '/practice',
    label: 'AI 실시간 연습',
    description: '웹캠 운지 + 마이크 교정',
    icon: Radio,
  },
  {
    id: 'virtual',
    path: '/virtual',
    label: '가상 악기 연주',
    description: '악보 보며 터치 연주',
    icon: HandMetal,
  },
  {
    id: 'rhythm',
    path: '/rhythm',
    label: '장단 리듬 게임',
    description: '율명 노트 & 장단 익히기',
    icon: Gamepad2,
  },
  {
    id: 'chatbot',
    path: '/chatbot',
    label: '세종대왕 챗봇',
    description: 'AI 단소 도우미 (준비 중)',
    icon: Crown,
  },
];

export function TabNavigation() {
  return (
    <nav
      aria-label="Finger Hero 학습 모드"
      className="border-b border-amber-200/70 bg-white/80 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-2 py-2 sm:grid-cols-3 lg:grid-cols-6">
          {APP_TABS.map((tab) => {
            const Icon = tab.icon;

            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={tab.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-all ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-50/90 text-emerald-800 shadow-xs ring-1 ring-emerald-400/30'
                      : 'border-transparent bg-transparent text-stone-600 hover:border-amber-200 hover:bg-amber-50/50 hover:text-stone-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-extrabold">
                        {tab.label}
                      </span>
                      <span className="block truncate text-[10px] text-stone-500">
                        {tab.description}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
