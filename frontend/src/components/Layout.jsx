import { Outlet, NavLink } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Scan', icon: '📷' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/settings', label: 'Prefs', icon: '⚙️' },
  { to: '/about', label: 'About', icon: 'ℹ️' },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-teal-700 text-white px-4 py-3 text-center shadow-md">
        <h1 className="text-lg font-bold tracking-tight">🗳️ Vote With Your Dollar</h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-lg mx-auto">
        <div className="flex justify-around py-2">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs transition-colors ${
                  isActive ? 'text-teal-700 font-semibold' : 'text-gray-500'
                }`
              }
            >
              <span className="text-xl">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
