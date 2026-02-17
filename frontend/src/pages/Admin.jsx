import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '/api';

function getAdminToken() {
  return localStorage.getItem('dv_admin_token');
}

function adminFetch(path) {
  return fetch(`${BASE}/admin${path}`, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  }).then((r) => {
    if (r.status === 401 || r.status === 403) throw new Error('unauthorized');
    return r.json();
  });
}

function adminPut(path, body) {
  return fetch(`${BASE}/admin${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

function adminPost(path, body) {
  return fetch(`${BASE}/admin${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

// Issue list for dropdowns
const ALL_ISSUES = [
  'gun_rights', 'immigration', 'military_defense', 'government_spending',
  'environmental_regulations', 'climate_change', 'renewable_energy', 'lgbtq_rights',
  'racial_justice', 'womens_rights', 'religious_freedom', 'free_speech',
  'workers_rights', 'corporate_tax', 'healthcare', 'education_funding',
  'minimum_wage', 'trade_policy', 'drug_policy', 'data_privacy',
  'ai_regulation', 'vaccine_policy',
];

const ISSUE_LABELS = Object.fromEntries(
  ALL_ISSUES.map((k) => [k, k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())])
);

const STANCE_COLORS = {
  strong_support: 'bg-green-500/20 text-green-400 border-green-500/30',
  lean_support: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  neutral: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  lean_oppose: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  strong_oppose: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function StanceBadge({ stance }) {
  const label = (stance || 'neutral').replace(/_/g, ' ');
  const cls = STANCE_COLORS[stance] || STANCE_COLORS.neutral;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
  );
}

// Stat card component
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
      {sub && <p className="text-teal-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// Sections
const SECTIONS = ['stats', 'clicks', 'research', 'users', 'companies'];
const SECTION_LABELS = {
  stats: '📊 Overview',
  clicks: '🖱️ Click Analytics',
  research: '🔬 Research Queue',
  users: '👥 Users',
  companies: '🏢 Companies',
};

export default function Admin() {
  const navigate = useNavigate();
  const [section, setSection] = useState('stats');
  const [stats, setStats] = useState(null);
  const [clicks, setClicks] = useState(null);
  const [users, setUsers] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [research, setResearch] = useState(null);
  const [companySearch, setCompanySearch] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rankIssues, setRankIssues] = useState(['', '', '']);
  const [rankedCompanies, setRankedCompanies] = useState(null);
  const [rankingMode, setRankingMode] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin/login');
      return;
    }
    loadSection('stats');
  }, []);

  const loadSection = (s) => {
    setSection(s);
    setSidebarOpen(false);
    const handler = (p) => p.catch((e) => {
      if (e.message === 'unauthorized') {
        localStorage.removeItem('dv_admin_token');
        navigate('/admin/login');
      }
    });
    if (s === 'stats' && !stats) handler(adminFetch('/stats').then(setStats));
    if (s === 'clicks' && !clicks) handler(adminFetch('/clicks').then(setClicks));
    if (s === 'users' && !users) handler(adminFetch('/users').then(setUsers));
    if (s === 'companies' && !companies) handler(adminFetch('/companies').then(setCompanies));
    if (s === 'research' && !research) handler(adminFetch('/research-queue?status=all').then(setResearch));
  };

  const markComplete = async (id) => {
    await adminPut(`/research-queue/${id}/complete`, {});
    setResearch(null);
    adminFetch('/research-queue?status=all').then(setResearch);
  };

  const logout = () => {
    localStorage.removeItem('dv_admin_token');
    navigate('/admin/login');
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortArrow = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const filteredCompanies = companies?.companies?.filter(
    (c) => !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase())
      || (c.ticker || '').toLowerCase().includes(companySearch.toLowerCase())
  )?.sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const av = a[sortCol] ?? '';
    const bv = b[sortCol] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  const openCompanyDetail = async (companyId) => {
    setLoadingDetail(true);
    try {
      const data = await adminFetch(`/companies/${companyId}`);
      setCompanyDetail(data);
    } catch (e) {
      if (e.message === 'unauthorized') {
        localStorage.removeItem('dv_admin_token');
        navigate('/admin/login');
      }
    }
    setLoadingDetail(false);
  };

  const rankCompanies = async () => {
    const selected = rankIssues.filter(Boolean);
    if (selected.length === 0) return;
    try {
      const data = await adminFetch(`/companies/ranked?issues=${selected.join(',')}`);
      setRankedCompanies(data);
      setRankingMode(true);
    } catch (e) {
      if (e.message === 'unauthorized') {
        localStorage.removeItem('dv_admin_token');
        navigate('/admin/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-lg border border-gray-700"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-950 border-r border-gray-800 flex flex-col
        transform transition-transform lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-teal-400">DollarVote</h1>
          <p className="text-gray-500 text-sm">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => loadSection(s)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                section === s
                  ? 'bg-teal-600/20 text-teal-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className="text-gray-500 hover:text-red-400 text-sm">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">

          {/* STATS */}
          {section === 'stats' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
              {stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard label="Total Users" value={stats.total_users} />
                  <StatCard label="Total Scans" value={stats.total_scans} />
                  <StatCard label="Total Clicks" value={stats.total_clicks} />
                  <StatCard label="Users Today" value={stats.users_today} />
                  <StatCard label="Scans Today" value={stats.scans_today} />
                </div>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
          )}

          {/* CLICKS */}
          {section === 'clicks' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Click Analytics</h2>
              {clicks ? (
                <div className="space-y-8">
                  {/* By type */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Clicks by Store</h3>
                    {clicks.by_type.length === 0 ? (
                      <p className="text-gray-500">No click data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {clicks.by_type.map((r) => {
                          const max = Math.max(...clicks.by_type.map((x) => x.count));
                          return (
                            <div key={r.link_type} className="flex items-center gap-3">
                              <span className="text-gray-300 w-24 text-sm capitalize">{r.link_type || 'unknown'}</span>
                              <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                                <div
                                  className="bg-teal-500 h-full rounded-full flex items-center justify-end pr-2"
                                  style={{ width: `${Math.max((r.count / max) * 100, 8)}%` }}
                                >
                                  <span className="text-xs text-white font-medium">{r.count}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top brands */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Top 10 Clicked Brands</h3>
                    {clicks.top_brands.length === 0 ? (
                      <p className="text-gray-500">No data yet</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700">
                            <th className="text-left py-2">#</th>
                            <th className="text-left py-2">Brand</th>
                            <th className="text-right py-2">Clicks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clicks.top_brands.map((b, i) => (
                            <tr key={i} className="border-b border-gray-700/50">
                              <td className="py-2 text-gray-500">{i + 1}</td>
                              <td className="py-2 text-white">{b.brand || '—'}</td>
                              <td className="py-2 text-right text-teal-400 font-medium">{b.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
          )}

          {/* RESEARCH QUEUE */}
          {section === 'research' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Research Queue</h2>
              {research ? (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700 text-left">
                        <th className="p-3">Brand</th>
                        <th className="p-3">Barcode</th>
                        <th className="p-3 text-right">Scans</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Created</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {research.items.length === 0 ? (
                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">Queue is empty</td></tr>
                      ) : research.items.map((r) => (
                        <tr key={r.id} className="border-b border-gray-700/50">
                          <td className="p-3 text-white">{r.brand_name || r.company_name || '—'}</td>
                          <td className="p-3 text-gray-400 font-mono text-xs">{r.barcode || '—'}</td>
                          <td className="p-3 text-right text-teal-400 font-bold">{r.scan_count}</td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              r.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                              r.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-600/30 text-gray-300'
                            }`}>{r.status}</span>
                          </td>
                          <td className="p-3 text-gray-500 text-xs">{r.created_at?.slice(0, 10)}</td>
                          <td className="p-3">
                            {r.status !== 'complete' && (
                              <button
                                onClick={() => markComplete(r.id)}
                                className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-lg"
                              >
                                ✓ Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
          )}

          {/* USERS */}
          {section === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Users</h2>
              {users ? (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700 text-left">
                        <th className="p-3">ID</th>
                        <th className="p-3">Username</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Verified</th>
                        <th className="p-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-700/50">
                          <td className="p-3 text-gray-500">{u.id}</td>
                          <td className="p-3 text-white">{u.username}</td>
                          <td className="p-3 text-gray-300">{u.email}</td>
                          <td className="p-3">{u.email_verified ? '✅' : '❌'}</td>
                          <td className="p-3 text-gray-500 text-xs">{u.created_at?.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
          )}

          {/* COMPANIES */}
          {section === 'companies' && (
            <div>
              {/* Company Detail View */}
              {companyDetail ? (
                <div>
                  <button
                    onClick={() => setCompanyDetail(null)}
                    className="text-teal-400 hover:text-teal-300 text-sm mb-4 flex items-center gap-1"
                  >
                    ← Back to companies
                  </button>
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{companyDetail.company.name}</h2>
                        <div className="flex gap-4 mt-1 text-sm">
                          {companyDetail.company.ticker && (
                            <span className="text-teal-400 font-mono">{companyDetail.company.ticker}</span>
                          )}
                          {companyDetail.company.industry && (
                            <span className="text-gray-400">{companyDetail.company.industry}</span>
                          )}
                          {companyDetail.company.country && (
                            <span className="text-gray-500">{companyDetail.company.country}</span>
                          )}
                        </div>
                        {companyDetail.company.description && (
                          <p className="text-gray-400 text-sm mt-3 max-w-2xl">{companyDetail.company.description}</p>
                        )}
                      </div>
                      <div className="flex gap-4 text-center">
                        <div className="bg-gray-900 rounded-lg px-4 py-3 border border-gray-700">
                          <p className="text-2xl font-bold text-teal-400">{companyDetail.click_count}</p>
                          <p className="text-gray-500 text-xs">Clicks</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg px-4 py-3 border border-gray-700">
                          <p className="text-2xl font-bold text-green-400">${companyDetail.pac_total.toLocaleString()}</p>
                          <p className="text-gray-500 text-xs">PAC Total</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brands */}
                  {companyDetail.company.brands?.length > 0 && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3">Brands ({companyDetail.company.brands.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {companyDetail.company.brands.map((b, i) => (
                          <span key={i} className="bg-gray-700/50 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-gray-600/50">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {companyDetail.issues?.length > 0 && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Issue Stances</h3>
                      <div className="grid gap-3">
                        {companyDetail.issues.map((issue) => (
                          <div key={issue.key} className="flex items-center gap-3 py-2 border-b border-gray-700/50 last:border-0">
                            <span className="text-gray-300 text-sm w-48 shrink-0">{ISSUE_LABELS[issue.key] || issue.key}</span>
                            <StanceBadge stance={issue.stance} />
                            {issue.importance && (
                              <span className="text-gray-500 text-xs">({issue.importance})</span>
                            )}
                            {issue.notes && (
                              <span className="text-gray-500 text-xs truncate max-w-md" title={issue.notes}>{issue.notes}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Research Queue Items */}
                  {companyDetail.research_items?.length > 0 && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-white mb-3">Research Queue</h3>
                      {companyDetail.research_items.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 py-2 text-sm border-b border-gray-700/50 last:border-0">
                          <span className="text-gray-300">{r.brand_name || '—'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            r.status === 'complete' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/30 text-gray-300'
                          }`}>{r.status}</span>
                          <span className="text-gray-500 text-xs">{r.scan_count} scans</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Company List View */
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Companies</h2>

                  {/* Value Sort Controls */}
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Rank by Values</h3>
                    <div className="flex flex-wrap items-end gap-3">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx} className="flex-1 min-w-[180px]">
                          <label className="text-xs text-gray-500 mb-1 block">Priority {idx + 1} {idx === 0 ? '(3×)' : idx === 1 ? '(2×)' : '(1×)'}</label>
                          <select
                            value={rankIssues[idx]}
                            onChange={(e) => {
                              const next = [...rankIssues];
                              next[idx] = e.target.value;
                              setRankIssues(next);
                            }}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">— Select issue —</option>
                            {ALL_ISSUES.map((ik) => (
                              <option key={ik} value={ik}>{ISSUE_LABELS[ik]}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <button
                        onClick={rankCompanies}
                        disabled={!rankIssues.some(Boolean)}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                      >
                        Rank
                      </button>
                      {rankingMode && (
                        <button
                          onClick={() => { setRankingMode(false); setRankedCompanies(null); }}
                          className="text-gray-400 hover:text-white text-sm px-3 py-2"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
                  />

                  {/* Ranked results */}
                  {rankingMode && rankedCompanies ? (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700 text-left">
                            <th className="p-3 w-12">#</th>
                            <th className="p-3">Company</th>
                            <th className="p-3 text-right">Score</th>
                            {rankedCompanies.issues.map((ik) => (
                              <th key={ik} className="p-3 text-center">{ISSUE_LABELS[ik]}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rankedCompanies.companies
                            .filter((c) => !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase()))
                            .map((c, i) => (
                            <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => openCompanyDetail(c.id)}>
                              <td className="p-3 text-gray-500">{i + 1}</td>
                              <td className="p-3 text-white font-medium">{c.name}</td>
                              <td className="p-3 text-right font-bold">
                                <span className={c.score > 0 ? 'text-green-400' : c.score < 0 ? 'text-red-400' : 'text-gray-400'}>
                                  {c.score > 0 ? '+' : ''}{c.score}
                                </span>
                              </td>
                              {rankedCompanies.issues.map((ik) => (
                                <td key={ik} className="p-3 text-center">
                                  <StanceBadge stance={c.stances[ik]} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : companies ? (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700 text-left">
                            <th className="p-3 cursor-pointer hover:text-teal-400 select-none" onClick={() => toggleSort('name')}>Name{sortArrow('name')}</th>
                            <th className="p-3 cursor-pointer hover:text-teal-400 select-none" onClick={() => toggleSort('ticker')}>Ticker{sortArrow('ticker')}</th>
                            <th className="p-3 cursor-pointer hover:text-teal-400 select-none" onClick={() => toggleSort('industry')}>Industry{sortArrow('industry')}</th>
                            <th className="p-3 cursor-pointer hover:text-teal-400 select-none" onClick={() => toggleSort('country')}>Country{sortArrow('country')}</th>
                            <th className="p-3 text-right cursor-pointer hover:text-teal-400 select-none" onClick={() => toggleSort('brand_count')}>Brands{sortArrow('brand_count')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCompanies?.map((c) => (
                            <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => openCompanyDetail(c.slug || c.id)}>
                              <td className="p-3 text-white font-medium">{c.name}</td>
                              <td className="p-3 text-teal-400 font-mono text-xs">{c.ticker || '—'}</td>
                              <td className="p-3 text-gray-300">{c.industry || '—'}</td>
                              <td className="p-3 text-gray-400">{c.country || '—'}</td>
                              <td className="p-3 text-right text-gray-400">{c.brand_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading...</p>
                  )}
                </div>
              )}
              {loadingDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 rounded-xl p-6 text-white">Loading company details...</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
