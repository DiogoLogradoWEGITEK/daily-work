# daily-work

A lightweight GitHub Pages page that shows everything you did **since the last standup**: all your commits and your merged PRs, grouped by repo, with a ready-to-read speech draft you can copy.

Born from [DailyDevTeamOrganizer](https://github.com/) — same fetch architecture (scheduled workflow → Gist cache → static page), but focused on one person instead of the whole team.

## Features

- **Window "since last standup"** - commits and merged PRs from yesterday's standup time (timezone-aware) until now; the Monday run covers the weekend
- **Commit timeline** grouped by repo, chronological, each linked to the commit; commit body shown as detail line when present
- **PR cards** - repo, `branch → base`, number/title, body text (falls back to the last 5 commit headlines when no body is written), merged/open badge
- **Speech draft** - client-side template builder that groups commits by repo and type (`feat` → "worked on", `fix` → "fixed", ...), lists merged/open PRs, one-click copy. No AI needed
- AI speech slot - the `speech` field in `daily-data.json` is marked `TODO: AI RESUME` (workflow + page + example data); until it is filled, a no-AI template builds the draft

## Setup

1. Create a **Gist** (any content, e.g. `daily-data.json` with `{}`) and copy its ID (the hash in the URL).
2. Create a **PAT** with `repo` read + `gist` write scopes.
3. Add secrets (**Settings → Secrets and variables → Actions**):

| Secret            | Description                                                           | Example                |
| ----------------- | --------------------------------------------------------------------- | ---------------------- |
| `GH_USER`         | Your GitHub handle                                                    | `your-handle`          |
| `GH_SEARCH_SCOPE` | Search scope, space-separated `org:` / `repo:` filters                 | `org:my-org`           |
| `GH_TOKEN`        | PAT with `repo` read scope                                             | `ghp_...`              |
| `GIST_ID`         | Gist ID that caches the daily data                                     | `a1b2c3d4...`          |
| `GIST_PAT`        | PAT with `gist` write scope                                            | `github_pat_...`       |
| `STANDUP_TIME`    | Your standup time, `HH:MM` 24h                                         | `15:00`                |
| `STANDUP_TZ`      | IANA timezone of the standup                                           | `Europe/Lisbon`        |

4. Push to `main` - `deploy.yml` publishes the page; `fetch-daily-work.yml` runs Mon-Fri at 05:23 UTC (manual trigger available in **Actions → Fetch Daily Work**, with an optional `since` override).

## Local preview

Open `index.html` directly - with no `gistId` configured it loads `daily-data.example.js` mock data so you can see the layout and speech builder without any setup.

## Workflows

| Workflow               | Schedule          | Purpose                                                                |
| ---------------------- | ----------------- | ---------------------------------------------------------------------- |
| `deploy.yml`           | On push to `main` | Builds and deploys to GitHub Pages, injects secrets, stamps git SHA     |
| `fetch-daily-work.yml` | Mon-Fri 05:23 UTC | Fetches your commits + merged PRs since last standup into the Gist      |

## Notes & limitations

- The commit search API only indexes commits on the **default branch** - work on feature branches is still captured via PR commit headlines
- Squash-merged work may appear twice (squashed commit + its PR) - acceptable noise for a reading aid
- GitHub search rate limit: 30 requests/min authenticated; the workflow makes 2 requests per run
