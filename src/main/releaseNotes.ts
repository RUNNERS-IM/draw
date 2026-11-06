// 업데이트 창의 「새로워진 점」 줄을 GitHub 릴리스 본문에서 읽는다.
// 본문 모양(RELEASE_NOTES.md): `## 한국어` 아래 `- 한 줄`, `## English` 아래 `- one line`.
// electron-updater 는 본문을 HTML 로 넘기고, 마크다운이어도 읽는다. 글자만 꺼내므로 릴리스 내용이 실행되는 일은 없다.
const MAX_LINES = 12;
const MAX_LINE_LENGTH = 300;
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function releaseNoteLines(notes: unknown, language: string) {
  const body = noteText(notes);
  if (!body) return null;
  const heading = language === 'ko' ? '한국어' : 'English';
  const lines = /<\s*h[1-6][\s>]/i.test(body) ? fromHtml(body, heading) : fromMarkdown(body, heading);
  const clean = lines
    .map((line: string) => line.replace(/\s+/g, ' ').trim())
    .filter((line: string) => line.length > 0)
    .map((line: string) => (line.length > MAX_LINE_LENGTH ? `${line.slice(0, MAX_LINE_LENGTH - 1)}…` : line))
    .slice(0, MAX_LINES);
  return clean.length > 0 ? clean : null;
}

function noteText(notes: unknown) {
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes) && notes.length > 0 && typeof notes[0]?.note === 'string') return notes[0].note as string;
  return null;
}

function fromHtml(html: string, heading: string) {
  const parts = html.split(/<\s*h[1-6][^>]*>/i).slice(1);
  for (const part of parts) {
    const end = part.search(/<\s*\/\s*h[1-6]\s*>/i);
    if (end < 0) continue;
    if (plain(part.slice(0, end)) !== heading) continue;
    const items = part.slice(end).match(/<\s*li[^>]*>[\s\S]*?<\s*\/\s*li\s*>/gi) ?? [];
    return items.map(plain);
  }
  return [];
}

function fromMarkdown(text: string, heading: string) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line: string) => /^#{1,6}\s/.test(line) && line.replace(/^#+\s*/, '').trim() === heading);
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line)) break;
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) out.push(item[1]);
  }
  return out;
}

function plain(fragment: string) {
  return fragment
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole: string, name: string) => {
      if (name[0] === '#') {
        const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
      }
      return ENTITIES[name.toLowerCase()] ?? whole;
    })
    .trim();
}
