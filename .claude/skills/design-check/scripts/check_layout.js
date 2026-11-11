// 사용법: node check_layout.js <기준URL> <경로1> [경로2 ...] [--out=<스크린샷 폴더>]
// 예: node check_layout.js http://localhost:8765 / /part1/ch01/next-word/ --out=/tmp/shots
// 여러 화면 폭에서 겹침, 가로 스크롤, 글자 잘림, 메뉴 중복을 검사하고 스크린샷을 저장한다.
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const out = (args.find(a => a.startsWith('--out=')) || '--out=/tmp/design-check').slice(6);
const [base, ...paths] = args.filter(a => !a.startsWith('--out='));
if (!base || !paths.length) { console.error('사용법: node check_layout.js <기준URL> <경로...> [--out=폴더]'); process.exit(2); }
require('fs').mkdirSync(out, { recursive: true });
const WIDTHS = [360, 768, 1000, 1280, 1600];

function inPage() {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const box = e => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; };
  const hit = (a, b) => a[0] < b[1] - 1 && b[0] < a[1] - 1 && a[2] < b[3] - 1 && b[2] < a[3] - 1;
  const name = e => (e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName.toLowerCase());
  const issues = [];
  // 1) 가로 스크롤
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push(`가로 스크롤: 문서 폭 ${document.documentElement.scrollWidth} > 화면 ${innerWidth}`);
  // 2) 큰 영역끼리 겹침: 본문, 좌우 사이드바, 헤더, 탭
  const regions = ['.md-header', '.md-tabs', '.md-sidebar--primary .md-sidebar__scrollwrap', '.md-sidebar--secondary .md-sidebar__scrollwrap', '.md-content__inner']
    .map(s => [s, document.querySelector(s)]).filter(([, e]) => e && vis(e));
  for (let i = 0; i < regions.length; i++) for (let j = i + 1; j < regions.length; j++) {
    const [sa, a] = regions[i], [sb, b] = regions[j];
    if (sa === '.md-header' && sb === '.md-tabs') continue;
    if (hit(box(a), box(b))) issues.push(`영역 겹침: ${sa} × ${sb}`);
  }
  // 3) 헤더 안 요소끼리 겹침
  const hs = [...document.querySelectorAll('.md-header__inner > *')].filter(vis);
  for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) if (hit(box(hs[i]), box(hs[j]))) issues.push(`헤더 겹침: ${name(hs[i])} × ${name(hs[j])}`);
  // 4) 글자가 잘리는 요소 (본문 안, 스크롤 허용 요소 제외)
  document.querySelectorAll('.md-content__inner *').forEach(e => {
    if (!vis(e) || e.closest('pre,table,.md-typeset__scrollwrap,.highlight')) return;
    const s = getComputedStyle(e);
    if (['auto', 'scroll'].includes(s.overflowX)) return;
    if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && ['hidden', 'clip'].includes(s.overflowX)) issues.push(`글자 잘림 가능: ${name(e)} "${(e.textContent || '').trim().slice(0, 20)}"`);
  });
  // 5) 왼쪽 메뉴에서 같은 문장이 반복되는지 (Material이 같은 글자를 div로 한 번 더 감싸므로 a/label만 센다)
  const labels = [...document.querySelectorAll('.md-sidebar--primary a.md-nav__link, .md-sidebar--primary label.md-nav__link')].filter(vis).map(e => e.textContent.trim().replace(/\s+/g, ' '));
  const dup = labels.filter((t, i) => t && labels.indexOf(t) !== i);
  if (dup.length) issues.push(`메뉴 중복: ${[...new Set(dup)].join(' / ')}`);
  return issues;
}

(async () => {
  const b = await chromium.launch(); let total = 0;
  for (const path of paths) for (const w of WIDTHS) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(base.replace(/\/$/, '') + path, { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(800);
    const issues = await p.evaluate(inPage);
    const file = `${out}/${path.replace(/\W+/g, '_') || 'home'}_${w}.png`;
    await p.screenshot({ path: file });
    total += issues.length;
    console.log(`${path} @${w}px: ${issues.length ? issues.join(' | ') : '문제 없음'}  → ${file}`);
    await p.close();
  }
  await b.close();
  console.log(total ? `\n총 ${total}건 발견. 스크린샷도 눈으로 확인할 것.` : '\n자동 검사 통과. 그래도 스크린샷을 한 번은 눈으로 확인할 것.');
})();
