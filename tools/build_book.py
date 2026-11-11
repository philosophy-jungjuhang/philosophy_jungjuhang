#!/usr/bin/env python3
"""book.yml → mkdocs.yml의 nav, 부/장 안내 페이지, 홈 진행표를 만든다.
사용: python3 tools/build_book.py [--status]   (--status는 진행 상황과 다음에 쓸 페이지만 출력)
영어판: python3 tools/build_book.py --book book-en.yml --config mkdocs-en.yml --docs docs-en
문구(장, 읽기 N분 등)는 book 파일의 labels로 바꾼다. 없으면 한국어 기본값."""
import json, re, sys, pathlib, yaml
root = pathlib.Path(__file__).resolve().parent.parent
def opt(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default
BOOK, CONFIG, DOCS = opt('--book', 'book.yml'), opt('--config', 'mkdocs.yml'), opt('--docs', 'docs')
book = yaml.safe_load((root / BOOK).read_text(encoding='utf-8'))
L = {'home': '홈', 'chapter': '{n}장', 'chapter_title': '{n}장 {t}', 'written': '{k}/{n} 작성', 'read': '읽기 {m}분',
     'soon': '준비 중', 'new': '새 글', 'th': '| 부 | 이 부에서 | 진행 |', 'done_all': '완료 ({n})', 'wrote': '**{k}/{n} 작성**',
     'total': '전체 {total}페이지 중 {done}페이지를 썼어요.', **book.get('labels', {})}
q = lambda s: json.dumps(s, ensure_ascii=False)

def pdir(part): return 'appendix' if part['id'] == 'A' else f"part{part['id']}"
def cdir(ch): return f"ch{ch['num']:02d}"
def pages_of(part):
    if 'flat' in part:
        for p in part['flat']: yield (None, None, p, f"{pdir(part)}/{p['slug']}.md")
    for ch in part.get('chapters', []):
        for sec in ch['sections']:
            for p in sec['pages']: yield (ch, sec, p, f"{pdir(part)}/{cdir(ch)}/{p['slug']}.md")

allp = [(part, ch, sec, p, path) for part in book['parts'] for ch, sec, p, path in pages_of(part)]
total, done = len(allp), sum(1 for *_, p, _ in allp if p['done'])
if '--status' in sys.argv:
    print(f'진행: {done}/{total}')
    nxt = [(p['title'], path) for *_, p, path in allp if not p['done']][:5]
    for t, path in nxt: print('다음:', t, '→ docs/' + path)
    missing = [path for *_, p, path in allp if p['done'] and not (root / DOCS / path).exists()]
    if missing: print('경고: done인데 파일 없음', missing)
    sys.exit(0)

def row(href, no, title, time, soon):
    if soon: return f'<div class="soon"><span class="ep-no">{no}</span><span class="ep-title">{title}</span><span class="ep-time">{time}</span></div>'
    return f'<a href="{href}"><span class="ep-no">{no}</span><span class="ep-title">{title}</span><span class="ep-time">{time}</span></a>'

# 1) 페이지 쪽 번호표(1.1.1)와 부/장 안내 페이지
for part in book['parts']:
    d = root / DOCS / pdir(part); d.mkdir(parents=True, exist_ok=True)
    if 'flat' in part:
        rows = [row(f"{p['slug']}/", '', p['title'], L['read'].format(m=p['min']) if p['done'] else L['soon'], not p['done']) for p in part['flat']]
        (d / 'index.md').write_text(f"# {part['title']}\n\n{part['blurb']}\n\n<div class=\"ep-list\">\n" + '\n'.join(rows) + '\n</div>\n', encoding='utf-8')
        continue
    crow = []
    for ch in part['chapters']:
        n = sum(len(s['pages']) for s in ch['sections']); k = sum(1 for s in ch['sections'] for p in s['pages'] if p['done'])
        crow.append(row(f"{cdir(ch)}/", L['chapter'].format(n=ch['num']), ch['title'], L['written'].format(k=k, n=n), k == 0))
        rows = []
        for sec in ch['sections']:
            for i, p in enumerate(sec['pages'], 1):
                rows.append(row(f"{p['slug']}/", f"{sec['num']}.{i}", p['title'], L['read'].format(m=p['min']) if p['done'] else L['soon'], not p['done']))
        (d / cdir(ch)).mkdir(exist_ok=True)
        (d / cdir(ch) / 'index.md').write_text(f"# {L['chapter_title'].format(n=ch['num'], t=ch['title'])}\n\n{ch['blurb']}\n\n<div class=\"ep-list\">\n" + '\n'.join(rows) + '\n</div>\n', encoding='utf-8')
    (d / 'index.md').write_text(f"# {part['title']}\n\n{part['blurb']}\n\n<div class=\"ep-list\">\n" + '\n'.join(crow) + '\n</div>\n', encoding='utf-8')

# 2) mkdocs.yml의 nav
y = (root / CONFIG).read_text(encoding='utf-8')
y = y[:y.index('\nnav:')] + f"\nnav:\n  - {L['home']}: index.md\n"
for part in book['parts']:
    pd = pdir(part)
    if 'flat' in part:
        y += f"  - {q(part['title'])}:\n    - {pd}/index.md\n"
        for p in part['flat']:
            if p['done']: y += f"    - {q(p['title'])}: {pd}/{p['slug']}.md\n"
        continue
    y += f"  - {q(part['title'])}:\n    - {pd}/index.md\n"
    for ch in part['chapters']:
        y += f"    - {q(L['chapter_title'].format(n=ch['num'], t=ch['title']))}:\n      - {pd}/{cdir(ch)}/index.md\n"
        for sec in ch['sections']:
            ps = [p for p in sec['pages'] if p['done']]
            if not ps: continue
            y += f"      - {q(sec['num'] + ' ' + sec['title'])}:\n"
            for p in ps: y += f"        - {q(p['title'])}: {pd}/{cdir(ch)}/{p['slug']}.md\n"
(root / CONFIG).write_text(y, encoding='utf-8')

# 3) 홈: 진행표와 최근 페이지 (마커 사이만 교체)
home = root / DOCS / 'index.md'; t = home.read_text(encoding='utf-8')
tab = L['th'] + '\n|---|---|---|\n'
for part in book['parts']:
    ps = list(pages_of(part)); k = sum(1 for *_, p, _ in ps if p['done'])
    st = L['soon'] if k == 0 else (L['wrote'].format(k=k, n=len(ps)) if k < len(ps) else L['done_all'].format(n=len(ps)))
    tab += f"| [{part['title']}]({pdir(part)}/index.md) | {part['blurb'].split('. ')[0].rstrip('.')} | {st} |\n"
recent = [(p, path) for *_, p, path in allp if p['done']][-6:][::-1]
lst = '<div class="ep-list">\n' + '\n'.join(row(path[:-3] + '/', L['new'], p['title'], L['read'].format(m=p['min']), False) for p, path in recent) + '\n</div>\n'
auto = f'<!-- AUTO:progress -->\n{tab}\n' + L['total'].format(total=total, done=done) + '\n<!-- /AUTO:progress -->'
t = re.sub(r'<!-- AUTO:progress -->.*?<!-- /AUTO:progress -->', lambda m: auto, t, flags=re.S)
auto2 = f'<!-- AUTO:recent -->\n{lst}<!-- /AUTO:recent -->'
t = re.sub(r'<!-- AUTO:recent -->.*?<!-- /AUTO:recent -->', lambda m: auto2, t, flags=re.S)
home.write_text(t, encoding='utf-8')
print(f'완료: {done}/{total}페이지 반영')
