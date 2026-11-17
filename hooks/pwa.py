"""앱 설치(PWA)용 서비스 워커를 빌드 끝에 만든다 (2026-11-17).
site/sw.js: 앱 뼈대 파일 목록과 전체 페이지 목록, 내용이 바뀌면 바뀌는 버전 값을 넣는다."""
import hashlib, json, pathlib

def on_post_build(config, **kwargs):
    site = pathlib.Path(config["site_dir"])
    files = sorted(p for p in site.rglob("*") if p.is_file() and not p.name.endswith(".map") and p.name != "sw.js")
    h = hashlib.sha1()
    for p in files:
        h.update(str(p.relative_to(site)).encode()); h.update(p.read_bytes())
    rel = lambda p: p.relative_to(site).as_posix()
    pages = []
    for p in files:
        r = rel(p)
        if r.endswith("index.html"):
            pages.append(r[: -len("index.html")] or "./")
    core = ["./", "install/", "manifest.webmanifest"]
    for p in files:
        r = rel(p)
        if r.startswith("assets/javascripts/") and "/lunr/" not in r and r.endswith(".js"): core.append(r)
        elif r.startswith("assets/stylesheets/") and r.endswith(".css"): core.append(r)
        elif r.startswith(("assets/icons/", "javascripts/", "stylesheets/")) or (r.startswith("assets/owl") and r.endswith(".svg")): core.append(r)
    tpl = (pathlib.Path(config["config_file_path"]).parent / "hooks" / "sw.template.js").read_text(encoding="utf-8")
    out = (tpl.replace("__VERSION__", h.hexdigest()[:12])
              .replace("__CORE__", json.dumps(sorted(set(core)), ensure_ascii=False))
              .replace("__PAGES__", json.dumps(pages, ensure_ascii=False)))
    (site / "sw.js").write_text(out, encoding="utf-8")
