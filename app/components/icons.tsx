/* The icons, as fragments for `IconButton`'s 24×24 svg.
 *
 * One grid and one weight for all of them: the svg supplies `stroke`,
 * `stroke-width: 2` and round caps, so nothing here sets its own and none of
 * them can drift from the others. Filled shapes say so on the element.
 *
 * Drawn rather than pulled from an icon set on purpose, for now. A library costs
 * about 1.2KB gzipped for the first icon and a tenth of that for each one after,
 * which is nothing — but it would only be worth the dependency if `ThemeToggle`
 * came with it, and that is a separate decision (TODO.md). If it is taken, this
 * file is the one place to replace.
 */

/** The word is on show. */
export const EyeIcon = (
  <>
    <path d="M2.5 12S6.1 5.5 12 5.5 21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.9" />
  </>
);

/** The word is kept, which is the round's normal state. */
export const EyeOffIcon = (
  <>
    <path d="M2.5 12S6.1 5.5 12 5.5c1.6 0 3 .5 4.2 1.1" />
    <path d="M20 8.9c1 1.6 1.5 3.1 1.5 3.1S17.9 18.5 12 18.5c-1.2 0-2.3-.3-3.3-.7" />
    <path d="M14 14a2.9 2.9 0 0 1-4-4" />
    <path d="M4 4 20 20" />
  </>
);

/** Take the pen — the drawer's seat. */
export const PencilIcon = (
  <>
    <path d="M4 20h4.2L19 9.2a2.9 2.9 0 0 0-4.2-4.2L4 15.8V20Z" />
    <path d="m14.2 5.8 4 4" />
  </>
);

/** The implementation behind the drawing round. */
export const CodeIcon = (
  <>
    <polyline points="8.5,7.5 4,12 8.5,16.5" />
    <polyline points="15.5,7.5 20,12 15.5,16.5" />
    <path d="m13.5 5-3 14" />
  </>
);

/** The implementation behind the chat exchange. */
export const ChatIcon = (
  <>
    <path d="M4 4.5h16v11H9l-5 4v-15Z" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2.8" />
  </>
);

/** Delay, which is the one control measured in time. */
export const ClockIcon = (
  <>
    <circle cx="12" cy="12" r="8.6" />
    <polyline points="12,6.8 12,12 15.8,14.4" />
  </>
);

/** Lift the recorded session out to the clipboard (a dev control). */
export const CopyIcon = (
  <>
    <rect x="8.6" y="8.6" width="11" height="11" rx="2.2" />
    <path d="M15.4 5.6v-1a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1" />
  </>
);

/** It landed on the clipboard. */
export const CheckIcon = <polyline points="4.8,12.6 9.6,17.4 19.2,6.8" />;

/** Round again, from the top. */
export const RepeatIcon = (
  <>
    <path d="M6 14.5V10a3 3 0 0 1 3-3h6.5" />
    <polygon points="15,4.2 15,9.8 19,7" fill="currentColor" stroke="none" />
    <path d="M18 9.5V14a3 3 0 0 1-3 3H8.5" />
    <polygon points="9,14.2 9,19.8 5,17" fill="currentColor" stroke="none" />
  </>
);

/** One page containing every scripted participant. */
export const SingleTabIcon = (
  <>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M3 8h18" />
    <circle cx="6" cy="6" r=".6" fill="currentColor" stroke="none" />
    <path d="M8 13h8M8 16h5" />
  </>
);

/** Several real browser tabs sharing one in-browser server. */
export const MultiTabIcon = (
  <>
    <path d="M8 4h11a2 2 0 0 1 2 2v10" />
    <path d="M6 7h11a2 2 0 0 1 2 2v9" />
    <rect x="3" y="10" width="14" height="10" rx="2" />
    <path d="M3 13h14" />
  </>
);
