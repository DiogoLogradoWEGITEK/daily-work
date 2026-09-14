// Generates the AI standup resume from the fetched commits/PRs via Groq.
// Inputs:  /tmp/commits.json, /tmp/prs.json, env GROQ_KEY, AI_MODEL, GROQ_MODEL
// Output:  /tmp/ai-resume.txt (empty on any failure - the page hides the section then)
const fs = require('fs');

const KEY = process.env.GROQ_KEY || '';
const MODEL = process.env.AI_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return []; }
}

function main() {
  const commits = readJson('/tmp/commits.json');
  const prs = readJson('/tmp/prs.json');

  if (!KEY) { console.log('[ai] GROQ_KEY not set - skipping'); fs.writeFileSync('/tmp/ai-resume.txt', ''); return; }

  const since = process.env.SINCE || '';
  const until = process.env.UNTIL || '';

  const commitLines = commits
    .filter(c => !/^Merge pull request /i.test(c.headline || ''))
    .map(c => `[${c.repo}] ${c.headline}${(c.message || '').includes('\n') ? ' - ' + c.message.split('\n').slice(1).join(' ').trim().slice(0, 200) : ''}`);
  const prLines = prs.map(p => {
    const state = (p.state === 'merged' || p.mergedAt) ? 'merged' : 'open';
    return `[${p.repo}] #${p.number} (${state}) ${p.title}${p.body ? ' - ' + String(p.body).slice(0, 200) : ''}`;
  });

  if (!commitLines.length && !prLines.length) {
    console.log('[ai] nothing to summarize');
    fs.writeFileSync('/tmp/ai-resume.txt', '');
    return;
  }

  const prompt = [
    'These are my commits and pull requests at work since my last standup' + (since ? ` (window: ${since} to ${until})` : '') + ':',
    '',
    'Commits:',
    ...(commitLines.length ? commitLines : ['(none)']),
    '',
    'Pull requests:',
    ...(prLines.length ? prLines : ['(none)']),
    '',
    'Write my standup update as a ready-to-read script. Rules:',
    '- First person, past tense, English',
    '- Structure it exactly with these headings, one per line, followed by bullet lines starting with "-":',
    '  Commits:',
    '  Pull requests:',
    '- Each bullet: short plain sentence describing what I did (rewrite the commit/PR title as a natural action, mention the repo only when useful)',
    '- Merge commits and their PR titles describe the same work: mention each piece of work only once, under Pull requests',
    '- Skip trivia: dependency bumps, typo fixes, CI-only tweaks get one short mention at most',
    '- End with one line starting with "Next:" listing what I plan to do next, inferred from any open PRs or follow-up hints, otherwise "carry on with current tasks"',
    '- Output only the script text, no markdown, no code fences'
  ].join('\n');

  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You write concise daily standup updates for a software developer. Output plain text only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 500
  });

  const started = Date.now();
  const timeout = setTimeout(() => {
    console.log('[ai] timeout after 45s');
    fs.writeFileSync('/tmp/ai-resume.txt', '');
    process.exit(0);
  }, 45000);

  fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body
  }).then(async r => {
    clearTimeout(timeout);
    const text = await r.text();
    if (!r.ok) {
      console.log(`[ai] Groq HTTP ${r.status}: ${text.slice(0, 300)}`);
      fs.writeFileSync('/tmp/ai-resume.txt', '');
      process.exit(0);
    }
    const data = JSON.parse(text);
    const out = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
    console.log(`[ai] resume generated in ${((Date.now() - started) / 1000).toFixed(1)}s (${MODEL})`);
    fs.writeFileSync('/tmp/ai-resume.txt', out);
    process.exit(0);
  }).catch(e => {
    clearTimeout(timeout);
    console.log('[ai] request failed:', e.message);
    fs.writeFileSync('/tmp/ai-resume.txt', '');
    process.exit(0);
  });
}

main();