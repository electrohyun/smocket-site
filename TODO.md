# TODO — smocket-site

모든 문구의 출처는 `smocket-site_카피_원본.md`. 코드/값은 `../smocket` 레포와 대조해 채웠다.

## 테마 / 비주얼 (기현 지시로 스펙 대체됨)

- **다크 전용 → 따뜻한 라이트(s'more + space)** 로 전환. 크림 배경 `#f6efe1` · 초콜릿 텍스트 · 토스트 오렌지 강조. 되돌리려면 `app/globals.css`의 `:root` 값만 원복.
- 에셋(로컬, 외부요청 없음): `public/cat.webp`(선글라스 고양이 로고), `public/rocket.webp`(투명 스모어 로켓, 히어로 주인공). 원본은 루트에 `ket.webp`/`rocketwebp.webp`/`rocket.png`/`reference.png`로 남아있음.
- 히어로 별자리(구 `HeroConstellation`) → `HeroVisual`로 교체. 로켓 + 흐린 성좌 배경 + 발사 궤적 + 문학 캡션.
- Trace "첫 증거" 패널은 다크 초콜릿으로 강조(코드 블록과 동톤).

## 데모 (`/demo`) — 완료 (2~6단계)

계획서: `smocket_데모_구현계획_2026-08-05.md`. 사양: `smocket_데모앱_기획_v2_2026-08-05.md`.

**2~6단계 전부 완료.** 두 시선(그리는 사람/관찰자), 녹화·재생 엔진, 상황 패널(시선 전환·제시어
토글·B 지연 슬라이더), 3·2·1 카운트다운, 에러 경계까지 브라우저에서 실측했다. smocket `src/`는
안 건드렸다. 진입: `/demo`(그리는 사람) · `?view=observer`(관찰자) · `?replay`(재생) · `?delay=1500`(지연).

- `app/demo/lib/trace.ts` — 배달 기록 조립·서식
- `app/demo/lib/trace-adapter.ts` — `Adapter` 상속, `socketsIn`/`add`/`del` 관측
- `app/demo/lib/room.ts` — 한 라운드의 소켓 통신
- `app/demo/components/DrawerView.tsx` — A 시선. `word`/`chat`/`announce`를 받아 제시어·채팅 피드·종료 배너로
- `app/demo/components/Canvas.tsx` — 로컬 드로잉. 리사이즈 리페인트로 그림 유지, 정답 시 잠금
- `app/demo/components/TracePanel.tsx` — 배달 기록 렌더(fold 포함)
- `app/demo/lib/__tests__/trace.test.ts` — 배달식·도달·제외·join/leave·ack 검증
- `scripts/draw-seed.mjs` — `seed.json`(재생용 기린 그림)의 원본. `pnpm seed:draw`로 재생성하고,
  `--preview <dir>`를 주면 단계별 PNG도 뽑는다. 획 순서가 곧 오답의 근거라 `bots.ts`의
  `afterStrokes`와 짝이다 — 그림을 바꾸면 스크립트가 출력하는 경계값으로 같이 갱신할 것

| 위치 | 파일 | 상태 |
|---|---|---|
| ~~데모 입구 스크린샷~~ | `app/components/DemoPreview.tsx` | **완료** — 정지 이미지 대신 자체 재생 프리뷰로 갔다. 아래 "랜딩 데모 섹션" 절 |
| ~~데모 입구 링크 문구~~ | `content/landing.ts` `demo.cta` | **완료** — "Take the pen →" |
| 사운드 에셋 | `public/ambient.mp3` | 없음. 토글·`<audio>` 배선은 완료(기본 음소거). CC0 파일 넣으면 동작 |
| 모바일 실측 | `app/demo/**/*.module.css` | 규칙은 bounded(캔버스+트레이스 동시). 실제 폰에서 가독 눈으로 확인만 남음 |

**vendor는 걷어냈다.** smocket 0.4.0이 npm에 `latest`로 올라와서 의존성이 `^0.4.0`이 됐다. 배포본을
풀어 vendor한 main 빌드(`7a90bd0`)와 대조하니 파일 9개가 바이트 단위로 같았고, 데모가 쓰는
API(`DelayingAdapter` · `onAnyOutgoing` · broadcast `except`/`in` · `node:crypto` 없는 소켓 id)도 그대로다.
`vendor/`와 `scripts/sync-smocket.mjs`, `smocket:sync` 스크립트는 삭제 — 계획서 §7의 마지막 완료 기준
("의존성이 `vendor/` 경로가 아닐 것")을 이제 만족한다.

`pnpm-workspace.yaml`의 `minimumReleaseAgeExclude: smocket@0.4.0`은 갓 나온 릴리스를 들이려고 pnpm이
붙인 것. 배포 후 시간이 지나면 지워도 된다.

## 랜딩 데모 섹션 — 실제 라운드가 도는 프리뷰 (2026-08-07)

점선 TODO 프레임을 걷어냈다. 자리도 Features 앞(= Pain 바로 뒤)으로 옮겼다 — Pain이 "두 번째
플레이어가 닿지 않았다"로 끝나니 그 문장의 답이 바로 오는 게 맞다.

`app/components/DemoPreview.tsx`는 **관찰자 시선에 아무도 안 앉은 라운드**다. `createRound()`로 진짜
라운드를 세우고 녹화본을 A의 획으로 흘려보낸다. 화면의 전부가 B가 *배달받은* 것 — 그림은 `stroke`,
추측은 `chat`, 정답은 B에게만 간 `correct`. 옆의 배달 기록은 어댑터 자신의 진술이지 그것에 대해 쓴
캡션이 아니다. **녹화된 건 그림뿐이고 라우팅은 매번 살아 있다** (매 로드마다 sid가 바뀌는 게 그 증거).

- 뷰포트 근처에서 1회, **실시간 17.8초**(배속 없음). 다시 스크롤해도 재생 안 함 — 대신 프레임
  좌상단에 **다시보기 버튼**. 누르면 라운드를 새로 세운다: sid가 전부 바뀌는 게 라우팅이 살아
  있다는 가장 짧은 증명이다.
- 버튼은 **아이콘만**, 원형 48px(좁아지면 38px 바닥 — 손가락 크기). 글자는 없고 이름은
  `aria-label="Play again"`에 있다 — 아이콘 버튼에 이름이 없으면 "button"으로만 읽힌다.
- 아이콘은 **반복 루프(🔁)**, 인라인 SVG. 이모지를 그대로 쓰지 않은 건 플랫폼마다 자기 색으로
  렌더되기 때문 — 여기는 밤 배경이고 버튼 색을 따라가야 한다. 호버에 움직임 없음(색·테두리만).
- `runs` 카운터가 라운드를 지배한다. `Canvas`에 `key={runs}`를 걸어 매 라운드가 빈 표면을 받는다 —
  `Canvas`는 리사이즈 리페인트용으로 그린 획을 전부 들고 있어서, 그냥 다시 돌리면 두 번째 라운드가
  첫 라운드의 완성된 기린 위에서 시작한다. 리마운트가 `Canvas`를 안 건드리고 지우는 방법.
- **프레임은 이제 링크가 아니다.** 앵커 안에 버튼은 유효하지 않고, 다시보기를 누르려다 `/demo`로
  튕기면 자기 클릭에 속은 것이다. 프레임은 보는 것, 아래 CTA가 들어가는 문.
- **랜딩 초기 번들에는 여전히 smocket도 seed도 없다.** 둘 다 프레임이 뷰포트에 가까워질 때 받는 lazy
  청크: **79.5KB raw / 21.6KB gzip**. 빌드 산출물 대조로 확인(초기 청크 9개에 smocket 심볼 0).
  기획 §8의 "번들 분리"는 지키지만 "랜딩은 서버 컴포넌트 유지"에서는 벗어나 있다 — 기현 승인.
- `app/demo/lib/game.ts` 신규 — `WORD`/`LABELS`/`ROOM`/`DRAWER`. `bots.ts`가 `room.ts`(첫 줄이 smocket)를
  거치지 않고 상수를 읽게 하려고 뺐다. `room.ts`가 전부 re-export하니 데모 쪽 import는 그대로.
- `--sock-a/b/c`가 `demo.css` → `globals.css :root`로 이사. 기록의 라벨과 캔버스 위 행위를 잇는 색이라
  이제 두 페이지가 같은 값을 읽어야 한다.
- 프레임은 **밤 고정**. `/demo`가 낮에도 밤인 것과 같은 이유.
- 봇 대본은 **획으로만** 전진한다(`/demo`의 500ms 하트비트 없음). 백그라운드 탭은 rAF를 멈추는데
  interval은 안 멈춰서, 그림은 정지했는데 추측만 앞서 나가는 상태가 생긴다.
- `app/demo/lib/__tests__/preview.test.ts` — 스케줄러를 손으로 돌려 진짜 라운드를 완주시킨다: 224개
  세그먼트 전부 B에 배달, 비트 6개가 순서대로 1회씩, `correct`의 도달이 `['B']` 하나,
  `socket_A.to('room-1').emit('stroke', {…})` → `→ B, C (except A)`, 워드는 마스킹, mismatch 0.
  smocket 배달은 **연쇄 마이크로태스크**라 `await Promise.resolve()` 하나로는 한 건만 흐른다 —
  매크로태스크로 큐를 비워야 한다(테스트 주석 참고).

**레이아웃 (실측으로 확인, 프레임 폭 1040~360)**

그림이 캔버스의 0.295~0.704를 쓰므로 양옆이 비어 있다. **기록은 오른쪽 띠에 프레임 전체 높이로,
말풍선은 왼쪽 띠 아래에.** 한때 둘을 한 flex 열에 넣고 기록이 남는 높이를 갖게 했는데, 추측이 한 줄
붙을 때마다 기록이 한 줄씩 줄었다 — 읽고 있는 사람 눈앞에서. 지금은 라운드에서 무슨 일이 일어나도
기록의 상자가 안 변한다(넘치면 스크롤). 실측: 추측 0개·8개(강제)에서 `292x551 @top 199` 동일.

컨테이너 폭 ≤520px에서는 프레임이 4/5로 서고 기록이 자기 행을 갖는다. **컨테이너 쿼리는 컨테이너
자신에게는 안 걸리므로** `.shell` 래퍼가 컨테이너고 `.frame`이 그 자식이다.

`Canvas`는 `height: 100%`라 조상 그리드 행이 확정되어 있어야 한다 — 아니면 캔버스가 자기 width/height
**속성**으로 되돌아가고, 그 속성은 리사이즈 핸들러가 방금 잰 박스에서 쓴다(되먹임 루프, 그림이 잘림).
`.frame`과 `.picture` 둘 다 `grid-template: minmax(0,1fr) / minmax(0,1fr)`인 이유.

`prefers-reduced-motion` 경로는 브라우저에서 확인했다 — `matchMedia`를 덮고 다시보기를 눌러서. 재생
없이 완주 상태(기린 완성 + 기록 전체 + 정답 + C의 반응)로 즉시 도착한다. 다시보기 버튼이 생기면서
검증할 수 있게 된 것. 캡션이 속도를 주장하지 않는 이유이기도 하다 — 그 경우엔 재생 자체가 없다.

**남은 것:** 좁은 폭은 컨테이너 실측 + 380px 스크린샷으로 봤지 실제 폰은 아니다.

## 컨트롤을 원형 아이콘 버튼으로 (2026-08-07)

`/demo`의 컨트롤이 0.76rem 텍스트 pill이라, **화면에서 무슨 일이 벌어지는지가 주제인 페이지에서
그 일을 바꾸는 것들이 제일 안 보이는 마크**였다. 랜딩 다시보기 버튼과 같은 모양으로 통일했다.

- `app/components/IconButton.tsx` — 48px 원 + 아래 라벨. 랜딩과 데모가 **같은 컴포넌트**를 쓴다.
  디스크는 `--code-bg`/`--border`를 읽어서 배달 기록과 같은 표면이 된다(두 페이지 모두 그 토큰을
  매핑해 두었으므로 컴포넌트는 자기가 어느 페이지에 있는지 모른다).
- `app/components/icons.tsx` — 아이콘 전부 한 격자(24×24, stroke 2, round cap). svg가 stroke를
  주므로 개별 아이콘이 자기 굵기를 못 정한다 = 서로 어긋날 수 없다.
- 눈 아이콘은 **오직 제시어**를 뜻한다. 시선 전환 버튼은 가는 곳을 보여주는데, 관찰자에서 가는 곳은
  펜이라 눈 두 개가 같이 뜨는 일이 없다.
- `delay B`는 슬라이더로 남겼다(기현 결정) — 지연을 늘려가며 순서가 유지되는 걸 보는 게 이 컨트롤의
  요점이라 단계 버튼으론 미리 정한 단계만 보여주게 된다. 대신 디스크와 같은 높이 48px 알약으로.
- `--stage-top`/`--stage-bottom`(demo.css) 신설. 패널이 커졌는데 두 뷰의 `padding: 60px`은 그대로여서
  라벨이 배달 기록 위에 얹혔다. 이제 두 뷰가 같은 값을 읽고, 900px 아래에선 패널이 하단으로 가므로
  예약도 아래위가 뒤바뀐다.
- **`copy session`을 디스크로 올렸다** — 원래 `.dev` 스타일로 "Plain on purpose (기획 3단계 §3)"
  였는데, 기현이 안 보이는 것들 중에 이걸 직접 지목했다. seed 뽑는 개발용이 데모 컨트롤과 같은 급이
  된 것이니, 되돌리려면 `DrawerView.tsx`의 그 블록만 이전 `.dev` 버튼으로 바꾸면 된다.

**아이콘 라이브러리(lucide-react) 실측** — 랜딩 초기 JS gzip 기준 아이콘 1개 +1.2KB, 4개 +1.5KB.
로딩 차이는 사실상 없다(194KB 중 0.6%). 판단 기준은 속도가 아니라 일관성인데, 지금은 자체 SVG가
한 격자로 통일돼 있어서 급하지 않다. 도입한다면 `ThemeToggle`(16×16, stroke 1.4)까지 같이 가야
의미가 있다 — 안 그러면 의존성만 늘고 격자는 여전히 둘이다. 교체 지점은 `app/components/icons.tsx`.

## 확인 필요 — 검토해서 확정할 것

| 위치 | 파일 | 상태 |
|---|---|---|
| Pain 좌측 (Before) | `content/landing.ts` `pain.before.code` | **기현 지시로 내가 상상해서 작성한 예시 코드** (폴리카소 실제 원문 아님). 실제 폴리카소 MockSocket 발췌로 교체하고 싶으면 원문 붙일 것 |
| Hero 문학 캡션 | `content/landing.ts` `hero.visual.caption` | 내가 쓴 카피 ("Packed like a s'more..."). 교체 가능 |

## 레포 대조로 채운 것 (검증 완료)

| 항목 | 값 | 근거 |
|---|---|---|
| Hero 칩 버전 | `v0.4.0` | `npm view smocket dist-tags` = latest 0.4.0 (0.3.0에서 갱신) |
| Hero 칩 라이선스 | `MIT` | `smocket/package.json` license |
| Hero 칩 CI | `dual-run CI` | README CI 배지 (real + mock 컨포먼스) |
| Pain 우측 코드 | `new Server(url)` + `connect(url)` | README Usage, ADR 0003 (url 필수) — 카피의 `new Server()`/`connect(io.url)`는 실제 API와 어긋나 교체 |
| Quickstart 스텝 1 | `npm install -D smocket` | README Install, npm에 v0.3.0 배포됨 |
| Quickstart 스텝 3 | 공개 API 테스트 전문 | smocket 레포에서 `vitest run`으로 **실제 통과 확인**. `socket.to(room)`으로 발신자 제외 |
| Scope "does" | `Middleware and per-socket data` 삭제 | src에 `.use()`/`socket.data` 없음 → 현 릴리스에 미존재 (지시서 §7) |
| Footer npm 링크 | npmjs.com/package/smocket | v0.3.0 배포됨 |

## 릴리스 시 갱신

- Hero 칩 버전(`hero.chips`)은 현재 npm 버전 `v0.4.0` 기준. 상위 릴리스 나오면 값만 갱신.
- 로드맵상 `v1.0.0` 예정.
- **Scope "does" 재검토 — 이제 결정 가능**: 위 표에서 `Middleware and per-socket data`를 뺀 근거는
  "src에 없음"이었는데, `io.use()`와 `socket.data`가 그 뒤 들어왔고 npm 0.4.0에 있다. 되살릴지 판단할 것.
- **Trace 배달식 표기 재검토 — 이제 결정 가능**: 트레이스의 stroke 호출이 `socket_A.to('room-1')`인 것은
  원래 `BroadcastOperator`에 `except()`가 없어서였는데, 0.4.0에서 broadcast `except`/`in`이 들어왔다.
  단 `socket.to(room)`은 발신자 제외를 공짜로 얻는 정당한 형태라 그대로 둘 수도 있다 —
  `io.to().except(sid_A)`로 바꿀지 정할 것 (계획서 §0-1).
- **배포 도메인**: `SITE_URL`(content/landing.ts)이 임시로 `https://smocket-site.vercel.app`.
  실도메인이 정해지면 그 값을 바꾸거나 배포 환경변수 `NEXT_PUBLIC_SITE_URL`로 덮을 것.
  (metadataBase · OG/트위터 이미지 · robots.txt · sitemap.xml 이 모두 이 값을 씀)

## 이번 라운드에서 의도적으로 만들지 않은 것

- 라이트 모드 토글 (다크 전용)
- 스폰서 / 후기 / 로고 월 / 비교표 / 뉴스레터 / 배지
- 애니메이션·스크롤 연출·그라디언트 (hover 색 변화까지만)
- Demo 라운드 구현 (별도 작업 — 위 "데모" 절 참고. 랜딩의 자리는 `/demo` 입구로 교체됨)
- 본문 웹폰트 (시스템 산세리프로 진행 — 미확정)
- 배포 설정 (Vercel 전제이나 이번 범위 아님)
