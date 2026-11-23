<p align="center">
  <img src="https://runners.im/images/apps/draw/icon.webp" width="96" alt="Draw">
</p>
<h1 align="center">Draw</h1>
<p align="center"><b>발표하면서 화면 위에 바로 그리세요.</b><br>어느 앱 위에서나 펜 · 형광펜 · 화살표 · 도형 · 글자를 왼쪽 도구 막대에서 고릅니다.</p>
<p align="center">
  <a href="https://github.com/RUNNERS-IM/draw/releases/latest"><b>Mac 용 받기</b></a> ·
  <a href="https://runners.im/draw">runners.im/draw</a> ·
  <a href="README.md">English</a>
</p>
<p align="center"><sub>무료 · macOS 12 이상 · Apple 실리콘 · Intel · 20개 언어</sub></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://runners.im/images/apps/draw/tools-ko-dark.webp">
  <img src="https://runners.im/images/apps/draw/tools-ko-light.webp" alt="바탕화면 위에 물결 · 형광펜 · 화살표 · 글자를 그리고 왼쪽에 Draw 도구 막대가 있는 모습">
</picture>

## 할 수 있는 일

<table>
<tr>
<td width="50%"><picture><source media="(prefers-color-scheme: dark)" srcset="https://runners.im/images/apps/draw/click-ko-dark.webp"><img src="https://runners.im/images/apps/draw/click-ko-light.webp" alt=""></picture><br><b>그림은 남기고 클릭은 아래 앱으로</b><br>그리기를 끄면 클릭이 아래 앱으로 갑니다. 그린 그림은 화면에 남고 작은 막대만 떠 있습니다.</td>
<td width="50%"><picture><source media="(prefers-color-scheme: dark)" srcset="https://runners.im/images/apps/draw/menubar-ko-dark.webp"><img src="https://runners.im/images/apps/draw/menubar-ko-light.webp" alt=""></picture><br><b>메뉴 막대에서 바로</b><br>메뉴 막대 아이콘이나 ⌘⇧A · ⌘T · ⌘K 로 그리기 켜기 · 도구 막대 숨기기 · 전체 지우기를 합니다.</td>
</tr>
</table>

## 설치

```sh
brew tap runners-im/tap && brew trust runners-im/tap
brew install --cask draw
```

또는 [Releases](https://github.com/RUNNERS-IM/draw/releases/latest) 에서 `draw-macos-arm64.dmg`(Apple 실리콘)나 `draw-macos-x64.dmg`(Intel)를 받습니다. Draw 는 GitHub 에서 새 판을 확인해 내려받고, 설치하기 전에 묻습니다.

## 단축키

| 키                            | 하는 일                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| ⌘⇧A                           | 그리기 켜기 · 끄기                                              |
| ⌘T                            | 도구 막대 보이기 · 숨기기                                       |
| ⌘K                            | 전체 지우기                                                     |
| Esc 두 번                     | 클릭 모드로                                                     |
| 1 – 7                         | 펜 · 형광펜 · 화살표 · 네모 · 동그라미 · 글자 · 지우개          |
| P · H · A · R · O · T · E · L | 펜 · 형광펜 · 화살표 · 네모 · 동그라미 · 글자 · 지우개 · 레이저 |
| B · D                         | 붓 · 마름모                                                     |
| P 두 번 · A 두 번             | 사라지는 펜 · 납작 화살표                                       |
| X                             | 두 색 바꾸기                                                    |
| ⌘Z · ⌘⇧Z                      | 되돌리기 · 다시 하기                                            |
| ⌘C · ⌘V                       | 고른 그림 복사 · 붙여 넣기                                      |

⌘⇧A · ⌘T · ⌘K 는 **설정 → 그리기 → 단축키** 에서 바꿉니다. 도구 막대 단추에 마우스를 올리면 그 키가 보입니다.

## 개인정보

Draw 는 화면을 녹화하거나 올리지 않습니다. 그린 그림은 내 Mac 에만 있고 지우면 사라집니다. 인터넷은 GitHub 에서 새 판을 확인할 때, 스크린샷 · 개인정보 없이 오류 보고를 보낼 때, 그리고 직접 로그인했을 때 RUNNERS 계정에만 씁니다.

## 개발

[docs/development.md](docs/development.md) 를 보세요.

---

<p align="center"><a href="https://runners.im"><picture><source media="(prefers-color-scheme: dark)" srcset="https://runners.im/icons/logos/RUNNERS_H_W.svg"><img src="https://runners.im/icons/logos/RUNNERS_H.svg" height="20" alt="RUNNERS"></picture></a><br><sub>RUNNERS 가 만듦 · Dmytro Vasin 의 <a href="https://github.com/DmytroVasin/DrawPen">DrawPen</a>(MIT)을 바탕으로 함 · <a href="LICENSE.md">라이선스</a></sub></p>
