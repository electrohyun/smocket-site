import styles from './Fireworks.module.css';

/* Fireworks over the win, in the colours the page already uses: the winner's
 * own green, the accent both pages share, and the cream the stars are drawn in.
 *
 * Every spark is a span with its own vector, and the CSS flies it. That keeps
 * this to transform and opacity, which the compositor can do without touching
 * layout — the round is still drawing underneath, and this must not cost it a
 * frame. No canvas, no library, nothing to tear down: the parent unmounts the
 * whole thing when the announcement is over.
 *
 * The scatter is seeded rather than random. A demo that films differently on
 * every take is the same objection the bot script answers (기획 §6), and a fixed
 * pattern is one that can be looked at twice while deciding whether it is good.
 */

/** Where each burst goes off, as a percentage of the drawing, and when. */
const BURSTS = [
  { x: 31, y: 40, delay: 0 },
  { x: 69, y: 32, delay: 0.26 },
  { x: 50, y: 55, delay: 0.5 },
];

const TINTS = ['var(--sock-b)', 'var(--accent)', '#ffe9c4'];
const PER_BURST = 16;

interface Spark {
  key: string;
  x: number;
  y: number;
  /** The apex, still travelling out; the bend between here and the end is the arc. */
  mx: number;
  my: number;
  dx: number;
  dy: number;
  delay: number;
  size: number;
  tint: string;
}

const SPARKS: Spark[] = (() => {
  let seed = 20260807;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  return BURSTS.flatMap((burst, b) =>
    Array.from({ length: PER_BURST }, (_, i) => {
      // Evenly spaced and then nudged: a perfect ring reads as a diagram. The
      // reach varies more than the angle does, because a burst where every
      // spark travels the same distance is the same diagram at a larger size.
      const angle = (i / PER_BURST) * Math.PI * 2 + (rand() - 0.5) * 0.7;
      const reach = 44 + rand() * 92;
      const dx = Math.cos(angle) * reach;
      const dy = Math.sin(angle) * reach;

      return {
        key: `${b}-${i}`,
        x: burst.x,
        y: burst.y,
        mx: dx * 0.58,
        my: dy * 0.58 - 7,
        dx,
        // Gravity only shows on the way out, which is all the eye needs.
        dy: dy + 44,
        // Spread within the burst too, so the sparks do not expand in lockstep.
        delay: Number((burst.delay + rand() * 0.19).toFixed(3)),
        size: 3 + Math.round(rand() * 3),
        tint: TINTS[(i + b) % TINTS.length],
      };
    }),
  );
})();

export default function Fireworks() {
  return (
    <div className={styles.sky} aria-hidden="true">
      {SPARKS.map((spark) => (
        <span
          key={spark.key}
          className={styles.spark}
          style={
            {
              left: `${spark.x}%`,
              top: `${spark.y}%`,
              '--mx': `${spark.mx.toFixed(1)}px`,
              '--my': `${spark.my.toFixed(1)}px`,
              '--dx': `${spark.dx.toFixed(1)}px`,
              '--dy': `${spark.dy.toFixed(1)}px`,
              '--delay': `${spark.delay}s`,
              '--size': `${spark.size}px`,
              '--tint': spark.tint,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
