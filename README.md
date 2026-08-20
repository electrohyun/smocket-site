<img width="1200" src="https://github.com/user-attachments/assets/51d07a05-c4ef-4895-bbd5-d54cb40e9b8b" />
<img width="1200" src="https://github.com/user-attachments/assets/1171d999-8e12-4503-a9d6-f5ed64e7537c" />
<img width="1200" src="https://github.com/user-attachments/assets/24ffe375-2bca-4b90-aa47-380f7680b052" />


# smocket-site

The interactive public guide for [Smocket](https://github.com/electrohyun/smocket), an in-memory Socket.IO mock for testing rooms, broadcasts, acknowledgements, and multiple clients without opening a server.

[Visit the site](https://smocket-site.vercel.app) · [Play Guess What](https://smocket-site.vercel.app/demo) · [Open the measured case study](https://smocket-site.vercel.app/case-study) · [Read the Smocket docs](https://github.com/electrohyun/smocket#readme)

<!-- Add the locally captured landing image here after uploading it to a CDN.
![smocket landing page](https://your-cdn.example/smocket-landing.png)
-->

## What lives here

- `/` explains the problem, shows the supported adoption path, links the first showcase, and summarizes only the measurements present in checked JSON.
- `/demo` is the first showcase: a three-client Guess What round with drawer and observer viewpoints, room delivery, acknowledgements, deterministic delay, replay, and a delivery trace.
- `/case-study` is the first measured report: one pinned chat-room workflow compared across Real Socket.IO 4.8.3, published Smocket 0.4.2, and a handwritten mock.
- Light, dark, and system themes share the cat, space, and rocket visual language.
- Metadata, social images, a web manifest, robots.txt, canonical routes, and a sitemap cover the public routes.

The library implementation and public API documentation live in the [smocket repository](https://github.com/electrohyun/smocket).

## How measured data reaches the page

The site does not copy report numbers into JSX.

```text
content/*-observations.json
        ↓
app/evidence/schema.ts       shared runtime boundary
        ↓
app/evidence/model.ts        landing summaries and report registry
        ↓
/ and /case-study            rendered counts, versions, limits, and links
```

The pinned chat-room record has an additional hash validator for its JSON and vendored source files. A future scenario is added to the registry as another generated record; the renderer does not need a new set of handwritten cards. Comparisons without an executable record stay marked as `Not measured yet`.

## Development

This project uses Next.js, React, TypeScript, and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the guide, [http://localhost:3000/demo](http://localhost:3000/demo) for Guess What, or [http://localhost:3000/case-study](http://localhost:3000/case-study) for the measured report.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check without emitting files |
| `pnpm test` | Run the test suite once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm seed:draw` | Regenerate the recorded drawing seed |
| `pnpm case-study:validate` | Check the pinned observation and source hashes |

## Project structure

```text
app/
├── components/       Landing report sections and shared UI
├── demo/             Guess What, playback, trace, and tests
├── case-study/       Interactive measured report and source explorer
├── evidence/         Shared observation schema, registry, and summaries
├── layout.tsx        Site metadata, fonts, and theme bootstrap
└── page.tsx          Landing page composition
content/
├── landing.ts        Landing copy and code samples
├── case-study.ts     Case-study interpretation and immutable links
└── *.json            Generated or pinned observation records
public/               Static images and icons
scripts/              Drawing seed and case-study validation tooling
```

Most landing copy belongs in `content/landing.ts`. Reusable presentation belongs in `app/components`, behavior specific to Guess What belongs in `app/demo`, and raw observation shapes must pass `app/evidence/schema.ts` before rendering.

The current case-study line counts are physical lines including comments and blanks. Do not relabel them as the newer comment-and-blank-excluding measurement definition. The page also avoids unrecorded competitor results, compatibility percentages, and speed or productivity claims.

## Contributing

Bug reports, documentation fixes, design polish, accessibility improvements, and focused demo changes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

For smocket API or delivery behavior changes, use the [library issue tracker](https://github.com/electrohyun/smocket/issues).

## License

[MIT](LICENSE)
