# smocket-site — 카피 원본

> 작성: 2026.08.04
> 성격: **이 문서가 랜딩 페이지 모든 문구의 유일한 출처.** 여기 없는 문구는 지어내지 말고 `TODO(hyun)`으로 남길 것.
> 표기: `[확정]` = 그대로 사용 / `[선택]` = 기현이 하나 고를 것 / `[TODO]` = 재료 없음
> 언어: 영어 (README 영어 방침과 일관). 한국어 주석은 기현 검토용이며 페이지에 넣지 않는다.

---

## 1. Hero

### H1 `[선택]` — 하나 고를 것

A. `socket.io delivery semantics, in memory.`
  → 정체성 그대로. 대신 "delivery semantics"를 모르는 사람에게는 안 읽힘

B. `Test socket.io without a server.`
  → 가장 즉시 이해됨. 대신 "그냥 목이네"로 읽힐 여지

C. `The mock that delivers like the real thing.`
  → 배달 + 충실도를 한 번에. 대신 다소 광고체

### 서브 1문장 `[확정]`

```
smocket reimplements socket.io's rooms, broadcasts, and acknowledgements
in memory — and every release is verified against the real library.
```

### 칩 한 줄 `[TODO]`

```
MIT · v0.4.0 · dual-run CI
```

→ 버전은 릴리스 시점에 맞출 것. 라이선스 표기가 레포와 일치하는지 확인 필요.

### CTA `[확정]`

- `Read the docs`
- `View on GitHub`

### 태그라인 `[확정]` — 푸터 또는 워드마크 옆

```
Sweet setup, rocket speed.
```

---

## 2. Trace 섹션

### 섹션 제목 `[확정]`

```
See who received what.
```

### 설명 1줄 `[확정]`

```
Rooms, exclusions, and targeted emits resolve exactly the way socket.io
resolves them. Here is the delivery record.
```

### 본문 `[확정]` — 하드코딩, 그대로

```
io.to('room-1').except(sid_A).emit('stroke', { … })
  → B, C   (except A)

io.to(sid_A).emit('word', 'giraffe')
  → A

io.to('room-1').emit('chat', { … })
  → A, B, C
```

---

## 3. Pain 섹션

### 섹션 제목 `[확정]`

```
Before, a second player was out of reach.
```

### 좌측 라벨 `[확정]`

```
Hand-written mock
```

### 좌측 코드 `[TODO]`

```
TODO(hyun): 폴리카소 MockSocket 발췌
```

→ 실제 커밋에 있는 코드에서 가져올 것. 요약하거나 다시 쓰지 말고 원문 발췌.

### 우측 라벨 `[확정]`

```
smocket
```

### 우측 코드 `[선택]` — 실제 API와 대조 후 확정할 것

```ts
import { Server } from 'smocket';

const io = new Server();
const [a, b, c] = await Promise.all([
  connect(io.url),
  connect(io.url),
  connect(io.url),
]);
```

→ **현재 공개 API 표면과 일치하는지 확인 필요.** ADR 0014(`connect(url)`)와 대조.

### 하단 캡션 `[확정]`

```
190 lines of hand-written mock, and still only one player could connect.
```

---

## 4. Features — 카드 4개 `[확정]`

**1.**
```
Delivery fidelity
Rooms and socket ids live in the same bidirectional maps socket.io uses.
Fan-out is a set operation, not a loop over guesses.
```

**2.**
```
Checked against the real thing
Every test runs twice: once against socket.io, once against smocket.
A behavioural difference turns CI red.
```

**3.**
```
No server, no ports
Nothing binds, nothing listens. Tests start and finish in the same process.
```

**4.**
```
Honest about its limits
What a mock cannot have, smocket does not pretend to have.
The list is short and written down.
```

---

## 5. Demo 섹션

### 섹션 제목 `[확정]`

```
Three players, one page, no server.
```

### 설명 1줄 `[확정]`

```
One person draws, two watch, and the delivery record on the right
shows which socket received each event.
```

### 플레이스홀더 라벨 `[TODO]`

```
TODO: drawing demo
```

---

## 6. Quick start

### 섹션 제목 `[확정]`

```
Three steps.
```

### 스텝 1 `[TODO]`

```
TODO(hyun): install command
```

→ npm 실배포(8/18–20) 후 채울 것.

### 스텝 2 `[선택]` — 실제 API 확인 필요

제목:
```
Change the import
```

코드:
```ts
- import { Server } from 'socket.io';
+ import { Server } from 'smocket';
```

### 스텝 3 `[TODO]`

제목:
```
Run the test
```

코드:
```
TODO(hyun): 실제로 통과하는 테스트 파일 전문
```

→ **반드시 실제로 실행해서 통과하는 것을 붙일 것.** README의 quick start 항목과 같은 파일을 쓰면 두 곳이 갈라지지 않는다.

---

## 7. Scope 표 `[확정]` — 문구를 바꾸지 말 것

### 좌 — What smocket does

```
Rooms and namespaces
Broadcast, with and without exclusions
Targeted emits by socket id
Acknowledgements
Disconnect cleanup
Middleware and per-socket data
```

→ **릴리스 시점의 실제 API 표면과 대조할 것.** 아직 없는 항목이 있으면 지우고 간다.

### 우 — What a mock cannot have

```
Reconnection behaviour — there is no "later" to wait for
Transport fallback — there is no transport
Heartbeat — there is no connection to check
Multi-server adapters — there is one process
Binary encoding — nothing is serialised
```

---

## 8. Footer `[확정]`

```
Docs · GitHub · npm · MIT

Built by Hyun.
```

→ npm 링크는 실배포 전까지 `TODO(hyun): npm link`.

---

## 9. 기현 확정 대기 목록

| 위치 | 항목 |
|---|---|
| §1 | H1 3안 중 택 1 |
| §1 | 버전·라이선스 칩 값 |
| §3 | 폴리카소 MockSocket 발췌 원문 |
| §3, §6 | 코드 예시가 현재 공개 API와 일치하는지 |
| §6 | install 명령어 (npm 배포 후) |
| §6 | 통과하는 테스트 파일 전문 |
| §7 | 좌측 목록이 릴리스 시점 실제 표면과 일치하는지 |
| §8 | npm 링크 |
