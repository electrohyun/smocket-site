<img width="1200" src="https://github.com/user-attachments/assets/51d07a05-c4ef-4895-bbd5-d54cb40e9b8b" />
<img width="1200" src="https://github.com/user-attachments/assets/1171d999-8e12-4503-a9d6-f5ed64e7537c" />
<img width="1200" src="https://github.com/user-attachments/assets/24ffe375-2bca-4b90-aa47-380f7680b052" />


# smocket-site

The landing page and interactive demo for [smocket](https://github.com/electrohyun/smocket), an in-memory Socket.IO mock for testing rooms, broadcasts, acknowledgements, and multiple clients without opening a server.

[Visit the site](https://smocket-site.vercel.app) · [Try the demo](https://smocket-site.vercel.app/demo) · [Read the smocket docs](https://github.com/electrohyun/smocket#readme)

<!-- Add the locally captured landing image here after uploading it to a CDN.
![smocket landing page](https://your-cdn.example/smocket-landing.png)
-->

## What lives here

- A responsive product landing page with light, dark, and system themes
- A self-playing preview backed by a real in-memory smocket round
- An interactive `/demo` with drawer and observer viewpoints
- A four-section `/case-study` about a Node.js Socket.IO mock server, Smocket, shared application code, and the production boundary
- A delivery trace that exposes rooms, recipients, exclusions, and acknowledgements
- Metadata, social images, a web manifest, robots.txt, and a sitemap

The library implementation and public API documentation live in the [smocket repository](https://github.com/electrohyun/smocket).

## Development

This project uses Next.js, React, TypeScript, and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page,
[http://localhost:3000/demo](http://localhost:3000/demo) for the interactive demo,
or [http://localhost:3000/case-study](http://localhost:3000/case-study) for the
interactive report.

The default development build runs the demo in memory by resolving
`socket.io-client` to `smocket-client`. To run the same UI against a Node.js Socket.IO server,
start the backend in one terminal:

```bash
pnpm demo:server
```

Then start Next.js in another terminal with these environment variables (PowerShell):

```powershell
$env:DEMO_SOCKET_TARGET = 'real'
$env:NEXT_PUBLIC_DEMO_SOCKET_TARGET = 'real'
$env:NEXT_PUBLIC_DEMO_SOCKET_URL = 'http://127.0.0.1:4000'
pnpm dev
```

The backend uses Node's HTTP server and port 4000 for manual development. The
integration tests use an ephemeral port instead.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm demo:server` | Start the Node.js Socket.IO demo server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check without emitting files |
| `pnpm test` | Run the test suite once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm seed:draw` | Regenerate the recorded drawing seed |

## Project structure

```text
app/
├── components/       Landing page sections and shared UI
├── case-study/       Four-section interactive report
├── demo/             Interactive demo, playback, trace, and tests
├── layout.tsx        Site metadata, fonts, and theme bootstrap
└── page.tsx          Landing page composition
content/
├── interactive-report.ts  Case study copy, selected behavior, source links, and boundaries
└── landing.ts             Landing copy and code samples
public/               Static images and icons
scripts/              Drawing seed tooling
```

Most landing copy belongs in `content/landing.ts`. Reusable presentation belongs in `app/components`, while behavior specific to the playground belongs in `app/demo`.

## Contributing

Bug reports, documentation fixes, design polish, accessibility improvements, and focused demo changes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

For smocket API or delivery behavior changes, use the [library issue tracker](https://github.com/electrohyun/smocket/issues).

## License

[MIT](LICENSE)
