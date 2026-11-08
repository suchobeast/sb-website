// Vercel: served at /api/stats
const { getStats } = require('./_stats-core');
module.exports = async (req, res) => {
  try {
    const stats = await getStats();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(stats);
  } catch (e) {
    res.status(502).json({ error: 'Roblox API unavailable' });
  }
};
