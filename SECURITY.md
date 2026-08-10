# Security Policy

## Threat surface

smocket-site is a public Next.js website and interactive demonstration. It does not accept accounts, payments, or user-submitted server data. The demo runs an in-memory smocket session in the browser and does not open a real Socket.IO server.

The main security concerns are therefore:

- unexpected code execution through dependencies or the build pipeline
- cross-site scripting or unsafe rendering of content
- exposure of secrets through client bundles, logs, or deployment configuration
- unsafe links, redirects, headers, or generated metadata
- behavior that sends demo input somewhere outside the local page

A visual defect, inaccurate copy, or a mismatch between the demo and Socket.IO is normally a public bug rather than a vulnerability. Reports involving secrets, code execution, data exfiltration, or a practical browser security boundary should be handled privately.

## Supported version

Only the version currently deployed from `main` receives security fixes. There are no maintained release branches or backports.

## Reporting a vulnerability

Please report vulnerabilities privately rather than opening a public issue.

- Preferred: use GitHub private vulnerability reporting through the **Security** tab of this repository.
- Alternatively, email dev.electrohyun@gmail.com.

Include what you observed, reproduction steps, affected route or deployment, browser details when relevant, and the impact you believe is possible. You can expect an acknowledgement within a few days. This is a single-maintainer project, so remediation timelines are best-effort and will be shared with the reporter.

## Out of scope

- Vulnerabilities in smocket or Socket.IO that cannot be exploited through this site
- Denial of service that requires manually overwhelming a local development server
- Browser extensions that modify the page before React loads
- Reports based only on missing generic headers without a demonstrated impact
- Content, accessibility, responsive layout, or visual issues without a security consequence
