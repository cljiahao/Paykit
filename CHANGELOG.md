# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Real "Get help" support form**, replacing the mailto-link interim
  pattern — files into the shared cross-kit `merqo.support_messages`
  inbox (Merqo team picks it up in `/admin`), same pattern qkit's own
  local support form uses, now shared infrastructure any kit can call.

### Fixed

- Dashboard account menu was missing the dropdown chevron qkit/loopkit both
  show, and the nav wordmark used the generic (still shadcn-default,
  near-black) `--primary` token instead of paykit's own mint brand color
  already used everywhere else (landing wordmark, hero, icons).

### Docs

- Added the `src/lib/`, `src/lib/payments/`, `src/lib/supabase/`,
  `src/components/`, `src/components/landing/`, and `src/components/ui/`
  `README.md` files — previously bypassed via the `skip-readme-check`
  label on prior PRs that touched those folders.
