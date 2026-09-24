if (!window.DAILY_DATA_EXAMPLE) {
  window.DAILY_DATA_EXAMPLE = {
    updatedAt: "2026-09-11T09:23:00Z",
    window: { since: "2026-09-10T15:00:00+01:00", until: "2026-09-11T09:23:00Z" },
    commits: [
      { sha: "a1b2c3d", repo: "my-app", branch: "feat/user-auth", date: "2026-09-10T16:42:00Z", headline: "feat(auth): add refresh token rotation", message: "feat(auth): add refresh token rotation\n\nRotate refresh tokens on every use, keep a small grace window to avoid killing active sessions.", url: "https://github.com/my-org/my-app/commit/a1b2c3d" },
      { sha: "d4e5f6a", repo: "my-app", branch: "feat/user-auth", date: "2026-09-10T17:18:00Z", headline: "fix(auth): honour expires_in from IdP", message: "fix(auth): honour expires_in from IdP\n\nSome providers return expires_in in milliseconds; we treated it as seconds.", url: "https://github.com/my-org/my-app/commit/d4e5f6a" },
      { sha: "b7c8d9e", repo: "my-app", branch: "feat/user-auth", date: "2026-09-10T18:03:00Z", headline: "test(auth): cover clock skew scenarios", message: "test(auth): cover clock skew scenarios", url: "https://github.com/my-org/my-app/commit/b7c8d9e" },
      { sha: "c0d1e2f", repo: "backend-api", branch: "main", date: "2026-09-11T08:47:00Z", headline: "chore(deps): bump pg to 8.12", message: "chore(deps): bump pg to 8.12", url: "https://github.com/my-org/backend-api/commit/c0d1e2f" },
      { sha: "f3a4b5c", repo: "backend-api", branch: "perf/users-index", date: "2026-09-11T09:05:00Z", headline: "perf(users): add composite index on email + created_at", message: "perf(users): add composite index on email + created_at\n\nUser lookup went from 340ms to 12ms on the staging dataset.", url: "https://github.com/my-org/backend-api/commit/f3a4b5c" }
    ],
    prs: [
      { title: "Add user authentication flow", number: 142, repo: "my-app", branch: "feat/user-auth", baseBranch: "main", state: "merged", mergedAt: "2026-09-10T18:31:00Z", body: "Implements JWT-based auth with refresh tokens. Added login, refresh, and logout endpoints. Closes #140 from sprint 12." },
      { title: "Add composite index to users table", number: 97, repo: "backend-api", branch: "perf/users-index", baseBranch: "main", state: "merged", mergedAt: "2026-09-11T09:12:00Z", body: "" }
    ],
    // TODO: AI RESUME — aiResume is filled by the fetch workflow (Groq) when GROQ_KEY is set;
    // the page shows it in its own section below the Speech digest
    aiResume: "Commits:\n- Added refresh token rotation to the auth flow in my-app, tokens now rotate on every use with a small grace window for active sessions\n- Fixed the session expiry handling for mobile Safari in my-app, some IdPs return expires_in in milliseconds\n- Covered the clock skew scenarios with tests in my-app\n- Bumped pg to 8.12 in backend-api and added a composite index on email + created_at, user lookup went from 340ms to 12ms\n\nPull requests:\n- Merged #142 in my-app, the JWT auth flow with login, refresh and logout endpoints\n- Merged #97 in backend-api, the composite users index\n\nNext: roll the auth changes out to the mobile clients and watch the refresh token metrics for a day",
    speech: ""
  };
}