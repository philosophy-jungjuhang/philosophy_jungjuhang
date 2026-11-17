/* 앱 설치(PWA) 도우미 (2026-11-17 사용자 요청)
   - 서비스 워커 등록(오프라인 읽기)
   - 크롬·엣지·삼성 인터넷처럼 설치 창을 띄울 수 있는 브라우저: [data-install] 버튼과 머리 부분 "앱 설치" 버튼이 설치 창을 연다
   - 그 밖의 브라우저(사파리, 파이어폭스 등): 설치 안내 페이지로 보낸다
   - 설치 안내 페이지: 지금 쓰는 브라우저의 방법을 맨 위로 올리고, "책 전체 저장하기"를 처리한다 */
(function () {
  var APP = window.PJ_APP || {};
  var deferred = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if ('serviceWorker' in navigator && APP.sw && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register(APP.sw).catch(function () {}); });
  }

  function browser() {
    var ua = navigator.userAgent;
    var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) return 'ios';
    if (/SamsungBrowser/.test(ua)) return 'samsung';
    if (/Android/.test(ua) && /Firefox/.test(ua)) return 'android-firefox';
    if (/Android/.test(ua)) return 'android-chrome';
    if (/Firefox/.test(ua)) return 'desktop-firefox';
    if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return 'mac-safari';
    if (/Chrome|Chromium|Edg/.test(ua)) return 'desktop-chromium';
    return 'other';
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    document.documentElement.classList.add('pj-can-install');
  });
  window.addEventListener('appinstalled', function () {
    deferred = null;
    document.documentElement.classList.remove('pj-can-install');
    document.documentElement.classList.add('pj-installed');
  });

  function askInstall(ev) {
    if (deferred) {
      if (ev) ev.preventDefault();
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; document.documentElement.classList.remove('pj-can-install'); });
      return true;
    }
    return false;
  }

  function setup() {
    if (standalone) document.documentElement.classList.add('pj-installed');
    document.querySelectorAll('[data-install]').forEach(function (a) {
      if (a.dataset.pjBound) return;
      a.dataset.pjBound = '1';
      a.addEventListener('click', function (ev) { askInstall(ev); });
    });
    var inner = document.querySelector('.md-header__inner');
    if (inner && !standalone && !inner.querySelector('.pj-install-btn')) {
      var b = document.createElement('a');
      b.className = 'pj-install-btn';
      b.href = APP.install || 'install/';
      b.setAttribute('aria-label', '앱으로 설치');
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>앱 설치</span>';
      b.addEventListener('click', function (ev) { askInstall(ev); });
      var search = inner.querySelector('.md-search');
      inner.insertBefore(b, search || null);
    }
    var guide = document.querySelector('.pj-guides');
    if (guide && !guide.dataset.pjDone) {
      guide.dataset.pjDone = '1';
      var mine = guide.querySelector('[data-guide="' + browser() + '"]');
      if (mine) { mine.classList.add('is-mine'); guide.insertBefore(mine, guide.firstChild); }
      var st = document.querySelector('.pj-status');
      if (st) st.textContent = standalone ? '지금 앱으로 보고 있어요. 이미 설치됐어요.' : '';
    }
    var save = document.querySelector('[data-save-all]');
    if (save && !save.dataset.pjBound) {
      save.dataset.pjBound = '1';
      var out = document.querySelector('.pj-save-status');
      save.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (!('serviceWorker' in navigator)) { out.textContent = '이 브라우저는 오프라인 저장을 지원하지 않아요.'; return; }
        out.textContent = '준비 중이에요…';
        navigator.serviceWorker.ready.then(function (reg) {
          var ch = new MessageChannel();
          ch.port1.onmessage = function (m) {
            var d = m.data;
            out.textContent = d.finished
              ? '다 저장했어요. 이제 인터넷 없이도 모든 페이지를 읽을 수 있어요.' + (d.failed ? ' (' + d.failed + '쪽은 실패했어요. 나중에 다시 눌러 주세요.)' : '')
              : '저장하는 중… ' + d.done + ' / ' + d.total;
          };
          (reg.active || navigator.serviceWorker.controller).postMessage({type: 'save-all'}, [ch.port2]);
        });
      });
    }
  }
  if (window.document$ && window.document$.subscribe) { window.document$.subscribe(setup); }
  else if (document.readyState !== 'loading') { setup(); }
  else { document.addEventListener('DOMContentLoaded', setup); }
})();
