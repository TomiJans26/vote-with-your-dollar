const axios = require('axios');

const BASE_URL = 'https://api.open.fec.gov/v1';
const API_KEY = process.env.FEC_API_KEY || 'DEMO_KEY';

const client = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },
});

/**
 * Search for a committee/PAC by name.
 * @param {string} name - Committee name or partial name
 * @param {object} [opts] - Additional query params (e.g. { committee_type: 'Q' } for PACs)
 * @returns {Promise<object[]>} Array of committee results
 */
async function searchCommittee(name, opts = {}) {
  const { data } = await client.get('/names/committees/', {
    params: { q: name, ...opts },
  });
  return data.results || [];
}

/**
 * Get detailed info about a specific committee by ID.
 * @param {string} committeeId - FEC committee ID (e.g. C00123456)
 * @returns {Promise<object>}
 */
async function getCommittee(committeeId) {
  const { data } = await client.get(`/committee/${committeeId}/`);
  return data.results?.[0] || null;
}

/**
 * Get contributions/receipts for a committee (schedule A).
 * @param {string} committeeId - FEC committee ID
 * @param {object} [opts] - Query params: two_year_transaction_period, sort, per_page, etc.
 * @returns {Promise<object>} { results, pagination }
 */
async function getCommitteeContributions(committeeId, opts = {}) {
  const { data } = await client.get(`/schedules/schedule_a/`, {
    params: { committee_id: committeeId, per_page: 20, sort: '-contribution_receipt_date', ...opts },
  });
  return { results: data.results || [], pagination: data.pagination || {} };
}

/**
 * Get disbursements (spending) for a committee (schedule B).
 * @param {string} committeeId - FEC committee ID
 * @param {object} [opts] - Query params
 * @returns {Promise<object>} { results, pagination }
 */
async function getCommitteeDisbursements(committeeId, opts = {}) {
  const { data } = await client.get(`/schedules/schedule_b/`, {
    params: { committee_id: committeeId, per_page: 20, sort: '-disbursement_date', ...opts },
  });
  return { results: data.results || [], pagination: data.pagination || {} };
}

/**
 * Get candidates that a PAC has contributed to (schedule B, filtered).
 * @param {string} committeeId
 * @param {number} [cycle] - Election cycle year (e.g. 2024)
 * @returns {Promise<object[]>}
 */
async function getPacCandidateContributions(committeeId, cycle) {
  const params = { committee_id: committeeId, per_page: 50, sort: '-total' };
  if (cycle) params.cycle = cycle;
  const { data } = await client.get('/schedules/schedule_b/by_recipient/', { params });
  return data.results || [];
}

module.exports = {
  searchCommittee,
  getCommittee,
  getCommitteeContributions,
  getCommitteeDisbursements,
  getPacCandidateContributions,
};
