import { Adapter } from 'smocket';
import type { TraceSink } from './trace';

/**
 * smocket's routing seam, kept intact and watched. It extends the built-in
 * `Adapter` rather than reimplementing it, so the membership bookkeeping and the
 * routing decision are still smocket's — every override calls `super` first and
 * reports what came back. Nothing here decides who receives anything, which is
 * what lets the record count as evidence (기획 §4-1).
 *
 * Register it before any client connects, since `io.adapter()` installs a fresh
 * adapter on every namespace:
 *
 *     io.adapter(() => new TraceAdapter(store));
 */
export class TraceAdapter extends Adapter {
  constructor(private readonly sink: TraceSink) {
    super();
  }

  /**
   * The routing decision. `BroadcastOperator.emit` asks twice, first for the
   * target rooms and then for the except rooms, which is where the `(except A)`
   * half of a delivery line comes from.
   */
  socketsIn(rooms: Iterable<string>): Set<string> {
    const asked = [...rooms];
    const sids = super.socketsIn(asked);
    this.sink.routed(asked, sids);
    return sids;
  }

  /**
   * Joining is not an emit, so it reaches neither `socketsIn` nor the outgoing
   * catch-all. These two are the only source a room line has (계획서 §1-1 규칙 7),
   * and `del` covers disconnect cleanup too, since teardown leaves each room
   * through the adapter.
   */
  add(sid: string, room: string): void {
    super.add(sid, room);
    this.sink.membership('add', sid, room);
  }

  del(sid: string, room: string): void {
    super.del(sid, room);
    this.sink.membership('del', sid, room);
  }
}
