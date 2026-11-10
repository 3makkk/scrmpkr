# Dependency maintenance

Renovate creates dependency PRs: patches daily, minors Mondays, majors the first Monday of each month (Europe/Berlin, 03:00–06:59). Security vulnerability PRs are allowed anytime. No automatic merges.

The `dependency-maintenance.yml` workflow runs after the existing Code Integrity Checks workflow. It only processes same-repository PRs created by `renovate[bot]`. On CI failure it can ask Codex to edit files and commit up to two repair attempts. It refuses to push workflow/configuration changes and refuses if the PR head moved.

When CI succeeds and GitHub reports the PR as clean and mergeable, it posts a deduplicated PR comment mentioning @3makkk. This is a GitHub notification, not a guaranteed mobile push notification. GitHub notification settings must allow mentions. A comment is not an approval and does not merge.

## Manual activation

1. Install the Renovate GitHub App for this repository.
2. Enable GitHub Dependency graph and Dependabot alerts (required for Renovate vulnerability alerts).
3. Add `OPENAI_API_KEY` to GitHub Actions repository secrets. API billing is separate from ChatGPT subscription.
4. Protect `main` with required CI checks, reviews as desired, and no auto-merge.
5. Enable GitHub mention notifications.
6. Merge the setup PR after reviewing workflows and running validation.

## Operational caveats

The repair workflow runs with elevated GitHub permissions after CI. Only trusted Renovate PRs should be eligible. Codex processes dependency content as untrusted input; audit security before production use. Codex runs without a guaranteed local dependency installation; if a repair is inconclusive, it will remain blocked. The workflow intentionally does not modify or approve the PR review state.

GitHub's workflow_run PR association and renovate bot identity must be tested end-to-end. A branch updated with the default GITHUB_TOKEN might not trigger downstream pull_request workflows; if that occurs, use a narrowly scoped GitHub App token and rerun CI explicitly. Do not enable automatic merging.
