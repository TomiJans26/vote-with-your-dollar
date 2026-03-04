import { Outlet, NavLink } from 'react-router-dom';
import { Search, Compass, Newspaper, ClipboardList, Settings } from 'lucide-react';

const nav = [
  { to: '/', label: 'Search', Icon: Search },
  { to: '/explore', label: 'Explore', Icon: Compass },
  { to: '/feed', label: 'Feed', Icon: Newspaper },
  { to: '/list', label: 'List', Icon: ClipboardList },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-dark-bg">
      {/* Header - BOLD & FUN */}
      <header className="sticky top-0 z-10 glass border-b border-dark-border px-4 py-3">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-black tracking-tight text-gradient-purple">
            DollarVote
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom nav - GRADIENT GLOW on active */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-dark-border max-w-lg mx-auto pb-safe backdrop-blur-xl">
        <div className="flex justify-around items-center py-2 px-2">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-accent-purple/20 to-accent-violet/20 text-accent-violet shadow-xl glow-purple scale-105' 
                    : 'text-dark-text-secondary hover:text-dark-text hover:bg-white/5 active:scale-95'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    size={24} 
                    className={`transition-all duration-300 ${
                      isActive ? 'stroke-[3] drop-shadow-lg' : 'stroke-[2]'
                    }`}
                  />
                  <span className={`text-[11px] font-bold transition-all ${
                    isActive ? 'tracking-wide' : ''
                  }`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
