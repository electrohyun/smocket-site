# TODO — smocket-site

모든 문구의 출처는 `smocket-site_카피_원본.md`. 코드/값은 `../smocket` 레포와 대조해 채웠다.

## 테마 / 비주얼 (기현 지시로 스펙 대체됨)

- **다크 전용 → 따뜻한 라이트(s'more + space)** 로 전환. 크림 배경 `#f6efe1` · 초콜릿 텍스트 · 토스트 오렌지 강조. 되돌리려면 `app/globals.css`의 `:root` 값만 원복.
- 에셋(로컬, 외부요청 없음): `public/cat.webp`(선글라스 고양이 로고), `public/rocket.webp`(투명 스모어 로켓, 히어로 주인공). 원본은 루트에 `ket.webp`/`rocketwebp.webp`/`rocket.png`/`reference.png`로 남아있음.
- 히어로 별자리(구 `HeroConstellation`) → `HeroVisual`로 교체. 로켓 + 흐린 성좌 배경 + 발사 궤적 + 문학 캡션.
- Trace "첫 증거" 패널은 다크 초콜릿으로 강조(코드 블록과 동톤).

## 데모 (`/demo`) — 진행 중

계획서: `smocket_데모_구현계획_2026-08-05.md`. 사양: `smocket_데모앱_기획_v2_2026-08-05.md`.

0·1·2단계(라우트·톤 / 통신 코어 / 그리는 사람 시선)까지 되어 있고, 브라우저에서 실제로 돌려
확인했다(클라 3개 연결·stroke `→ B, C (except A)`·제시어 A 단독·ack 3종·정답 종료). 다음은 3단계
(관찰자 시선 + 녹화 엔진)다.

- `app/demo/lib/trace.ts` — 배달 기록 조립·서식
- `app/demo/lib/trace-adapter.ts` — `Adapter` 상속, `socketsIn`/`add`/`del` 관측
- `app/demo/lib/room.ts` — 한 라운드의 소켓 통신
- `app/demo/components/DrawerView.tsx` — A 시선. `word`/`chat`/`announce`를 받아 제시어·채팅 피드·종료 배너로
- `app/demo/components/Canvas.tsx` — 로컬 드로잉. 리사이즈 리페인트로 그림 유지, 정답 시 잠금
- `app/demo/components/TracePanel.tsx` — 배달 기록 렌더(fold 포함)
- `app/demo/lib/__tests__/trace.test.ts` — 배달식·도달·제외·join/leave·ack 검증

| 위치 | 파일 | 상태 |
|---|---|---|
| 데모 입구 스크린샷 | `content/landing.ts` `demo.shotTodo` | `TODO(hyun): demo screenshot` — 화면 노출 중. 데모가 돌기 시작하면 찍어서 교체 |
| 데모 입구 링크 문구 | `content/landing.ts` `demo.linkTodo` | `TODO(hyun): copy needed — demo entry link` — 카피 원본에 없는 자리 (지시서 §5-5) |
| 데모 페이지 본문 | `content/demo.ts` `page.todo` | `TODO: drawing demo` — 화면 노출 중 |

**vendor tarball은 임시다.** `package.json`의 `smocket` 의존성이 `file:vendor/smocket-0.4.0-main.*.tgz`인데,
데모가 쓰는 API(`DelayingAdapter` · `onAnyOutgoing` · broadcast `except`/`in` · `node:crypto` 없는 소켓 id)가
main엔 있으나 npm 배포본(0.3.0)엔 아직 없어서다. 0.4.0이 npm에 올라오면 `vendor/`와
`scripts/sync-smocket.mjs`를 지우고 버전 범위로 되돌릴 것 — 계획서 §7의 마지막 완료 기준이 이걸 강제한다.

동기화: `pnpm smocket:sync` (형제 경로 `../smocket` 전제)

## 확인 필요 — 검토해서 확정할 것

| 위치 | 파일 | 상태 |
|---|---|---|
| Pain 좌측 (Before) | `content/landing.ts` `pain.before.code` | **기현 지시로 내가 상상해서 작성한 예시 코드** (폴리카소 실제 원문 아님). 실제 폴리카소 MockSocket 발췌로 교체하고 싶으면 원문 붙일 것 |
| Hero 문학 캡션 | `content/landing.ts` `hero.visual.caption` | 내가 쓴 카피 ("Packed like a s'more..."). 교체 가능 |

## 레포 대조로 채운 것 (검증 완료)

| 항목 | 값 | 근거 |
|---|---|---|
| Hero 칩 버전 | `v0.3.0` | `smocket/package.json` version, `npm view smocket version` = 0.3.0 |
| Hero 칩 라이선스 | `MIT` | `smocket/package.json` license |
| Hero 칩 CI | `dual-run CI` | README CI 배지 (real + mock 컨포먼스) |
| Pain 우측 코드 | `new Server(url)` + `connect(url)` | README Usage, ADR 0003 (url 필수) — 카피의 `new Server()`/`connect(io.url)`는 실제 API와 어긋나 교체 |
| Quickstart 스텝 1 | `npm install -D smocket` | README Install, npm에 v0.3.0 배포됨 |
| Quickstart 스텝 3 | 공개 API 테스트 전문 | smocket 레포에서 `vitest run`으로 **실제 통과 확인**. `socket.to(room)`으로 발신자 제외 |
| Scope "does" | `Middleware and per-socket data` 삭제 | src에 `.use()`/`socket.data` 없음 → 현 릴리스에 미존재 (지시서 §7) |
| Footer npm 링크 | npmjs.com/package/smocket | v0.3.0 배포됨 |

## 릴리스 시 갱신

- Hero 칩 버전(`hero.chips`)은 현재 npm 버전 `v0.3.0` 기준. 상위 릴리스 나오면 값만 갱신.
- 로드맵상 `v0.4.0`은 진행 중, `v1.0.0` 예정.
- **Scope "does" 재검토**: 위 표에서 `Middleware and per-socket data`를 뺀 근거는 "src에 없음"이었는데,
  `io.use()`와 `socket.data`가 그 뒤 `main`에 들어왔고 지금 vendor된 0.4.0엔 있다. npm 0.4.0
  배포 시 되살릴지 판단할 것.
- **Trace 배달식 표기 재검토**: 트레이스의 stroke 호출이 `socket_A.to('room-1')`인 것은 원래
  `BroadcastOperator`에 `except()`가 없어서였는데, 0.4.0에서 broadcast `except`/`in`이 들어왔다
  (vendor에 반영됨). 단 `socket.to(room)`은 발신자 제외를 공짜로 얻는 정당한 형태라 그대로 둘 수도
  있다 — `io.to().except(sid_A)`로 바꿀지 정할 것 (계획서 §0-1).
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
