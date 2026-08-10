# Contributing to smocket-site

Thanks for taking the time to contribute.

This repository holds the landing page and interactive demo for [smocket](https://github.com/electrohyun/smocket). Changes to the library API or Socket.IO delivery behavior belong in the library repository; changes to how those ideas are explained, visualized, and demonstrated belong here.

## Getting started

This project uses [pnpm](https://pnpm.io).

```bash
git clone https://github.com/electrohyun/smocket-site.git
cd smocket-site
pnpm install
pnpm dev
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check without emitting files |
| `pnpm test` | Run the test suite once |
| `pnpm test:watch` | Run tests in watch mode |

## Before changing behavior

The landing preview and `/demo` run real smocket rounds. A visual change can still alter playback, routing, trace output, or canvas behavior. Please preserve the distinction between recorded drawing input and live in-memory routing.

If a change proposes a new smocket capability rather than a new way to demonstrate an existing capability, open it in the [smocket issue tracker](https://github.com/electrohyun/smocket/issues).

## Branches and commits

Work happens on short-lived branches off `main`. There is no `develop` branch.

```text
feat/interactive-trace
fix/mobile-code-overflow
docs/readme-preview
chore/ci
```

This repository follows [Conventional Commits](https://www.conventionalcommits.org).

```text
<type>: <description>
```

| Type | When to use |
| --- | --- |
| `feat` | A new section or user-visible capability |
| `fix` | A correction to existing behavior or presentation |
| `test` | Test cases or fixtures |
| `docs` | README or contributor documentation |
| `refactor` | Restructuring with no visible change |
| `chore` | Build config, CI, dependencies, or tooling |
| `perf` | A measurable performance improvement |

## Pull requests

Open pull requests against `main` and link the related issue with `Closes #12` when applicable.

Before asking for review:

- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`
- Run `pnpm build` for routing, dependency, or production-rendering changes
- Check the landing page at desktop and narrow mobile widths
- Check both light and dark themes when shared colors or tokens change
- Respect `prefers-reduced-motion` when adding motion
- Verify `/demo` separately when changing shared components or demo code

Pull requests are rebase merged, so every commit lands on `main` as written.

## Reporting bugs

Use the Bug report template and include the route, viewport, theme, browser, and reproduction steps. A screenshot or short recording is especially useful for visual and responsive issues.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
