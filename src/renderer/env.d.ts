// 창마다 preload 가 넘기는 electronAPI 와, 화면 코드가 쓰는 전역 값의 타입.
import type { AboutApi } from '../preload/about_page';
import type { AppApi } from '../preload/app_page';
import type { ExtendedToolbarApi } from '../preload/extended_toolbar_page';
import type { PanelApi } from '../preload/panel_page';
import type { SettingsApi } from '../preload/settings_page';
import type { UpdateApi } from '../preload/update_page';

declare global {
  interface Window {
    electronAPI: AboutApi & AppApi & ExtendedToolbarApi & PanelApi & SettingsApi & UpdateApi;
    // 시험 모드가 그림 수를 읽는 값.
    __drawFigureCount?: number;
  }
}

declare module 'react' {
  // 화면 코드가 style 로 넘기는 CSS 변수.
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
