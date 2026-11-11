#!/usr/bin/env python3
"""모든 주제 페이지의 출처 절에서 링크를 모아 docs/appendix/references.md를 만든다. 사용: python3 tools/collect_refs.py"""
import pathlib, re, yaml
root = pathlib.Path(__file__).resolve().parent.parent
book = yaml.safe_load((root / 'book.yml').read_text(encoding='utf-8'))
refs = {}
for part in book['parts']:
    for ch in part.get('chapters', []):
        for s in ch['sections']:
            for p in s['pages']:
                f = root / 'docs' / f"part{part['id']}" / f"ch{ch['num']:02d}" / f"{p['slug']}.md"
                if not f.exists(): continue
                src = f.read_text(encoding='utf-8').split('## 출처와 기준')[-1]
                for title, url in re.findall(r'\[([^\]]+)\]\((https?://(?:[^()\s]|\([^()\s]*\))+)\)', src):
                    r = refs.setdefault(url, {'title': title, 'pages': []})
                    r['pages'].append((p['title'], f"../part{part['id']}/ch{ch['num']:02d}/{p['slug']}.md"))
def group(url):
    if 'plato.stanford.edu' in url: return 'Stanford Encyclopedia of Philosophy (SEP)'
    if 'iep.utm.edu' in url: return 'Internet Encyclopedia of Philosophy (IEP)'
    if 'perseus' in url or 'gutenberg' in url or 'wikisource' in url or 'ctext' in url or 'thelatinlibrary' in url: return '원전 원문·번역 (공개본)'
    return '그 밖의 자료'
order = ['Stanford Encyclopedia of Philosophy (SEP)', 'Internet Encyclopedia of Philosophy (IEP)', '원전 원문·번역 (공개본)', '그 밖의 자료']
out = ["# 참고 자료 목록", "", '<p class="ep-meta"><span>부록</span><span>2026-11-11</span></p>', "",
       "이 책의 뼈대와 대조에 쓴 기준 자료, 그리고 각 페이지 「출처와 기준」에 적힌 링크를 한곳에 모았어요. 이 목록은 `tools/collect_refs.py`로 페이지에서 자동으로 모아요.", "",
       "## 기준 자료", "",
       "- **뼈대:** Peter Adamson, [History of Philosophy without any gaps](https://historyofphilosophy.net/) (팟캐스트와 옥스퍼드대 출판부 책 시리즈). 시대와 전통(그리스, 이슬람, 인도, 중국, 아프리카)을 나누는 목차 기준으로 삼았어요(사이트의 시리즈 구분을 확인했고, 책 본문은 대조하지 못했어요).",
       "- **대조:** 교육부, 고등학교 「윤리와 사상」 교육과정 (교육부 고시 제2015-74호 [별책 6] 도덕과 교육과정). 한국·동양 사상의 범위(유교·불교·도가·한국 유학과 불교)와 용어를 맞추는 데 썼어요. 2022 개정판 고시 원문은 확인하지 못했어요.",
       "- **대조:** 나이절 워버턴, 『철학의 역사: 소크라테스부터 피터 싱어까지』, 정미화 옮김, 소소의책, 2019 (원서 *A Little History of Philosophy*, Yale University Press, 2011). 한 사람에 한 장을 주는 짜임만 참고했어요(서지 정보와 목차 일부만 확인했고, 본문 내용은 이 책에서 가져오지 않았어요).",
       "- **대조:** Nathan Smith 외, [Introduction to Philosophy](https://openstax.org/details/books/introduction-philosophy), OpenStax, 2022, CC BY-NC-SA 4.0. 서문에서 밝힌 주제별 짜임과 비서양 전통을 본문에 섞는 방식을 VII부 구성에 참고했어요(서문만 확인).",
       "- **사실 확인:** [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/), [Internet Encyclopedia of Philosophy](https://iep.utm.edu/). 페이지마다 실제로 열어 본 항목만 적었어요.", ""]
for g in order:
    items = [(u, r) for u, r in refs.items() if group(u) == g]
    if not items: continue
    out += [f"## {g}", ""]
    for u, r in sorted(items, key=lambda x: x[1]['title'].lower()):
        used = ', '.join(f"[{t}]({p})" for t, p in dict.fromkeys(r['pages']))
        out.append(f"- [{r['title']}]({u}) · 쓴 곳: {used}")
    out.append("")
(root / 'docs/appendix/references.md').write_text('\n'.join(out), encoding='utf-8')
print(len(refs), 'links')
