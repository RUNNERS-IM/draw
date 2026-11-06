import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RunnersApps from '../runners/RunnersApps.js';
import { t } from '../../shared/i18n.js';
import '../runners/runners-window.css';
import './About.css';

const WEBSITE = 'https://runners.im/draw';
const GITHUB = 'https://github.com/RUNNERS-IM/draw';
const UPSTREAM = 'https://github.com/DmytroVasin/DrawPen';

// Split 의 정보 창과 같은 꼴: 아이콘 96, 이름, 「판 · 무료 오픈소스」, 웹사이트 · GitHub, 다른 앱 카드, 원본 크레딧 줄.
const About = () => {
  const [version, setVersion] = useState('');
  const root = useRef(null);
  const open = (url) => window.electronAPI.openExternal(url);

  useEffect(() => {
    window.electronAPI.getVersion().then(setVersion);

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') window.electronAPI.closeWindow();
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
      </footer>
    </main>
  );
};

createRoot(document.getElementById('root')).render(<About />);
