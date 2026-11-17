/* 철학 정주행 서비스 워커 (빌드할 때 hooks/pwa.py가 만든다. 직접 고치지 말 것)
   - 설치할 때: 앱 뼈대(홈, 설치 안내, 스타일, 스크립트, 아이콘)만 저장
   - 페이지: 인터넷이 되면 새로 받아 저장하고, 안 되면 저장해 둔 것을 보여 준다
   - "책 전체 저장하기" 요청이 오면 모든 페이지를 받아 둔다 */
const VERSION = "5d1e403bc94a";
const CORE = "pj-core-" + VERSION;
const PAGES = "pj-pages-v1";
const ASSETS = "pj-assets-v1";
const CORE_FILES = ["./", "assets/icons/apple-touch-icon.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/maskable-192.png", "assets/icons/maskable-512.png", "assets/javascripts/bundle.60a45f97.min.js", "assets/javascripts/workers/search.f8cc74c7.min.js", "assets/owl-grin.svg", "assets/owl-logo.svg", "assets/owl-smile.svg", "assets/owl-wow.svg", "assets/owl.svg", "assets/stylesheets/main.a40c8224.min.css", "assets/stylesheets/palette.06af60db.min.css", "install/", "javascripts/app.js", "javascripts/owl.js", "javascripts/reveal.js", "manifest.webmanifest", "stylesheets/extra.css"];
const ALL_PAGES = ["appendix/glossary/", "appendix/", "appendix/reading-order/", "appendix/references/", "appendix/timeline/", "./", "install/", "part1/ch01/democritus/", "part1/ch01/heraclitus/", "part1/ch01/", "part1/ch01/parmenides/", "part1/ch01/pythagoras/", "part1/ch01/thales/", "part1/ch01/what-is-philosophy/", "part1/ch01/wonder/", "part1/ch02/examined-life/", "part1/ch02/", "part1/ch02/know-nothing/", "part1/ch02/socrates-death/", "part1/ch02/socratic-method/", "part1/ch02/sophists/", "part1/ch03/cave/", "part1/ch03/forms/", "part1/ch03/", "part1/ch03/philosopher-king/", "part1/ch03/ring-of-gyges/", "part1/ch03/soul-three/", "part1/ch04/aristotle-vs-plato/", "part1/ch04/eudaimonia/", "part1/ch04/four-causes/", "part1/ch04/golden-mean/", "part1/ch04/", "part1/ch04/political-animal/", "part1/ch04/syllogism/", "part1/", "part2/ch05/confucius-li/", "part2/ch05/confucius-ren/", "part2/ch05/", "part2/ch05/mencius/", "part2/ch05/xunzi/", "part2/ch06/", "part2/ch06/laozi-dao/", "part2/ch06/mozi/", "part2/ch06/wuwei/", "part2/ch06/zhuangzi-butterfly/", "part2/ch07/four-truths/", "part2/ch07/", "part2/ch07/nagarjuna/", "part2/ch07/no-self/", "part2/ch07/upanishad-atman/", "part2/", "part3/ch08/diogenes/", "part3/ch08/epicurus/", "part3/ch08/", "part3/ch08/skeptics/", "part3/ch08/stoics/", "part3/ch09/anselm/", "part3/ch09/aquinas/", "part3/ch09/augustine-evil/", "part3/ch09/augustine-time/", "part3/ch09/boethius/", "part3/ch09/", "part3/ch09/ockham/", "part3/ch10/al-ghazali/", "part3/ch10/averroes/", "part3/ch10/avicenna/", "part3/ch10/", "part3/ch10/translation-movement/", "part3/ch11/", "part3/ch11/jinul/", "part3/ch11/wonhyo/", "part3/", "part4/ch12/bacon/", "part4/ch12/", "part4/ch12/machiavelli/", "part4/ch12/montaigne/", "part4/ch13/cogito/", "part4/ch13/", "part4/ch13/leibniz/", "part4/ch13/methodic-doubt/", "part4/ch13/mind-body/", "part4/ch13/pascal/", "part4/ch13/spinoza/", "part4/ch14/berkeley/", "part4/ch14/hume-cause/", "part4/ch14/hume-is-ought/", "part4/ch14/hume-self/", "part4/ch14/", "part4/ch14/locke-blank-slate/", "part4/ch15/hobbes/", "part4/ch15/", "part4/ch15/locke-rights/", "part4/ch15/rousseau/", "part4/ch15/wollstonecraft/", "part4/ch15/zera-yacob/", "part4/ch16/dasan/", "part4/ch16/", "part4/ch16/toegye/", "part4/ch16/wang-yangming/", "part4/ch16/yulgok/", "part4/ch16/zhuxi/", "part4/", "part5/ch17/categorical-imperative/", "part5/ch17/hegel/", "part5/ch17/", "part5/ch17/kant-enlightenment/", "part5/ch17/kant-lens/", "part5/ch17/schopenhauer/", "part5/ch18/bentham/", "part5/ch18/", "part5/ch18/marx/", "part5/ch18/mill-harm/", "part5/ch18/mill-quality/", "part5/ch19/", "part5/ch19/kierkegaard/", "part5/ch19/nietzsche-eternal/", "part5/ch19/nietzsche-god-dead/", "part5/ch19/william-james/", "part5/", "part6/ch20/", "part6/ch20/kuhn/", "part6/ch20/popper/", "part6/ch20/wittgenstein-early/", "part6/ch20/wittgenstein-games/", "part6/ch21/arendt/", "part6/ch21/beauvoir/", "part6/ch21/camus/", "part6/ch21/heidegger/", "part6/ch21/", "part6/ch21/sartre/", "part6/ch22/foucault/", "part6/ch22/", "part6/ch22/nozick/", "part6/ch22/rawls/", "part6/ch22/ubuntu/", "part6/", "part7/ch23/", "part7/ch23/q-free-will/", "part7/ch23/q-god/", "part7/ch23/q-justice/", "part7/ch23/q-knowledge/", "part7/ch23/q-meaning/", "part7/ch23/q-mind/", "part7/ch23/q-right-wrong/", "part7/ch23/q-self/", "part7/ch24/animals/", "part7/ch24/", "part7/ch24/tech-ethics/", "part7/ch24/trolley/", "part7/"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CORE).then((c) => c.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("pj-core-") && k !== CORE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isPage(req) {
  return req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
}

async function pageFirstNetwork(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req.url.split("#")[0].split("?")[0], res.clone());
    return res;
  } catch (err) {
    const key = req.url.split("#")[0].split("?")[0];
    return (await cache.match(key)) || (await caches.match(key)) ||
      (await caches.match(new URL("./", self.registration.scope).href)) ||
      new Response("<h1>오프라인이에요</h1><p>이 페이지는 아직 저장되지 않았어요. 인터넷에 연결되면 다시 열어 주세요.</p>",
        {headers: {"Content-Type": "text/html; charset=utf-8"}});
  }
}

async function assetCacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === "opaque") (await caches.open(ASSETS)).put(req, res.clone());
    return res;
  } catch (err) {
    return new Response("", {status: 504});
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (sameOrigin && isPage(req)) { e.respondWith(pageFirstNetwork(req)); return; }
  if (url.pathname.endsWith("search_index.json")) {
    // 검색 색인은 커서 새로 받되, 안 되면 저장본을 쓴다
    e.respondWith(fetch(req).then((res) => { caches.open(ASSETS).then((c) => c.put(req, res.clone())); return res; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(assetCacheFirst(req));
});

self.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "save-all") return;
  const port = e.ports[0];
  e.waitUntil((async () => {
    const cache = await caches.open(PAGES);
    let done = 0, failed = 0;
    for (const p of ALL_PAGES) {
      const url = new URL(p, self.registration.scope).href;
      try {
        if (!(await cache.match(url))) {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res); else failed++;
        }
      } catch (err) { failed++; }
      done++;
      if (port && (done % 5 === 0 || done === ALL_PAGES.length)) port.postMessage({done, total: ALL_PAGES.length, failed});
    }
    try {
      const idx = new URL("search/search_index.json", self.registration.scope).href;
      const r = await fetch(idx); if (r.ok) await (await caches.open(ASSETS)).put(idx, r);
    } catch (err) {}
    if (port) port.postMessage({done, total: ALL_PAGES.length, failed, finished: true});
  })());
});
