#!/usr/bin/env python3
"""docs/에 파일이 있는 페이지를 book.yml에서 done: true로 바꾼다. 사용: python3 tools/mark_done.py && python3 tools/build_book.py"""
import pathlib, yaml, re
root = pathlib.Path(__file__).resolve().parent.parent
book = yaml.safe_load((root / 'book.yml').read_text(encoding='utf-8'))
head = ''.join(l for l in (root / 'book.yml').read_text(encoding='utf-8').splitlines(True) if l.startswith('#'))
n = 0
for part in book['parts']:
    pd = 'appendix' if part['id'] == 'A' else f"part{part['id']}"
    if 'flat' in part:
        for p in part['flat']:
            p['done'] = (root / 'docs' / pd / f"{p['slug']}.md").exists(); n += p['done']
    for ch in part.get('chapters', []):
        for s in ch['sections']:
            for p in s['pages']:
                p['done'] = (root / 'docs' / pd / f"ch{ch['num']:02d}" / f"{p['slug']}.md").exists(); n += p['done']
(root / 'book.yml').write_text(head + yaml.safe_dump(book, allow_unicode=True, sort_keys=False, width=200), encoding='utf-8')
print('done 페이지:', n)
