/* Copy for the /demo page. Kept apart from content/landing.ts because the two
   pages are written against different documents: the landing against
   smocket-site_카피_원본.md, the demo against smocket_데모앱_기획_v2. */

export const page = {
  wordmark: 'smocket',
  mascot: {
    src: '/cat.webp',
    alt: 'smocket mascot: a cool cat wearing sunglasses',
  },
  /* The round has not been built yet. Stage 0 is the route and its tone. */
  todo: 'TODO: drawing demo',
} as const;
