# Draw 개발

Node 24 와 pnpm 이 필요합니다.

```sh
pnpm install
pnpm typecheck     # 타입 검사
pnpm lint          # 린트
pnpm format:check  # 서식 확인
pnpm test          # 단위 테스트
pnpm check:account # 공용 키트(runners-app-kit) 복사본이 package.json 의 --kit 판과 같은지 확인
pnpm check:locales # 언어 파일 확인
pnpm dev           # 개발 판 실행
pnpm dist          # dist.noindex/ 에 이 맥에서 열어 볼 판 묶기
```

## 가지와 출시

- 작업은 `develop` 에 올리고, 출시할 때 `master` 와 `release` 로 합칩니다.
- `release` 가지에 올리면 GitHub Actions 가 버전을 올리고, 서명 · 공증한 판을 GitHub Releases 에 냅니다(`.github/workflows/release.yml`).
- 버전 번호는 `scripts/bump-release.sh` 가 고르므로 손으로 고치지 않습니다. 출시 전에 `RELEASE_NOTES.md` 를 이번 판 내용으로 고칩니다.

## 시험 촬영

시험판(`DRAW_TEST_BUILD`)은 `RUNNERS_TEST_SHOTS=<폴더>` 로 켜면 화면마다 사진을 찍고 끝납니다. 언어는 `RUNNERS_TEST_LANG`, 범위는 `RUNNERS_TEST_SCOPE` 로 고릅니다. 자세한 쓰는 법은 `src/main/testShots.ts` 맨 위에 있습니다.

## 원본과 라이선스

Draw 는 Dmytro Vasin 의 [DrawPen](https://github.com/DmytroVasin/DrawPen)(MIT 라이선스)을 바탕으로 만들었습니다. 원본의 저작권 표시와 MIT 라이선스 전문은 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) 맨 앞에 그대로 있고, 앱 정보 창의 「오픈소스 고지」에서도 볼 수 있습니다. 원본의 변경 기록은 [CHANGELOG.md](../CHANGELOG.md) 에 있습니다. Draw 자체의 저작권은 [LICENSE.md](../LICENSE.md) 에 있습니다.
