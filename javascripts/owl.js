/* 페이지마다 올빼미 캐릭터 넣기 (2026-11-09 사용자 요청)
   - "10살 눈높이 한 줄 요약" 상자가 있으면 그 상자 옆에서 올빼미가 설명해 준다
   - 없으면 페이지 제목 옆에 선다
   - 표정은 페이지마다 세 가지 중 하나 (주소로 정해서 늘 같다) */
(function () {
  function setup() {
    if (document.querySelector('.md-typeset .hero')) return;
    var content = document.querySelector('.md-content .md-typeset');
    if (!content || content.querySelector('.page-owl')) return;
    var logo = document.querySelector('.md-logo img');
    if (!logo) return;
    var faces = ['grin', 'smile', 'wow'];
    var h = 0, p = location.pathname;
    for (var i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) >>> 0;
    var img = document.createElement('img');
    img.src = logo.getAttribute('src').replace('owl-logo.svg', 'owl-' + faces[h % 3] + '.svg');
    img.alt = '';
    img.className = 'page-owl';
    var tip = Array.prototype.find.call(content.querySelectorAll('.admonition.tip'), function (a) {
      var t = a.querySelector('.admonition-title');
      return t && /10살|10-year-old/.test(t.textContent);
    });
    if (tip) { tip.classList.add('has-owl'); tip.appendChild(img); return; }
    var h1 = content.querySelector('h1');
    if (h1) { img.classList.add('title-owl'); h1.parentNode.insertBefore(img, h1); }
  }
  if (window.document$ && window.document$.subscribe) { window.document$.subscribe(setup); }
  else if (document.readyState !== 'loading') { setup(); }
  else { document.addEventListener('DOMContentLoaded', setup); }
})();

/* 머리 부분의 사이트 이름을 누르면 홈으로 간다 */
(function () {
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.md-header__title');
    if (!t) return;
    var logo = document.querySelector('a.md-header__button.md-logo');
    if (logo) location.href = logo.href;
  });
})();
