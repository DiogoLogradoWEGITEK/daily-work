// Generates the AI standup resume from the fetched commits/PRs via Groq.
// Inputs:  /tmp/commits.json, /tmp/prs.json, env GROQ_KEY, AI_MODEL, AI_LANG
// Output:  /tmp/ai-resume.txt (empty on any failure - the page hides the section then)
const fs = require('fs');

const KEY = process.env.GROQ_KEY || '';
const MODEL = process.env.AI_MODEL || 'openai/gpt-oss-120b';
const LANG = (process.env.AI_LANG || 'pt').toLowerCase(); // pt | en

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

  const L = LANG === 'en'
    ? {
      commits: 'Commits:',
      prs: 'Pull requests:',
      next: 'Next:',
      fallbackNext: 'carry on with current tasks',
      rules: [
        'Write my standup update as a ready-to-read script. Rules:',
        '- First person, past tense, Portuguese (pt-PT style, Brazilian Portuguese is fine if more natural)',
        '- Structure it exactly with these headings, one per line, followed by bullet lines starting with "-":',
        '  Commits:',
        '  Pull requests:',
        '- Each bullet: short plain sentence describing what I did (rewrite the commit/PR title as a natural action, mention the repo only when useful)',
        '- Merge commits and their PR titles describe the same work: mention each piece of work only once, under Pull requests',
        '- If a section ends up with no bullets after deduplication, omit that section heading entirely',
        '- Skip trivia: dependency bumps, typo fixes, CI-only tweaks get one short mention at most',
        '- End with one line starting with "Next:" listing what I plan to do next, inferred from any open PRs or follow-up hints, otherwise "carry on with current tasks"',
        '- Output only the script text, no markdown, no code fences'
      ].join('\n')
    }
    : {
      commits: 'Commits:',
      prs: 'Pull requests:',
      next: 'A seguir:',
      fallbackNext: 'continuar com as tarefas atuais',
      rules: [
        'Escreve o meu update de standup como um guião pronto a ler. Regras:',
        '- Primeira pessoa, passado, português de Portugal (pt-PT)',
        '- Estrutura exatamente com estes títulos, um por linha, seguidos de bullets que começam por "-":',
        '  Commits:',
        '  Pull requests:',
        '- Cada bullet: frase curta e simples a descrever o que fiz (reescreve o título do commit/PR como uma ação natural, menciona o repo só quando for útil)',
        '- Commits de merge e os títulos dos PRs descrevem o mesmo trabalho: menciona cada trabalho uma única vez, em Pull requests',
        '- Se uma secção ficar sem bullets depois de remover duplicados, omite completamente o título dessa secção',
        '- Ignora trivialidades: bumps de dependências, fixes de typos, ajustes de CI têm no máximo uma menção curta',
        '- Termina com uma linha que começa por "A seguir:" com o que vou fazer a seguir, deduzido dos PRs abertos ou pistas de follow-up, senão "continuar com as tarefas atuais"',
        '- Escreve apenas o texto do guião, sem markdown, sem code fences'
      ].join('\n')
    };

  const prompt = [
    'These are my commits and pull requests at work since my last standup' + (since ? ` (window: ${since} to ${until})` : '') + ':',
    '',
    'Commits:',
    ...(commitLines.length ? commitLines : ['(none)']),
    '',
    'Pull requests:',
    ...(prLines.length ? prLines : ['(none)']),
    '',
    L.rules
  ].join('\n');

  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You write concise daily standup updates for a software developer. Output plain text only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    // gpt-oss reasoning models burn tokens "thinking" before writing the
    // visible answer - a tight cap truncates to just the first heading.
    // max_completion_tokens covers both reasoning + answer with headroom.
    max_completion_tokens: 4000
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
      console.log(`[ai] Groq HTTP ${r.status}: ${text.slice(0, 400)}`);
      fs.writeFileSync('/tmp/ai-resume.txt', '');
      process.exit(0);
    }
    const data = JSON.parse(text);
    const choice = data.choices && data.choices[0] || {};
    const msg = choice.message || {};
    const out = String(msg.content || '').trim();
    if (choice.finish_reason === 'length') {
      console.log('[ai] truncated (finish_reason=length) - token budget too small, response:', JSON.stringify(out.slice(0, 200)));
      fs.writeFileSync('/tmp/ai-resume.txt', '');
      process.exit(0);
    }
    if (!out) {
      console.log('[ai] empty content - full response:');
      console.log(text.slice(0, 1500));
      fs.writeFileSync('/tmp/ai-resume.txt', '');
      process.exit(0);
    }
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