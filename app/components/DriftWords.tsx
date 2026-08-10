import styles from './DriftWords.module.css';

const CELL = 900;

type Item = { x: number; y: number; kw?: string; emoji?: string; size: number };

const ITEMS: Item[] = [
  { x: 60, y: 120, kw: 'emit', size: 14 },
  { x: 430, y: 80, kw: "io.to('room-1')", size: 13 },
  { x: 770, y: 150, kw: 'join', size: 14 },
  { x: 180, y: 260, kw: 'namespace', size: 13 },
  { x: 560, y: 300, kw: 'broadcast', size: 14 },
  { x: 830, y: 360, kw: 'ack', size: 13 },
  { x: 70, y: 430, kw: 'socket.id', size: 13 },
  { x: 360, y: 470, kw: '.except(sid)', size: 13 },
  { x: 660, y: 520, kw: 'connect', size: 14 },
  { x: 230, y: 600, kw: "socket.on('event')", size: 12 },
  { x: 540, y: 660, kw: 'disconnect', size: 13 },
  { x: 830, y: 650, kw: 'rooms', size: 14 },
  { x: 110, y: 760, kw: 'io.emit()', size: 13 },
  { x: 470, y: 820, kw: 'handshake', size: 13 },
  { x: 330, y: 190, emoji: '🍫', size: 24 },
  { x: 710, y: 250, emoji: '🍪', size: 22 },
  { x: 200, y: 700, emoji: '🍡', size: 24 },
  { x: 620, y: 130, emoji: '✨', size: 16 },
  { x: 480, y: 560, emoji: '🍫', size: 20 },
  { x: 780, y: 780, emoji: '🍪', size: 22 },
];

const COLS = [-1, 0, 1, 2];
const ROWS = [-1, 0, 1];

export default function DriftWords() {
  return (
    <div className={styles.drift} aria-hidden="true">
      <div className={styles.track}>
        {ROWS.map((gy) =>
          COLS.map((gx) =>
            ITEMS.map((it, i) => (
              <span
                key={`${gx}-${gy}-${i}`}
                className={it.emoji ? styles.emoji : styles.kw}
                style={{ left: gx * CELL + it.x, top: gy * CELL + it.y, fontSize: it.size }}
              >
                {it.emoji ?? it.kw}
              </span>
            ))
          )
        )}
      </div>
    </div>
  );
}
