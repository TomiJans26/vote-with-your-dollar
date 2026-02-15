const BASE = import.meta.env.VITE_API_URL || '/api';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------
function getAccessToken() {
  return localStorage.getItem('vwyd_access_token');
}

function getRefreshToken() {
  return localStorage.getItem('vwyd_refresh_token');
}

function setTokens(access, refresh) {
  if (access) localStorage.setItem('vwyd_access_token', access);
  if (refresh) localStorage.setItem('vwyd_refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('vwyd_access_token');
  localStorage.removeItem('vwyd_refresh_token');
  localStorage.removeItem('vwyd_user');
}

function setUser(user) {
  if (user) localStorage.setItem('vwyd_user', JSON.stringify(user));
  else localStorage.removeItem('vwyd_user');
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('vwyd_user')); } catch { return null; }
}

export function isAuthenticated() {
  return !!getAccessToken();
}

// ---------------------------------------------------------------------------
// Fetch wrapper with auth header + 401 refresh logic
// ---------------------------------------------------------------------------
async function authFetch(url, opts = {}) {
  const token = getAccessToken();
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && typeof opts.body === 'string') headers['Content-Type'] = headers['Content-Type'] || 'application/json';

  let res = await fetch(url, { ...opts, headers });

  // If 401, try refreshing
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      res = await fetch(url, { ...opts, headers });
    }
  }

  return res;
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getRefreshToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) { clearTokens(); return false; }
    const data = await res.json();
    setTokens(data.access_token, null);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
function extractError(data, fallback) {
  if (typeof data.detail === 'string') return data.detail;
  if (data.detail?.error) return data.detail.error;
  return data.error || data.message || fallback;
}

export async function register(username, email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractError(data, 'Registration failed'));
  setTokens(data.access_token, data.refresh_token);
  setUser(data.user);
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractError(data, 'Login failed'));
  setTokens(data.access_token, data.refresh_token);
  setUser(data.user);
  return data;
}

export function logout() {
  clearTokens();
  setUser(null);
}

export async function verifyEmail(code) {
  const res = await authFetch(`${BASE}/auth/verify-email`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractError(data, 'Verification failed'));
  if (data.user) setUser(data.user);
  return data;
}

export async function resendVerification() {
  const res = await authFetch(`${BASE}/auth/resend-verification`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(extractError(data, 'Failed to resend'));
  return data;
}

export async function getMe() {
  const res = await authFetch(`${BASE}/auth/me`);
  if (!res.ok) return null;
  const data = await res.json();
  setUser(data.user);
  return data.user;
}

// ---------------------------------------------------------------------------
// Profile API
// ---------------------------------------------------------------------------
export async function saveBeliefProfileToServer(beliefs) {
  if (!isAuthenticated()) return false;
  try {
    const res = await authFetch(`${BASE}/profile/beliefs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beliefs }),
    });
    return res.ok;
  } catch { return false; }
}

export async function getBeliefProfileFromServer() {
  if (!isAuthenticated()) return null;
  try {
    const res = await authFetch(`${BASE}/profile/beliefs`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.beliefs;
  } catch { return null; }
}

export async function getScanHistory() {
  if (!isAuthenticated()) return [];
  try {
    const res = await authFetch(`${BASE}/profile/history`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.history;
  } catch { return []; }
}

export async function deleteAccount() {
  const res = await authFetch(`${BASE}/profile`, { method: 'DELETE' });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(extractError(d, 'Failed')); }
  clearTokens();
  setUser(null);
  return true;
}

// ---------------------------------------------------------------------------
// Existing product/company API
// ---------------------------------------------------------------------------
export async function scanProduct(upc) {
  const res = await authFetch(`${BASE}/scan/${upc}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractError(err, 'Product not found'));
  }
  return res.json();
}

export async function getAlternatives(category, companyId, upc, beliefProfile) {
  const res = await authFetch(`${BASE}/alternatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      companyId,
      upc: upc || null,
      beliefProfile: beliefProfile || {},
    }),
  });
  if (!res.ok) return { alternatives: [] };
  return res.json();
}

export async function getCompany(companyId) {
  const res = await authFetch(`${BASE}/company/${companyId}`);
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(extractError(d, 'Company not found')); }
  return res.json();
}

export async function searchProducts(query) {
  const res = await authFetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return { results: [], offResults: [] };
  return res.json();
}

export async function getCompanyIssues(companyId) {
  const res = await authFetch(`${BASE}/company/${companyId}/issues`);
  if (!res.ok) return { companyId, issues: {} };
  return res.json();
}
