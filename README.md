# daily-work

A GitHub Pages **experiment in personal activity feeds**: a static page that lists everything you committed and every PR you merged in the last day, straight from the GitHub search API, cached as JSON and rendered with zero backend.

> Disclaimer: this is a scratch repo for testing the GitHub search + Gist caching pattern. Don't expect polish.

## Features

- **Rolling daily window** - commits and merged PRs from yesterday at a configurable hour (timezone-aware) until now; the Monday run covers the weekend
- **Commit timeline** grouped by repo, chronological, each linked to the commit; commit body shown as detail line when present
- **PR cards** - repo, `branch → base`, number/title, body text (falls back to the last 5 commit headlines when no body is written), merged/open badge
- **Text digest** - client-side template builder that groups commits by repo and type (`feat` → "new", `fix` → "fixes", ...), lists merged/open PRs, one-click copy
- AI digest slot - the `speech` field in `daily-data.json` is marked `TODO: AI RESUME` (workflow + page + example data); until it is filled, a template builds the draft

## Setup

1. Create a **Gist** (any content, e.g. `daily-data.json` with `{}`) and copy its ID (the hash in the URL).
2. Create a **PAT** with `repo` + `gist` scopes.
3. Add secrets (**Settings → Secrets and variables → Actions**):

| Secret            | Description                                            | Example                   |
| ----------------- | ------------------------------------------------------ | ------------------------- |
| `GH_USER`         | GitHub handle to query                                 | `your-handle`             |
| `GH_SEARCH_SCOPE` | Search scope, space-separated `org:` / `repo:` filters | `org:my-org`              |
| `GH_TOKEN`        | PAT with `repo` + `gist` scopes - the only credential  | `ghp_...`                 |
| `GIST_ID`         | Gist ID that caches the JSON                           | `a1b2c3d4...`             |
| `STANDUP_TIME`    | Window start, `HH:MM` 24h                              | `15:00`                   |
| `STANDUP_TZ`      | IANA timezone of the window start                      | `Europe/Lisbon`           |
| `GROQ_KEY`        | Optional - Groq API key for the AI resume              | `gsk_...`                 |
| `AI_MODEL`        | Optional - Groq model id                               | `openai/gpt-oss-120b`     |

4. Enable **Settings → Pages → Source: GitHub Actions**, then push to `main`.
5. Run **Actions → Fetch Daily Work** manually once (optional `since` override for the window start).

## Local preview

Open `index.html` directly - with no `gistId` configured it loads `daily-data.example.js` mock data so you can see the layout and digest builder without any setup.

## AI resume

Optional. When the `GROQ_KEY` secret exists (free key from [console.groq.com](https://console.groq.com)), the fetch workflow sends the commit/PR headlines to Groq (`openai/gpt-oss-120b` by default, override with `AI_MODEL`) and stores a first-person standup script in the `aiResume` field. The page renders it in its own "AI Resume" section below the Speech digest. Any failure (missing key, rate limit, timeout) just leaves the field empty and the section hidden - the fetch itself is unaffected.

The resume language defaults to Portuguese (pt-PT); set the optional `AI_LANG` secret to `en` for English. Each run is an independent one-shot request - there is no conversation memory between fetches.

## Workflows

| Workflow               | Schedule                   | Purpose                                                    |
| ---------------------- | -------------------------- | ---------------------------------------------------------- |
| `deploy.yml`           | On push to `main`          | Deploys to GitHub Pages, injects secrets, stamps git SHA   |
| `fetch-daily-work.yml` | Mon-Fri 13:23 UTC + jitter | Fetches commits + PRs since the window start into the Gist |

## Notes & limitations

- The commit search API only indexes commits on the **default branch** - work on feature branches is still captured via PR commit headlines
- Squash-merged work may appear twice (squashed commit + its PR) - acceptable noise for a reading aid
- GitHub search rate limit: 30 requests/min authenticated; the workflow makes 2 requests per run
