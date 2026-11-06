import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RunnersApps from '../runners/RunnersApps';
import { t } from '../../shared/i18n';
import '../runners/runners-window.css';
import './About.css';

const WEBSITE = 'https://runners.im/draw';
const GITHUB = 'https://github.com/RUNNERS-IM/draw';
const UPSTREAM = 'https://github.com/DmytroVasin/DrawPen';

// THIRD_PARTY_NOTICES.md 는 누를 때만 읽어 정보 창을 여는 시간을 늘리지 않는다.
const openNotices = async (show: any) => {
  const file = await import('../../../THIRD_PARTY_NOTICES.md?raw');
  show(file.default);
};

// Split 의 고지 시트와 같은 꼴: 제목, 「#」 줄을 굵게 한 스크롤 본문, 닫기 단추.
const NoticesSheet = ({ text, onClose }: { text: string; onClose: (...args: any[]) => any }) => {
  const blocks = useMemo(() => text.split(/\n(?=# )/), [text]);
  return (
    <div className="notices-backdrop" onClick={onClose}>
      <section className="notices" role="dialog" aria-modal="true" aria-labelledby="notices-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="notices-title" className="notices-title">{t('about.notices')}</h2>
        <div className="notices-body">
          {blocks.map((block: string, index: number) => {
            const [first, ...rest] = block.split('\n');
            return (
              <div key={index} className="notices-block">
                {first.startsWith('# ') ? <h3>{first.slice(2)}</h3> : <p>{first}</p>}
                <p>{rest.join('\n').trim()}</p>
              </div>
            );
          })}
        </div>
        <div className="notices-actions">
          <button type="button" className="notices-close" onClick={onClose}>{t('about.close')}</button>
        </div>
      </section>
    </div>
  );
};

// Split 의 정보 창과 같은 꼴: 아이콘 96, 이름, 「판 · 무료 오픈소스」, 웹사이트 · GitHub, 다른 앱 카드, 원본 크레딧 · 고지 줄.
const About = () => {
  const [version, setVersion] = useState('');
  const [notices, setNotices] = useState<any>(null);
  const root = useRef<any>(null);
  const open = (url: string) => window.electronAPI.openExternal(url);

  useEffect(() => {
    window.electronAPI.getVersion().then(setVersion);

    const closeOnEscape = (event: any) => {
      if (event.key !== 'Escape') return;
      // 고지 시트가 열려 있으면 Esc 는 시트만 닫는다.
      if (document.querySelector('.notices')) setNotices(null);
      else window.electronAPI.closeWindow();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    const node = root.current;
    const observer = new ResizeObserver(() => window.electronAPI.fitHeight(Math.ceil(node.getBoundingClientRect().height)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="about" ref={root}>
      <header className="about-header">
        <img className="about-icon" src="../assets/icon.png" alt="" draggable={false} />
        <h1 className="about-name">Draw</h1>
        <p className="about-line">{version ? t('about.line', { version }) : ' '}</p>
        <div className="about-links">
          <button type="button" className="about-link" onClick={() => open(WEBSITE)}>{t('about.website')}</button>
          <button type="button" className="about-link" onClick={() => open(GITHUB)}>GitHub</button>
        </div>
      </header>
      <RunnersApps onOpen={open} />
      <footer className="about-credit">
        <button type="button" className="about-notices-link" onClick={() => open(UPSTREAM)}>{t('about.credit')}</button>
        {' · '}
        <button type="button" className="about-notices-link" onClick={() => openNotices(setNotices)}>{t('about.notices')}</button>
      </footer>
      {notices !== null && <NoticesSheet text={notices} onClose={() => setNotices(null)} />}
    </main>
  );
};

createRoot(document.getElementById('root')!).render(<About />);
