# smocket 랜딩 페이지 기능명세

> 이 문서를 받는 에이전트에게: 이 명세에 없는 섹션·기능·문구를 임의로 추가하지 말 것.
> "미정"으로 표시된 항목은 구현 전에 질문할 것.

---

## 1. 목적과 성격

- smocket(Socket.IO mock 라이브러리)의 랜딩 페이지. **문서 사이트가 아님** — 문서는 GitHub README가 정본이고, 이 페이지는 입구 역할만 한다.
- 레퍼런스: zustand 랜딩 페이지의 밀도. 한 화면 중심, 스크롤 최소, 코드 블록이 주인공.
- 페이지는 1개. 라우팅 없음.

## 2. 리포/배포

- **별도 리포** `smocket-site` (본체 리포에 넣지 않는다)
- 배포: Vercel, 기본 제공 도메인 (`*.vercel.app`). 커스텀 도메인은 나중 일이므로 고려하지 않는다.
- 스택: Next.js (App Router, 정적 생성). CMS·DB·API 라우트 없음.

## 3. 페이지 구성 (위에서 아래 순서)

### 3.1 Hero
- 로고 이미지: `https://ik.imagekit.io/electrohyun/smocket_logo` (ImageKit 변환 파라미터로 크기 조절 가능, 예: `?tr=w-320`)
- 프로젝트명: `smocket`
- 한 줄 소개: `Socket.IO mock library with full room · namespace · broadcast support.`
- 태그라인 (이탤릭 또는 보조 텍스트): `Sweet setup, rocket speed.`
- 버튼 2개:
  - `GitHub` → https://github.com/electrohyun/smocket
  - `npm` → https://www.npmjs.com/package/smocket
- 설치 커맨드 원라이너 (복사 버튼 포함): `npm install -D smocket`

### 3.2 코드 데모 블록
- README의 Usage 예제를 그대로 사용 (아래 원문). 임의 수정 금지.

```ts
import { MockServer } from 'smocket';

const io = new MockServer();

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
    socket.to(room).emit('user-joined', socket.id);
  });
});

const a = io.connect();
const b = io.connect();

a.emit('join', 'room-1');
b.emit('join', 'room-1');
// a receives 'user-joined'; b does not, since it is the sender
```

- 신택스 하이라이트 필수. 라이브 실행/플레이그라운드는 범위 밖.

### 3.3 Why 섹션 (3칸 그리드 또는 세로 나열)
아래 세 항목, 문구 그대로:

1. **Full delivery semantics** — Rooms, namespaces, and broadcast exclusion — the parts other mocks leave out.
2. **Specified by a real server** — Every behavior is pinned by a conformance suite that runs against real Socket.IO first.
3. **Zero-setup testing** — No server process, no ports. Your socket tests run as plain unit tests.

### 3.4 Features (간결한 목록, README와 동일)
- Socket ID assignment and tracking
- `emit` / `on` / acknowledgements
- Room `join` / `leave` with bidirectional membership
- Broadcasts: `io.to` · `socket.to` · `socket.broadcast` · `except`
- Namespace isolation
- Multi-client simulation
- Membership cleanup on `disconnect`

### 3.5 Footer
- `MIT License` · GitHub 링크 · npm 링크
- 저작자 표기: `electrohyun`

## 4. 카피 규칙

- 사이트의 모든 문구는 **영어**. 위에 명시된 문구는 그대로 사용하고 새 문구를 창작하지 않는다.
- 프로젝트가 개발 중임을 숨기지 않는다. Hero 아래 또는 Footer 위에 한 줄:
  `In early development — the API may change until 1.0. Follow progress on GitHub.`
  ("GitHub"에 마일스톤 링크: https://github.com/electrohyun/smocket/milestones)
- 다운로드 수·사용자 수·성능 수치 등 어떤 지표도 표시하지 않는다 (아직 없음).
- 다른 mock 라이브러리와의 비교 표는 이 페이지 범위 밖 (README 담당).

## 5. 디자인 방향

- 마스코트/브랜드 무드: 고양이 + 스모어 로켓, Newgrounds/2000년대 초 MS Paint 감성. 단, 페이지 자체는 절제된 개발자 도구 톤을 유지하고 마스코트 감성은 로고와 액센트 컬러 정도로만 스며들게 한다. (일러스트 추가 생성은 범위 밖)
- 다크 톤 기본. 라이트 모드 토글은 범위 밖.
- 컬러 팔레트 (확정):
  - 배경: `#0f1115` (거의 검정에 가까운 차콜)
  - 본문 텍스트: `#e6e8eb`
  - 보조 텍스트: `#9aa1a9`
  - 액센트: `#f4a259` (스모어 토스트 오렌지 — 버튼, 링크 호버, 코드 하이라이트 키워드에만 사용)
  - 액센트 보조: `#7bb0ff` (버튼 아웃라인·인라인 코드 등 차가운 포인트, 남용 금지)
  - 카드/코드 블록 배경: `#171a21`, 보더 `#262b33`
- 폰트 (확정):
  - 본문·헤딩: 시스템 폰트 스택 (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) — 웹폰트 로드 없음
  - 코드: `"JetBrains Mono", ui-monospace, monospace` (Google Fonts, `display=swap`)
- 위 값은 CSS 변수로 선언해 한 곳에서 관리할 것.
- 반응형: 모바일에서 코드 블록이 가로 스크롤로 깨지지 않게만 처리. 그 이상의 모바일 최적화는 범위 밖.

## 6. 범위 밖 (하지 말 것)

- 문서 페이지, API 레퍼런스, 블로그
- 다국어(i18n)
- 애널리틱스, 쿠키 배너
- 뉴스레터/이메일 수집
- 라이브 코드 실행
- SEO 세부 튜닝 (기본 메타 태그 + OG 이미지 1장까지만; OG 이미지는 로고 재사용)

## 7. 완료 조건

- [ ] Vercel 배포 URL에서 페이지가 렌더됨
- [ ] 모든 링크(GitHub, npm, milestones) 정상 동작
- [ ] 설치 커맨드 복사 버튼 동작
- [ ] 모바일(375px)에서 레이아웃 안 깨짐
- [ ] Lighthouse 성능 저하 요인(거대 이미지 등) 없음 — 점수 목표는 두지 않음
