import { Outlet, NavLink } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Scan', icon: '📷' },
  { to: '/explore', label: 'Explore', icon: '🔍' },
  { to: '/report', label: 'Report', icon: '📊' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 to-teal-600 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">🗳️ DollarVote</h1>
          <span className="text-xs text-teal-200">Every dollar is a vote</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 bg-gray-50">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-lg mx-auto shadow-lg">
        <div className="flex justify-around py-2">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs transition-colors py-1 px-3 rounded-lg ${
                  isActive ? 'text-teal-700 font-semibold bg-teal-50' : 'text-gray-400 hover:text-gray-600'
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
