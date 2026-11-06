import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../../shared/i18n.js';
import '../runners/runners-window.css';
import './Update.css';

const { answerUpdate, fitHeight, onUpdateOffer, updateOffer } = window.electronAPI;

// Split · Monitor 의 업데이트 창과 같은 꼴: 아이콘 64, 제목, 질문, 「새로워진 점」, 내려받는 동안은 진행 막대, 끝나면 [나중에] [지금 설치].
// Enter 는 설치, Escape 는 나중에(내려받는 중이면 창만 닫고, 끝나면 창이 다시 뜬다).
const Update = () => {
  const [offer, setOffer] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [more, setMore] = useState(false);
  const root = useRef(null);
  const installButton = useRef(null);
  const list = useRef(null);

  const ready = useRef(false);
  ready.current = offer !== null && !offer.downloading && !installing;
  const busy = useRef(false);
  busy.current = installing;

  const measure = () => {
    const node = list.current;
    setMore(node !== null && node.scrollHeight - node.scrollTop - node.clientHeight > 1);
  };

  const install = () => {
    if (!ready.current) return;
    setInstalling(true);
    answerUpdate('install');
  };

  useEffect(() => {
    updateOffer().then((first) => setOffer((now) => now ?? first));
    const stop = onUpdateOffer(setOffer);
    const keys = (event) => {
      if (event.key === 'Escape' && !busy.current) answerUpdate('later');
      if (event.key === 'Enter') {
        event.preventDefault();
        install();
      }
    };
    window.addEventListener('keydown', keys);
    return () => {
      stop();
      window.removeEventListener('keydown', keys);
    };
  }, []);

  const downloading = offer?.downloading ?? true;
  useEffect(() => {
    if (!downloading) installButton.current?.focus();
  }, [downloading]);

  useEffect(() => {
    const node = root.current;
    const observer = new ResizeObserver(() => fitHeight(Math.ceil(node.getBoundingClientRect().height)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const notes = offer?.notes;
  useEffect(() => {
    const node = list.current;
    if (!node) return undefined;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [notes]);

  const percent = Math.max(0, Math.min(100, Math.floor(offer?.percent ?? 0)));

  return (
    <main className="update" ref={root}>
      <img className="update-icon" src="../assets/icon.png" alt="" draggable={false} />
      <h1 className="update-title">{t('update.title')}</h1>
      <p className="update-ask">{offer ? t('update.ask', { version: offer.version }) : ' '}</p>
      {offer?.notes && (
        <section className="update-notes">
          <h2 className="update-notes-title">{t('update.notes')}</h2>
          <ul ref={list} className={`update-list${more ? ' more' : ''}`} onScroll={measure}>
            {offer.notes.map((line, index) => <li key={index}>{line}</li>)}
          </ul>
        </section>
      )}
      {offer?.downloading ? (
        <div className="update-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="update-progress-track">
            <div className="update-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="update-progress-text">{t('update.downloading', { percent })}</span>
        </div>
      ) : (
        <div className="update-buttons">
          <button type="button" className="rw-button" disabled={installing} onClick={() => answerUpdate('later')}>{t('update.later')}</button>
          <button ref={installButton} type="button" className="rw-button default" disabled={!offer || offer.downloading || installing} onClick={install}>
            {installing ? t('update.installing') : t('update.install')}
          </button>
        </div>
      )}
    </main>
  );
};

createRoot(document.getElementById('root')).render(<Update />);
