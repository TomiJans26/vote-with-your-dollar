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
      {/* Header - Minimal & Modern */}
      <header className="sticky top-0 z-10 glass border-b border-dark-border px-4 py-3">
        <div className="flex items-center justify-center">
          <h1 className="text-lg font-bold tracking-tight text-gradient">
            DollarVote
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom nav - Modern pill-shaped active indicator */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-dark-border max-w-lg mx-auto pb-safe">
        <div className="flex justify-around items-center py-2 px-2">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-aligned/20 text-aligned shadow-lg glow-green' 
                    : 'text-dark-text-secondary hover:text-dark-text active:scale-95'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    size={22} 
                    className={`transition-all duration-200 ${
                      isActive ? 'stroke-[2.5]' : 'stroke-[2]'
                    }`}
                  />
                  <span className={`text-[10px] font-medium transition-all ${
                    isActive ? 'font-semibold' : ''
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
