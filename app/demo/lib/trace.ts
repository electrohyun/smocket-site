/* The delivery record. Every line on it comes from one of four sources, and
   which source is which is the whole point of the demo (계획서 §1):

     routing (who it reached, who was excluded)  TraceAdapter.socketsIn
     event name, payload, actual recipient       socket.onAnyOutgoing
     room join / leave                           TraceAdapter.add / del
     the call form, and ack answers              the game code, declared

   The first three are smocket observing itself. The last one is a label the
   game code hands over, because neither the adapter nor the outgoing catch-all
   can see how a broadcast was spelled — the adapter is given a set of room
   names, not the expression that produced it. Since the label is asserted
   rather than measured, `declared` is checked against what the adapter actually
   routed, and a line whose two halves disagree carries the mismatch instead of
   quietly reading as evidence. */

export type SocketLabel = string;

/** A room as it appears in a call: a plain room, or a socket's id-room. */
export type RoomToken = { kind: 'room'; name: string } | { kind: 'sid'; label: SocketLabel };

/** What the game code declares about a call, being the part nothing observes. */
export interface CallForm {
  /** Set when the call went through a socket (`socket.to(...)`), absent for `io.*`. */
  from?: SocketLabel;
  /** Rooms named in the call. Omitted for a room-less `io.emit()`. */
  to?: string[];
}

export interface DeliveryLine {
  kind: 'delivery';
  from?: SocketLabel;
  rooms: RoomToken[];
  event: string;
  args: unknown[];
  reached: SocketLabel[];
  excluded: SocketLabel[];
  /** Set when the declared call and the routed rooms disagree; see the header. */
  mismatch?: string;
}

export interface MembershipLine {
  kind: 'membership';
  op: 'add' | 'del';
  socket: SocketLabel;
  room: string;
}

/**
 * An event a client sent to the server. It is a delivery too, but not one the
 * adapter routes — nothing is fanned out and no room is consulted — so it gets
 * its own line rather than a reach list it would have to invent. This is where
 * what the user fires shows up (기획 §4).
 */
export interface InboundLine {
  kind: 'inbound';
  from: SocketLabel;
  event: string;
  args: unknown[];
}

export interface AckLine {
  kind: 'ack';
  to: SocketLabel;
  value: unknown;
}

export interface LifecycleLine {
  kind: 'lifecycle';
  text: string;
}

export type TraceLine = DeliveryLine | InboundLine | MembershipLine | AckLine | LifecycleLine;

/** One `socketsIn` call: the rooms it was asked about and the sids it answered. */
interface Routed {
  rooms: string[];
  sids: Set<string>;
}

interface OpenDelivery {
  declared: CallForm;
  routed: Routed[];
  reached: { sid: string; event: string; args: unknown[] }[];
}

/** The half of the store the adapter writes to; see `TraceAdapter`. */
export interface TraceSink {
  routed(rooms: string[], sids: Set<string>): void;
  membership(op: 'add' | 'del', sid: string, room: string): void;
}

/** A socket with the outgoing catch-all, which is both socket sides. */
interface Outgoing {
  onAnyOutgoing(listener: (...args: unknown[]) => void): void;
}

export class TraceStore implements TraceSink {
  private readonly rows: TraceLine[] = [];
  private readonly labels = new Map<string, SocketLabel>();
  private readonly sids = new Map<SocketLabel, string>();
  private open: OpenDelivery | null = null;
  private readonly listeners = new Set<() => void>();

  /**
   * A copy of the log, rebuilt only after something is appended.
   *
   * Returning the live array instead would be the obvious thing and is wrong: it
   * is mutated in place, so its identity never changes, and a subscriber that
   * compares snapshots by identity — `useSyncExternalStore` does — concludes
   * nothing happened and stops re-rendering after the first paint. The cache is
   * what keeps a snapshot stable between changes, which that hook also requires.
   */
  private snapshot: readonly TraceLine[] = [];
  private stale = false;

  lines(): readonly TraceLine[] {
    if (this.stale) {
      this.snapshot = [...this.rows];
      this.stale = false;
    }
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Give a sid its display label, so every line can read `A` rather than a sid. */
  name(sid: string, label: SocketLabel): void {
    this.labels.set(sid, label);
    this.sids.set(label, sid);
  }

  labelOf(sid: string): SocketLabel {
    return this.labels.get(sid) ?? sid.slice(0, 4);
  }

  /**
   * The first four of a label's real sid, shown dim beside the label so the name
   * is not taken on faith — a label with an actual identifier behind it (기획 §4).
   */
  sidHint(label: SocketLabel): string {
    return (this.sids.get(label) ?? '').slice(0, 4);
  }

  /**
   * Record what a server socket sends to its client. A broadcast fans out into
   * one of these per recipient, which is how a delivery learns its event name,
   * its payload, and who actually got it.
   */
  watch(sid: string, socket: Outgoing): void {
    socket.onAnyOutgoing((event, ...args) => {
      this.open?.reached.push({ sid, event: String(event), args });
    });
  }

  /**
   * Record what a client sends to the server. It never rides a broadcast, so it
   * lands as its own line instead of joining whatever delivery happens to be open.
   */
  watchClient(label: SocketLabel, socket: Outgoing): void {
    socket.onAnyOutgoing((event, ...args) => {
      this.push({ kind: 'inbound', from: label, event: String(event), args });
    });
  }

  /**
   * Run one broadcast with the record open, so the adapter's routing decision and
   * the recipients' catch-alls land on the same line as the declared call. The
   * whole of `BroadcastOperator.emit` is synchronous — two `socketsIn` calls, then
   * a delivery per recipient — so the scope closes with everything in hand and
   * two deliveries can never interleave into one line.
   */
  deliver<T>(declared: CallForm, run: () => T): T {
    this.open = { declared, routed: [], reached: [] };
    try {
      return run();
    } finally {
      const delivery = this.open;
      this.open = null;
      if (delivery) this.close(delivery);
    }
  }

  /** The answer to an ack. Nothing observes it, so the game code hands it over. */
  ack(to: SocketLabel, value: unknown): void {
    this.push({ kind: 'ack', to, value });
  }

  /** Connect / disconnect, which the outgoing catch-all skips as reserved (계획서 §1-3). */
  lifecycle(text: string): void {
    this.push({ kind: 'lifecycle', text });
  }

  routed(rooms: string[], sids: Set<string>): void {
    this.open?.routed.push({ rooms, sids: new Set(sids) });
  }

  membership(op: 'add' | 'del', sid: string, room: string): void {
    // Every socket is put in a room named after its own id on connect. That is
    // bookkeeping, not a join anyone made, so it stays off the record.
    if (room === sid) return;
    this.push({ kind: 'membership', op, socket: this.labelOf(sid), room });
  }

  private close(delivery: OpenDelivery): void {
    const { declared, routed, reached } = delivery;
    if (reached.length === 0 && routed.length === 0) return;

    // `emit` asks the adapter for the target rooms and then for the except rooms.
    // A room-less broadcast (`io.emit`, `socket.broadcast`) skips the first ask,
    // since "everyone" needs no lookup, and leaves only the except one.
    const [target, except] = routed.length >= 2 ? [routed[0], routed[1]] : [undefined, routed[0]];

    const excluded: SocketLabel[] = [];
    for (const sid of except?.sids ?? []) {
      if (!target || target.sids.has(sid)) excluded.push(this.labelOf(sid));
    }

    const seen = new Set<string>();
    const order: SocketLabel[] = [];
    for (const hit of reached) {
      if (seen.has(hit.sid)) continue;
      seen.add(hit.sid);
      order.push(this.labelOf(hit.sid));
    }

    const first = reached[0];
    this.push({
      kind: 'delivery',
      from: declared.from,
      rooms: (declared.to ?? []).map((room) => this.token(room)),
      event: first?.event ?? '',
      args: first?.args ?? [],
      reached: order,
      excluded,
      mismatch: this.disagreement(declared, target, except),
    });
  }

  /**
   * Compare the declared call against what the adapter was actually asked to
   * route. It catches the drift the label alone cannot: a call that says one room
   * and broadcasts to another, or a `socket.to()` whose sender is not the one the
   * except set names.
   */
  private disagreement(
    declared: CallForm,
    target: Routed | undefined,
    except: Routed | undefined,
  ): string | undefined {
    const said = [...(declared.to ?? [])].sort();
    const did = [...(target?.rooms ?? [])].sort();
    if (said.join() !== did.join()) {
      return `declared to [${said.join(', ')}], routed [${did.join(', ')}]`;
    }

    // `socket.to(room)` excludes the sender by putting its id-room in the except
    // set, so a declared sender must show up there and an undeclared one must not.
    const senders = (except?.rooms ?? []).filter((room) => this.labels.has(room));
    const excludedSenders = senders.map((sid) => this.labelOf(sid));
    const declaredSender = declared.from ? [declared.from] : [];
    if (excludedSenders.join() !== declaredSender.join()) {
      return `declared from [${declaredSender.join(', ')}], excluded [${excludedSenders.join(', ')}]`;
    }

    return undefined;
  }

  private token(room: string): RoomToken {
    return this.labels.has(room)
      ? { kind: 'sid', label: this.labelOf(room) }
      : { kind: 'room', name: room };
  }

  private push(line: TraceLine): void {
    this.rows.push(line);
    this.stale = true;
    for (const listener of this.listeners) listener();
  }
}

export interface FormatOptions {
  /**
   * Hide the word being drawn. The observer is not supposed to know it, so the
   * payload of `word` reads as `'****'` until the control panel reveals it (기획 §4).
   */
  maskWord?: boolean;
}

/** The call as it was made: `socket_A.to('room-1').emit('stroke', {…})`. */
export function formatCall(line: DeliveryLine, options: FormatOptions = {}): string {
  const receiver = line.from ? `socket_${line.from}` : 'io';
  const rooms = line.rooms.map(formatRoom).join(', ');
  const to = line.rooms.length > 0 ? `.to(${rooms})` : '';
  const payload = line.args.map((arg) => formatArg(arg, line.event, options));
  return `${receiver}${to}.emit(${["'" + line.event + "'", ...payload].join(', ')})`;
}

/** Who it reached, and who it was kept from: `→ B, C  (except A)`. */
export function formatReach(line: DeliveryLine): string {
  const reached = line.reached.length > 0 ? line.reached.join(', ') : '(none)';
  const except = line.excluded.length > 0 ? `  (except ${line.excluded.join(', ')})` : '';
  return `→ ${reached}${except}`;
}

/** An ack answer, pointed the other way so it never reads as a delivery (계획서 §1-2). */
export function formatAck(line: AckLine): string {
  return `← ack ${line.to} ${formatValue(line.value)}`;
}

/** What a client sent: `client_B.emit('guess', '기린')`. */
export function formatInbound(line: InboundLine, options: FormatOptions = {}): string {
  const payload = line.args.map((arg) => formatArg(arg, line.event, options));
  return `client_${line.from}.emit(${["'" + line.event + "'", ...payload].join(', ')})`;
}

export function formatMembership(line: MembershipLine): string {
  return `${line.socket} ${line.op === 'add' ? 'joined' : 'left'} ${line.room}`;
}

function formatRoom(room: RoomToken): string {
  return room.kind === 'sid' ? `sid_${room.label}` : `'${room.name}'`;
}

function formatArg(arg: unknown, event: string, options: FormatOptions): string {
  if (event === 'word' && options.maskWord) return "'****'";
  return formatValue(arg);
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return `'${value}'`;
  if (value === null || typeof value !== 'object') return String(value);
  return '{…}';
}
