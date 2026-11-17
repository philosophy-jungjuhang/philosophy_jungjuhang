/* 스크롤하면 본문 덩어리가 하나씩 나타나는 효과 (토스피드 참고, 2026-11-09)
   - 한 번만 나타나고, 다시 숨지 않는다
   - 동작 줄이기 설정을 켠 사람과 스크립트가 꺼진 화면에서는 그냥 보인다 */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = '.md-content .md-typeset > *:not(script):not(style), .md-typeset .hero-text > *, .md-typeset .hero-visual, .md-typeset ul.gains > li, .md-typeset ul.parts > li';
  function setup() {
    var root = document.documentElement;
    root.classList.add('reveal-on');
    var items = Array.prototype.slice.call(document.querySelectorAll(SEL)).filter(function (el) {
      return !el.matches('.hero, ul.gains, ul.parts') && !el.closest('.md-sidebar');
    });
    var io = new IntersectionObserver(function (entries) {
      var shown = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.style.transitionDelay = Math.min(shown, 5) * 50 + 'ms';
        el.classList.add('is-in');
        shown++;
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }
  if (window.document$ && window.document$.subscribe) { window.document$.subscribe(setup); }
  else if (document.readyState !== 'loading') { setup(); }
  else { document.addEventListener('DOMContentLoaded', setup); }
})();
