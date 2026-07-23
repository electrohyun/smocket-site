# Contributing to smocket-site

This repository holds the landing page for [smocket](https://github.com/electrohyun/smocket). It is a single static page built with Next.js. The library's documentation lives in the smocket README; this site is only the front door.

## Getting started

This project uses [pnpm](https://pnpm.io).

```bash
git clone https://github.com/electrohyun/smocket-site.git
cd smocket-site
pnpm install
pnpm dev
```

| Command       | What it does                       |
| ------------- | ---------------------------------- |
| `pnpm dev`    | Run the dev server                 |
| `pnpm build`  | Build the static production output |
| `pnpm start`  | Serve the production build         |
| `pnpm lint`   | Lint                               |
| `pnpm format` | Format with Prettier               |

## Branches

Work happens on short-lived branches off `main`. There is no `develop` branch.

Branch names follow the commit type of the work:

```
feat/hero-section
fix/mobile-code-overflow
chore/ci
```

If an issue already exists, `gh issue develop <number> --checkout` creates and checks out a branch in one step.

## Commits

This repo follows [Conventional Commits](https://www.conventionalcommits.org).

```
<type>: <description>
```

| Type       | When to use                          |
| ---------- | ------------------------------------ |
| `feat`     | A new section or capability          |
| `fix`      | A correction to existing behavior    |
| `docs`     | README or documentation              |
| `refactor` | Restructuring with no visible change |
| `chore`    | Build config, CI, dependencies       |
| `perf`     | A change made for performance        |

Scopes are not used. An imperative description of around 70 characters is plenty. Link the issue from the pull request body rather than the subject line.

## Pull requests

Please open pull requests against `main`. Linking the issue in the body with `Closes #12` will close it on merge.

Pull requests are rebase merged, so please tidy up your commit history before asking for review. Every commit lands on `main` as-is, so following the commit conventions above helps.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
