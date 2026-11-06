# Draw

발표하거나 화면을 공유할 때 화면 위에 바로 그리는 맥 앱입니다. 메뉴 막대에 살고, 왼쪽 세로 막대에서 도구를 고릅니다.

- 도구: 펜 · 형광펜 · 화살표 · 네모 · 동그라미 · 글자 · 지우개
- 되돌리기 · 전체 지우기 · 색 고르기
- 그리기를 끄면 클릭이 아래 앱으로 그대로 갑니다(클릭 모드). 이때 그림판 창은 숨겨지므로 그린 그림도 함께 사라졌다가, 다시 켜면 돌아옵니다
- 20개 언어(`locales/`), 다크 · 라이트

Draw on your screen while you present. Draw is a macOS menu bar app with a vertical toolbar on the left.

## 내려받기

[GitHub Releases](https://github.com/RUNNERS-IM/draw/releases/latest) 에서 받습니다.

- Apple 실리콘: `draw-macos-arm64.dmg`
- Intel: `draw-macos-x64.dmg`

## 개발

Node 24 와 pnpm 이 필요합니다.

```sh
pnpm install
pnpm typecheck     # 타입 검사
pnpm lint          # 린트
pnpm format:check  # 서식 확인
pnpm test          # 단위 테스트
pnpm check:account # 공용 키트 복사본 확인
pnpm check:locales # 언어 파일 확인
pnpm dev           # 개발 판 실행
pnpm dist          # dist.noindex/ 에 이 맥에서 열어 볼 판 묶기
```

기본 가지는 `master` 입니다. `release` 가지에 올리면 GitHub Actions 가 버전을 올리고, 서명 · 공증한 판을 GitHub Releases 에 냅니다(`.github/workflows/release.yml`). 버전 번호는 `scripts/bump-release.sh` 가 고르므로 손으로 고치지 않습니다. 출시 전에 `RELEASE_NOTES.md` 를 이번 판 내용으로 고칩니다.

## 원본과 라이선스

Draw 는 Dmytro Vasin 의 [DrawPen](https://github.com/DmytroVasin/DrawPen)(MIT 라이선스)을 바탕으로 만들었습니다. 원본의 저작권 표시와 라이선스 전문은 [LICENSE](LICENSE) 에 그대로 있고, 원본의 변경 기록은 [CHANGELOG.md](CHANGELOG.md) 에 있습니다. 함께 싣는 오픈소스 패키지의 고지는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 에 있고, 앱의 정보 창에서도 볼 수 있습니다.
