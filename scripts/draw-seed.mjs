/* Authors app/demo/lib/seed.json — the recorded round the demo replays.
 *
 * The drawing is described here as control points and turned into the same
 * segment stream a live pointer would produce, so the seed is indistinguishable
 * from a recorded round: normalised coordinates, a rising id per stroke, points
 * coalesced into a segment every FLUSH_MS, and `end` on the last one.
 *
 * Design space is the drawer's canvas at desktop (1271x693, ~1.834:1). Coords
 * normalise per axis and nothing preserves aspect, so a narrower canvas only
 * makes the giraffe more slender — the forgiving direction for this subject.
 *
 * Stroke ORDER carries the demo's argument: each phase is the moment a wrong
 * guess stops being wrong for a new reason. Body, then four legs (a horse?),
 * then the long neck (a deer!), then the head, then the ossicones (those
 * aren't antlers), then the spots (giraffe). bots.ts fires on these boundaries.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const SEED_PATH = new URL('../app/demo/lib/seed.json', import.meta.url);
// `--preview <dir>` also rasterises the picture at each phase boundary, which is
// the only way to check that a wrong guess is still a fair one at the moment it
// is said. Off by default: the previews are a working aid, not an artefact.
const previewAt = process.argv.indexOf('--preview');
const previewDir = previewAt === -1 ? null : process.argv[previewAt + 1];

const W = 1271;
const H = 693;

const round = (v) => Number(v.toFixed(1));

const FLUSH_MS = 40;
const SAMPLE_MS = 16; // pointer rate
const SPEED = 1100; // px/s, a confident sketch
/* A floor on how long one stroke takes. Without it, spacing is a fixed number of
   pixels and a small closed shape gets only three or four samples — an ossicone
   knob comes out a pennant and the tail tuft a diamond. A hand slows down for a
   small detail, so the sampling has to be per-stroke time, not per-stroke length. */
const MIN_STROKE_MS = 260;
const PLACES = 4;

/* ---------- the giraffe ---------- */
// `closed` loops back to the first point. `phase` groups strokes into the beats
// the bots react to.

const STROKES = [
  // --- body: a shapeless blob on its own ---
  {
    phase: 'body',
    closed: true,
    pts: [
      [600, 478], [612, 440], [628, 398], [630, 378], [600, 368], [555, 362],
      [505, 365], [462, 375], [428, 392], [412, 420], [415, 455], [440, 480],
      [490, 492], [545, 492], [580, 486],
    ],
  },

  // --- legs + tail: now it is a four-legged animal ---
  // Front legs hang from the chest, so they start on the belly line (y~478-490)
  // rather than off the front of it, where they would read as detached.
  { phase: 'legs', pts: [[578, 488], [584, 550], [580, 612], [578, 648], [592, 651]] },
  { phase: 'legs', pts: [[604, 476], [612, 542], [608, 606], [606, 642], [620, 645]] },
  { phase: 'legs', pts: [[452, 486], [444, 548], [450, 606], [448, 648], [462, 651]] },
  { phase: 'legs', pts: [[486, 490], [480, 548], [484, 604], [482, 644], [496, 647]] },
  { phase: 'legs', pts: [[416, 408], [398, 450], [386, 496], [390, 528]] },
  // The tuft overlaps the tail's last point; a gap here reads as a dropped box.
  {
    phase: 'legs',
    closed: true,
    pts: [[398, 524], [396, 535], [390, 542], [383, 538], [380, 528], [385, 520], [393, 519]],
  },

  // --- neck: the long neck arrives, and a deer is a fair guess ---
  {
    phase: 'neck',
    pts: [[630, 378], [656, 330], [684, 278], [712, 222], [736, 172], [748, 146]],
  },
  {
    phase: 'neck',
    pts: [[588, 366], [612, 318], [640, 264], [668, 208], [696, 152], [716, 126]],
  },

  // --- head: still deer-shaped ---
  {
    phase: 'head',
    pts: [
      [716, 126], [734, 110], [762, 104], [790, 110], [826, 124], [852, 140],
      [862, 152], [852, 164], [826, 168], [792, 164], [766, 158], [748, 146],
    ],
  },
  { phase: 'head', closed: true, pts: [[720, 124], [700, 110], [694, 122], [708, 131]] },
  { phase: 'head', closed: true, pts: [[774, 128], [780, 124], [784, 130], [778, 134]] },

  // --- ossicones: a stem and a knob, which is exactly what an antler is not ---
  // Stem and knob are separate strokes. Drawn as one polyline the spline rounds
  // the corner into a pennant, and a pennant on a stalk reads as an antenna.
  { phase: 'horns', pts: [[742, 104], [740, 92]] },
  {
    phase: 'horns',
    closed: true,
    pts: [[746, 84], [743, 90], [737, 92], [732, 88], [731, 82], [735, 77], [742, 78]],
  },
  { phase: 'horns', pts: [[768, 100], [766, 88]] },
  {
    phase: 'horns',
    closed: true,
    pts: [[773, 80], [770, 86], [764, 88], [759, 84], [758, 78], [762, 73], [769, 74]],
  },

  // --- spots: the giveaway ---
  ...spots(),
];

/** Irregular closed blobs. Deterministic — a seed committed to a repo cannot roll dice. */
function spots() {
  const placed = [
    [470, 410, 23], [520, 398, 20], [568, 405, 19], [452, 452, 20],
    [508, 452, 21], [560, 450, 18], [600, 420, 16],
    [626, 346, 15], [652, 296, 15], [678, 244, 14], [706, 190, 13],
  ];
  let seed = 20260806;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  return placed.map(([cx, cy, r]) => {
    const sides = 5 + Math.floor(rand() * 2);
    const turn = rand() * Math.PI * 2;
    const pts = [];
    for (let i = 0; i < sides; i += 1) {
      const a = turn + (i / sides) * Math.PI * 2;
      const rr = r * (0.72 + rand() * 0.5);
      pts.push([round(cx + Math.cos(a) * rr), round(cy + Math.sin(a) * rr * 0.92)]);
    }
    return { phase: 'spots', closed: true, pts };
  });
}

/* ---------- fit to the canvas ---------- */
// The design above is drawn at whatever size read well while placing points; this
// scales it uniformly to fill the canvas and centres it, so the proportions stay
// hand-set and the framing stays a single number.

const FILL = 0.9;

(function fit() {
  const all = STROKES.flatMap((s) => s.pts);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const k = Math.min((W * FILL) / (x1 - x0), (H * FILL) / (y1 - y0));
  const dx = (W - (x1 - x0) * k) / 2 - x0 * k;
  const dy = (H - (y1 - y0) * k) / 2 - y0 * k;
  for (const s of STROKES) s.pts = s.pts.map(([x, y]) => [x * k + dx, y * k + dy]);
})();

/* ---------- control points -> a pointer path ---------- */

/** Catmull-Rom through the control points; closed loops wrap. */
function spline(pts, closed) {
  const p = closed ? [...pts, pts[0]] : pts;
  const at = (i) => p[Math.max(0, Math.min(p.length - 1, i))];
  const wrap = (i) => (closed ? p[(i + p.length - 1) % (p.length - 1)] : at(i));

  const out = [];
  for (let i = 0; i < p.length - 1; i += 1) {
    const p0 = closed ? wrap(i - 1) : at(i - 1);
    const [p1, p2] = [p[i], p[i + 1]];
    const p3 = closed ? wrap(i + 2) : at(i + 2);
    const steps = 24;
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(p[p.length - 1]);
  return out;
}

const pathLength = (path) => {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  }
  return total;
};

/** Resample by arc length at the spacing a pointer would report at SPEED. */
function resample(path, spacing) {
  const out = [path[0]];
  let carry = 0;
  for (let i = 1; i < path.length; i += 1) {
    const [ax, ay] = path[i - 1];
    const [bx, by] = path[i];
    const d = Math.hypot(bx - ax, by - ay);
    if (d === 0) continue;
    let t = spacing - carry;
    while (t <= d) {
      out.push([ax + ((bx - ax) * t) / d, ay + ((by - ay) * t) / d]);
      t += spacing;
    }
    carry = (carry + d) % spacing;
  }
  const last = path[path.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > 1) out.push(last);
  return out;
}

/* ---------- emit ---------- */

const norm = (v, extent) => Number(Math.min(1, Math.max(0, v / extent)).toFixed(PLACES));

const events = [];
const phaseEnds = {};
let at = 500;
let id = 0;

for (const stroke of STROKES) {
  id += 1;
  const curve = spline(stroke.pts, stroke.closed);
  const length = pathLength(curve);
  const took = Math.max(MIN_STROKE_MS, (length / SPEED) * 1000);
  const path = resample(curve, length / Math.max(2, Math.round(took / SAMPLE_MS)));
  const perSegment = Math.max(1, Math.round(FLUSH_MS / SAMPLE_MS));

  const segments = [];
  for (let i = 0; i < path.length; i += perSegment) {
    segments.push(path.slice(i, i + perSegment).map(([x, y]) => [norm(x, W), norm(y, H)]));
  }

  segments.forEach((pts, i) => {
    at += FLUSH_MS;
    const last = i === segments.length - 1;
    events.push({ at, event: 'stroke', args: [last ? { id, pts, end: true } : { id, pts }] });
  });

  at += 210; // the pause between strokes
  // Completed strokes, not segments: `commit` counts a stroke only on the segment
  // carrying `end`, so this is the number bots.ts `afterStrokes` compares against.
  phaseEnds[stroke.phase] = id;
}

const session = { version: 1, word: 'giraffe', duration: at + 800, events };

// One event per line: this file is generated and read by humans only in diffs.
const json = `{
  "version": 1,
  "word": "giraffe",
  "duration": ${session.duration},
  "events": [
${events.map((e) => `    ${JSON.stringify(e)}`).join(',\n')}
  ]
}
`;
writeFileSync(SEED_PATH, json);

console.log(`${events.length} segments, ${id} strokes, ${session.duration}ms`);
console.log('phase ends, in completed strokes — bots.ts afterStrokes:', phaseEnds);

/* ---------- preview ---------- */
// Rasterised here rather than in a browser so the picture can be checked without
// a live page. Same ink, background and 2.5px round stroke as Canvas.tsx.

function raster(upTo, file) {
  const bg = [0x12, 0x14, 0x1c];
  const ink = [0xe9, 0xeb, 0xf4];
  const cov = new Float32Array(W * H);
  const radius = 1.25;

  const open = new Map();
  for (const e of events.slice(0, upTo)) {
    const s = e.args[0];
    const prev = open.get(s.id) ?? [];
    const pts = [...prev, ...s.pts.map(([x, y]) => [x * W, y * H])];
    open.set(s.id, pts);
  }

  for (const pts of open.values()) {
    for (let i = 1; i < pts.length; i += 1) stamp(cov, pts[i - 1], pts[i], radius);
  }

  const raw = Buffer.alloc((W * 3 + 1) * H);
  let o = 0;
  for (let y = 0; y < H; y += 1) {
    raw[o++] = 0;
    for (let x = 0; x < W; x += 1) {
      const a = Math.min(1, cov[y * W + x]);
      for (let c = 0; c < 3; c += 1) raw[o++] = Math.round(bg[c] + (ink[c] - bg[c]) * a);
    }
  }
  writeFileSync(join(previewDir, file), png(raw, W, H));
}

function stamp(cov, a, b, r) {
  const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0]) - r - 1));
  const x1 = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0]) + r + 1));
  const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1]) - r - 1));
  const y1 = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1]) + r + 1));
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len2));
      const d = Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy));
      const c = Math.max(0, Math.min(1, r + 0.5 - d));
      const i = y * W + x;
      if (c > cov[i]) cov[i] = c;
    }
  }
}

function png(raw, w, h) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let table = null;
function crc32(buf) {
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

if (previewDir) {
  // `phaseEnds` counts strokes; the raster needs the event index that stroke ends on.
  const endsAt = (strokes) => {
    let seen = 0;
    for (let i = 0; i < events.length; i += 1) {
      if (events[i].args[0].end && (seen += 1) === strokes) return i + 1;
    }
    return events.length;
  };
  for (const [phase, end] of Object.entries(phaseEnds)) raster(endsAt(end), `phase-${phase}.png`);
  raster(events.length, 'phase-final.png');
  console.log(`previews written to ${previewDir}`);
}
