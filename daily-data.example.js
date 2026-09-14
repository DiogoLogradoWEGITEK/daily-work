if (!window.DAILY_DATA_EXAMPLE) {
  window.DAILY_DATA_EXAMPLE = {
    updatedAt: "2026-09-11T09:23:00Z",
    window: { since: "2026-09-10T15:00:00+01:00", until: "2026-09-11T09:23:00Z" },
    commits: [
      { sha: "a1b2c3d", repo: "my-app", date: "2026-09-10T16:42:00Z", headline: "feat(auth): add refresh token rotation", message: "feat(auth): add refresh token rotation\n\nRotate refresh tokens on every use, keep a small grace window to avoid killing active sessions.", url: "https://github.com/my-org/my-app/commit/a1b2c3d" },
      { sha: "d4e5f6a", repo: "my-app", date: "2026-09-10T17:18:00Z", headline: "fix(auth): honour expires_in from IdP", message: "fix(auth): honour expires_in from IdP\n\nSome providers return expires_in in milliseconds; we treated it as seconds.", url: "https://github.com/my-org/my-app/commit/d4e5f6a" },
      { sha: "b7c8d9e", repo: "my-app", date: "2026-09-10T18:03:00Z", headline: "test(auth): cover clock skew scenarios", message: "test(auth): cover clock skew scenarios", url: "https://github.com/my-org/my-app/commit/b7c8d9e" },
      { sha: "c0d1e2f", repo: "backend-api", date: "2026-09-11T08:47:00Z", headline: "chore(deps): bump pg to 8.12", message: "chore(deps): bump pg to 8.12", url: "https://github.com/my-org/backend-api/commit/c0d1e2f" },
      { sha: "f3a4b5c", repo: "backend-api", date: "2026-09-11T09:05:00Z", headline: "perf(users): add composite index on email + created_at", message: "perf(users): add composite index on email + created_at\n\nUser lookup went from 340ms to 12ms on the staging dataset.", url: "https://github.com/my-org/backend-api/commit/f3a4b5c" }
    ],
    prs: [
      { title: "Add user authentication flow", number: 142, repo: "my-app", branch: "feat/user-auth", baseBranch: "main", state: "merged", mergedAt: "2026-09-10T18:31:00Z", body: "Implements JWT-based auth with refresh tokens. Added login, refresh, and logout endpoints. Closes #140 from sprint 12." },
      { title: "Add composite index to users table", number: 97, repo: "backend-api", branch: "perf/users-index", baseBranch: "main", state: "merged", mergedAt: "2026-09-11T09:12:00Z", body: "" }
    ],
    // TODO: AI RESUME — filled by the fetch workflow (GitHub Models); page prefers it over the built-in template
    speech: ""
  };
}