// Netlify: served at /api/stats (see netlify.toml)
const { getStats } = require('../../api/_stats-core');
exports.handler = async () => {
  try {
    const stats = await getStats();
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }, body: JSON.stringify(stats) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Roblox API unavailable' }) };
  }
};
