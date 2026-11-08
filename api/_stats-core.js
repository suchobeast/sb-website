// Fetches live numbers for the Roblox group + every game owned by it.
// Runs on the server (Vercel / Netlify), because Roblox APIs block direct browser calls.
const GROUP_ID = 16744488; // Suchobeast Studios

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function getStats() {
  const [group, games] = await Promise.all([
    getJson(`https://groups.roblox.com/v1/groups/${GROUP_ID}`),
    getJson(`https://games.roblox.com/v2/groups/${GROUP_ID}/games?accessFilter=2&limit=50&sortOrder=Asc`)
  ]);
  const ids = (games.data || []).map(g => g.id);
  let players = 0, visits = 0;
  if (ids.length) {
    const details = await getJson(`https://games.roblox.com/v1/games?universeIds=${ids.join(',')}`);
    (details.data || []).forEach(g => { players += g.playing || 0; visits += g.visits || 0; });
  }
  return {
    players,
    visits,
    members: group.memberCount,
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
  };
}

module.exports = { getStats };
