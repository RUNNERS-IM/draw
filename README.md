<p align="center">
  <img src="https://runners.im/images/apps/draw/icon.webp" width="96" alt="Draw">
</p>
<h1 align="center">Draw</h1>
<p align="center"><b>Draw on your screen while you present.</b><br>Pen, highlighter, arrows, shapes and text over any app, from a toolbar on the left.</p>
<p align="center">
  <a href="https://github.com/RUNNERS-IM/draw/releases/latest"><b>Download for Mac</b></a> ·
  <a href="https://runners.im/en/draw">runners.im/draw</a> ·
  <a href="README.ko.md">한국어</a>
</p>
<p align="center"><sub>Free · macOS 12 or later · Apple silicon · Intel · 20 languages</sub></p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://runners.im/images/apps/draw/tools-en-dark.webp">
  <img src="https://runners.im/images/apps/draw/tools-en-light.webp" alt="Draw toolbar on the left with a wave, a highlight, an arrow and text drawn over the desktop">
</picture>

## What it does

<table>
<tr>
<td width="50%"><picture><source media="(prefers-color-scheme: dark)" srcset="https://runners.im/images/apps/draw/click-en-dark.webp"><img src="https://runners.im/images/apps/draw/click-en-light.webp" alt=""></picture><br><b>Click through, drawings stay</b><br>Turn drawing off and clicks go to the app underneath. Your drawings stay on screen and only a small bar floats.</td>
<td width="50%"><picture><source media="(prefers-color-scheme: dark)" srcset="https://runners.im/images/apps/draw/menubar-en-dark.webp"><img src="https://runners.im/images/apps/draw/menubar-en-light.webp" alt=""></picture><br><b>Lives in the menu bar</b><br>Start drawing, hide the toolbar or clear everything from the menu bar icon, or with ⌘⇧A, ⌘T and ⌘K.</td>
</tr>
</table>

## Install

```sh
brew tap runners-im/tap && brew trust runners-im/tap
brew install --cask draw
```

Or download `draw-macos-arm64.dmg` (Apple silicon) or `draw-macos-x64.dmg` (Intel) from [Releases](https://github.com/RUNNERS-IM/draw/releases/latest). Draw checks GitHub for a new version, downloads it and asks before installing.

## Shortcuts

| Keys | What it does |
|---|---|
| ⌘⇧A | Start or stop drawing |
| ⌘T | Show or hide the toolbar |
| ⌘K | Clear the screen |
| Esc Esc | Back to click mode |
| 1 – 6 | Pen · highlighter · arrow · rectangle · oval · text |
| P · H · A · R · O · T · E · L | Pen · highlighter · arrow · rectangle · oval · text · eraser · laser |
| X | Swap the two colors |
| ⌘Z · ⌘⇧Z | Undo · redo |
| ⌘C · ⌘V | Copy and paste the selected drawing |

Change ⌘⇧A, ⌘T and ⌘K in **Settings → Draw → Shortcuts**. Hover a toolbar button to see its key.

## Privacy

Draw does not record or upload your screen. Drawings stay on your Mac and are gone when you clear them. Draw talks to the internet only to check GitHub for updates, to send error reports without screenshots or personal details, and, if you choose to sign in, for your RUNNERS account.

## Development

See [docs/development.md](docs/development.md).

---

<p align="center"><a href="https://runners.im"><picture><source media="(prefers-color-scheme: dark)" srcset="https://runners.im/icons/logos/RUNNERS_H_W.svg"><img src="https://runners.im/icons/logos/RUNNERS_H.svg" height="20" alt="RUNNERS"></picture></a><br><sub>Made by RUNNERS · Based on <a href="https://github.com/DmytroVasin/DrawPen">DrawPen</a> by Dmytro Vasin (MIT) · <a href="LICENSE.md">License</a></sub></p>
