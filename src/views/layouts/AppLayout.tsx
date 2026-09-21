import React from 'react';
import { User, Dumbbell, BarChart2, Camera, LogOut, Calendar } from 'lucide-react';
import { AuthUser } from '../../models/types/User';

export type ActiveTab = 'profile' | 'workout' | 'exercises' | 'stats' | 'advice';

interface AppLayoutProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: AuthUser | null;
  onSignOut: () => void;
  children: React.ReactNode;
}

export function AppLayout({
  activeTab,
  onTabChange,
  user,
  onSignOut,
  children,
}: AppLayoutProps) {
  const navItems = [
    { id: 'workout' as ActiveTab, label: 'Workout', icon: Calendar },
    { id: 'exercises' as ActiveTab, label: 'Exercises', icon: Dumbbell },
    { id: 'stats' as ActiveTab, label: 'Statistics', icon: BarChart2 },
    { id: 'advice' as ActiveTab, label: 'Advice', icon: Camera },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col antialiased selection:bg-[#dc2626] selection:text-white">

      {/* ─── TOP NAV BAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0c0c0e] border-b border-[#1e1e22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">

          {/* Brand */}
          <button
            onClick={() => onTabChange('workout')}
            className="flex items-center gap-3 flex-shrink-0 group cursor-pointer"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-[#dc2626] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-xs tracking-wider leading-none">FB</span>
              {/* subtle glow on hover */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-black text-white tracking-tight leading-none">Fit Buddy</p>
              <p className="text-[10px] font-semibold text-[#dc2626] tracking-widest uppercase mt-0.5">Iron Core</p>
            </div>
          </button>

          {/* Desktop Nav — centred */}
          <nav className="hidden md:flex items-center gap-px bg-[#141416] border border-[#1e1e22] p-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#dc2626] text-white'
                      : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User pill */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <div className="flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 bg-[#141416] border border-[#1e1e22]">
                {/* Avatar circle */}
                <div className="w-6 h-6 rounded-full bg-[#1c1c20] border border-[#27272a] overflow-hidden flex items-center justify-center text-[11px] font-black text-neutral-300 flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-white truncate max-w-[100px]">
                  {user.username}
                </span>
                <div className="w-px h-4 bg-[#262626] mx-0.5 hidden sm:block" />
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="p-1 text-neutral-500 hover:text-[#ef4444] transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="md:hidden flex items-center gap-px overflow-x-auto px-3 py-1.5 bg-[#0a0a0c] border-t border-[#1a1a1e] scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-white border-b-2 border-[#dc2626]'
                    : 'text-neutral-500 border-b-2 border-transparent hover:text-neutral-300'
                }`}
              >
                <Icon size={13} strokeWidth={isActive ? 2.5 : 1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-5 sm:p-7 md:p-10 lg:p-12 pb-24 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
