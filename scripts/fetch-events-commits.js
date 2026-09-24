// Captures ALL pushed commits (any branch) via the GitHub Events API + compare.
// Events report each push (repo, branch ref, before..head); compare expands the
// range into the actual commits. Only pushes to repos matching GH_SEARCH_SCOPE
// orgs (or repo: filters) are kept. Output: /tmp/events-commits.json with
// [{sha, repo, branch, date, headline, message, url}] — empty on any failure
// so the workflow can fall back to search-based commits.
const fs = require('fs');

const KEY = process.env.GH_TOKEN || '';
const SCOPE = process.env.GH_SEARCH_SCOPE || '';
const SINCE_ISO = process.env.SINCE || '';
const TARGET_USER = process.env.TARGET_USER || process.env.GH_USER || '';

function orgsFromScope(scope) {
  const out = [];
  (scope || '').split(/\s+/).forEach(part => {
    const m = part.match(/^org:([\w.-]+)$/i);
    if (m) out.push(m[1].toLowerCase());
  });
  return out;
}

function repoAllowed(fullName, orgs) {
  if (!orgs.length) return true; // no scope = no filter
  const owner = fullName.split('/')[0].toLowerCase();
  return orgs.includes(owner);
}

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return []; } }

function parseCommitsFromCompare(data, repo, branch) {
  return (data.commits || []).map(c => ({
    sha: c.sha.slice(0, 7),
    repo,
    branch,
    date: c.commit.author.date,
    headline: (c.commit.message || '').split('\n')[0],
    message: c.commit.message || '',
    url: c.html_url
  }));
}

async function run() {
  const orgs = orgsFromScope(SCOPE);
  if (!orgs.length) { console.log('[events] no org: filters in GH_SEARCH_SCOPE - events fetch skipped'); fs.writeFileSync('/tmp/events-commits.json', '[]'); return; }

  const sinceMs = SINCE_ISO ? Date.parse(SINCE_ISO) : (Date.now() - 48 * 3600 * 1000);
  const headers = {
    Authorization: `token ${KEY}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'daily-work-fetch'
  };

  // 1. push events for the user (GH_TOKEN is their PAT, so private org repos
  // appear here). Events are newest-first; stop paging once we pass the window.
  const pushes = [];
  let stop = false;
  for (let page = 1; page <= 3 && !stop; page++) {
    const r = await fetch(`https://api.github.com/users/${TARGET_USER}/events?per_page=100&page=${page}`, { headers });
    if (!r.ok) { console.log(`[events] HTTP ${r.status} on events page ${page}`); break; }
    const events = await r.json();
    if (!events.length) break;
    for (const e of events) {
      if (e.type !== 'PushEvent') continue;
      const created = Date.parse(e.created_at);
      if (created < sinceMs) { stop = true; break; }
      const repo = e.repo.name;
      const owner = repo.split('/')[0].toLowerCase();
      if (!orgs.includes(owner)) continue;
      const ref = (e.payload && e.payload.ref) || '';
      if (!ref.startsWith('refs/heads/')) continue; // skip tag pushes
      pushes.push({
        repo: e.repo.name,
        branch: ref.replace('refs/heads/', ''),
        before: e.payload.before,
        head: e.payload.head,
        created: e.created_at
      });
    }
  }

  console.log(`[events] ${pushes.length} qualifying push(es) in window (orgs: ${orgs.join(', ')})`);
  if (!pushes.length) { fs.writeFileSync('/tmp/events-commits.json', '[]'); return; }

  // 2. expand each push into its commits via compare
  const all = [];
  let failures = 0;
  for (const p of pushes) {
    try {
      const r = await fetch(`https://api.github.com/repos/${p.repo}/compare/${p.before}...${p.head}`, { headers });
      if (!r.ok) { failures++; console.log(`[events] compare ${p.repo} ${p.before.slice(0, 7)}..${p.head.slice(0, 7)} -> HTTP ${r.status}`); continue; }
      const d = await r.json();
      const commits = parseCommits(d, p.repo, p.branch);
      // commit timestamp, not push timestamp — keeps ordering truthful
      all.push(...commits);
      await new Promise(res => setTimeout(res, 150)); // be gentle with the API
    } catch (e) {
      failures++;
      console.log(`[events] compare failed for ${p.repo}: ${e.message}`);
    }
  }

  // 3. dedupe by sha (same commit pushed to multiple branches), sort by time
  const unique = Object.values(all.reduce((acc, c) => { acc[c.sha] = c; return acc; }, {}))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  console.log(`[events] ${unique.length} commits captured (${failures} compare failures)`);
  fs.writeFileSync('/tmp/events-commits.json', JSON.stringify(unique));
}

run().catch(e => {
  console.log('[events] fatal:', e.message);
  fs.writeFileSync('/tmp/events-commits.json', '[]');
  process.exit(0);
});