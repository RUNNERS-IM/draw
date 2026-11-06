// 「RUNNERS의 다른 앱」 · 「RUNNERS의 서비스」 카드. Split · Prompt · Monitor 와 같은 모양이다.
// 목록은 ~/git/runners/_docs/작업 가이드/runners-apps.json 을 복사한 것이고, 아이콘은 src/assets/runners-apps/ 에 있다.
import source from './runners-apps.json'
import { t, currentLocale } from '../../shared/i18n'
import { safeUrl } from '../../shared/safeUrl'
import './RunnersApps.css'

const pickText = (text: { ko?: string; en?: string }) =>
  (currentLocale() === 'ko' ? text.ko : text.en) || text.en || text.ko || ''

const groups = source.groups
  .map((group) => ({
    ...group,
    items: group.items
      .filter((item) => item.id !== 'draw')
      .map((item) => ({ ...item, url: safeUrl(item.url) }))
  }))
  .filter((group) => group.items.length > 0)

const RunnersApps = ({ onOpen }: { onOpen: (...args: any[]) => any }) => (
  <div className="runners-apps">
    {groups.map((group) => (
      <section
        key={group.id}
        className="runners-apps-group"
        aria-labelledby={`runners-apps-${group.id}`}
      >
        <h3 id={`runners-apps-${group.id}`} className="runners-apps-title">
          {pickText(group.title)}
        </h3>
        <ul className="runners-apps-card">
          {group.items.map((item) => (
            <li key={item.id} className="runners-apps-row">
              <img
                className="runners-apps-icon"
                src={`../assets/runners-apps/${item.icon}`}
                alt=""
                draggable={false}
              />
              <div className="runners-apps-text">
                <div className="runners-apps-name">{item.name}</div>
                <div className="runners-apps-desc">{pickText(item.desc)}</div>
              </div>
              {/* 받을 주소가 없는 줄은 눌러도 아무 일이 없는 단추를 두지 않고 단추를 뺀다. */}
              {item.url && (
                <button type="button" className="runners-apps-get" onClick={() => onOpen(item.url)}>
                  {t('about.get')}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
)

export default RunnersApps
