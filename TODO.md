# TODO — smocket-site

모든 문구의 출처는 `smocket-site_카피_원본.md`. 코드/값은 `../smocket` 레포와 대조해 채웠다.

## 테마 / 비주얼 (기현 지시로 스펙 대체됨)

- **다크 전용 → 따뜻한 라이트(s'more + space)** 로 전환. 크림 배경 `#f6efe1` · 초콜릿 텍스트 · 토스트 오렌지 강조. 되돌리려면 `app/globals.css`의 `:root` 값만 원복.
- 에셋(로컬, 외부요청 없음): `public/cat.webp`(선글라스 고양이 로고), `public/rocket.webp`(투명 스모어 로켓, 히어로 주인공). 원본은 루트에 `ket.webp`/`rocketwebp.webp`/`rocket.png`/`reference.png`로 남아있음.
- 히어로 별자리(구 `HeroConstellation`) → `HeroVisual`로 교체. 로켓 + 흐린 성좌 배경 + 발사 궤적 + 문학 캡션.
- Trace "첫 증거" 패널은 다크 초콜릿으로 강조(코드 블록과 동톤).

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
- **배포 도메인**: `SITE_URL`(content/landing.ts)이 임시로 `https://smocket-site.vercel.app`.
  실도메인이 정해지면 그 값을 바꾸거나 배포 환경변수 `NEXT_PUBLIC_SITE_URL`로 덮을 것.
  (metadataBase · OG/트위터 이미지 · robots.txt · sitemap.xml 이 모두 이 값을 씀)

## 이번 라운드에서 의도적으로 만들지 않은 것

- 라이트 모드 토글 (다크 전용)
- 스폰서 / 후기 / 로고 월 / 비교표 / 뉴스레터 / 배지
- 애니메이션·스크롤 연출·그라디언트 (hover 색 변화까지만)
- Demo 실제 구현 (별도 작업 — `TODO: drawing demo` 노출 중)
- 본문 웹폰트 (시스템 산세리프로 진행 — 미확정)
- 배포 설정 (Vercel 전제이나 이번 범위 아님)
