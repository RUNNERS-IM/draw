import { useSyncExternalStore } from 'react'

// 앱 안 아이콘은 맥 화면 밝기를 따라간다(2026-11-11 사용자 답 2B): 밝은 모드는 화이트 판, 어두운 모드는 블랙 판.
// Dock · Finder 처럼 시스템이 그리는 자리는 화이트 판 하나로 둔다(같은 날 답 1A).
const dark = window.matchMedia('(prefers-color-scheme: dark)')

const subscribe = (onChange: () => void) => {
  dark.addEventListener('change', onChange)
  return () => dark.removeEventListener('change', onChange)
}

export const useAppIcon = () =>
  useSyncExternalStore(subscribe, () =>
    dark.matches ? '../assets/icon-black.png' : '../assets/icon.png'
  )
