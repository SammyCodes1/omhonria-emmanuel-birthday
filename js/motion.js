(function () {
  var INTRO_KEY = "oe-intro";
  var INTRO_MS = 920;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header");
  var heroBg = document.querySelector(".hero-bg");
  var tributeStack = document.querySelector(".tribute-frame-stack");

  function prefersReduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  if (prefersReduced()) {
    document.documentElement.classList.remove("is-intro", "is-leaving", "is-return");
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  initIntro();
  initProgress();
  initHeader();
  initHeroLines();
  initShimmer();
  initParallax();
  initMagnetic();
  initPageTransitions();
  initExtraReveals();

  function initIntro() {
    var root = document.documentElement;
    if (!root.classList.contains("is-intro")) return;

    window.setTimeout(function () {
      root.classList.remove("is-intro");
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch (err) {}
      if (window.location.hash) {
        var target = document.querySelector(window.location.hash);
        if (target && target.scrollIntoView) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, INTRO_MS);
  }

  function initProgress() {
    var barWrap = document.createElement("div");
    barWrap.className = "scroll-progress";
    barWrap.setAttribute("aria-hidden", "true");
    var bar = document.createElement("span");
    bar.className = "scroll-progress-bar";
    barWrap.appendChild(bar);
    document.body.appendChild(barWrap);

    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  function initHeader() {
    if (!header) return;
    var ticking = false;

    function update() {
      ticking = false;
      header.classList.toggle("is-compact", window.scrollY > 24);
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  function initHeroLines() {
    var copy = document.querySelector(".hero-copy");
    if (!copy) return;

    var children = Array.prototype.slice.call(copy.children);
    children.forEach(function (el, i) {
      el.style.setProperty("--line", String(i));
    });

    var delay = document.documentElement.classList.contains("is-intro") ? 520 : 80;
    copy.style.setProperty("--hero-delay", delay + "ms");
    copy.classList.add("is-visible", "hero-is-ready");
  }

  function initShimmer() {
    var targets = document.querySelectorAll(
      ".hero-name, .section-heading, .footer-name, .give-title"
    );
    if (!targets.length || !("IntersectionObserver" in window)) return;

    targets.forEach(function (el) {
      el.classList.add("motion-shimmer");
    });

    var seen = typeof WeakSet === "function" ? new WeakSet() : null;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (seen && seen.has(entry.target)) return;
          if (seen) seen.add(entry.target);
          entry.target.classList.add("is-shimmering");
          observer.unobserve(entry.target);
          window.setTimeout(function () {
            entry.target.classList.remove("is-shimmering");
          }, 1200);
        });
      },
      { threshold: 0.55 }
    );

    function start() {
      targets.forEach(function (el) {
        observer.observe(el);
      });
    }

    if (document.documentElement.classList.contains("is-intro")) {
      window.setTimeout(start, 950);
    } else {
      start();
    }
  }

  function initParallax() {
    if (!heroBg && !tributeStack) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.innerWidth < 768) return;

    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;

      if (heroBg) {
        var hero = heroBg.closest(".hero") || heroBg.parentElement;
        var height = hero ? hero.offsetHeight : window.innerHeight;
        if (y < height * 1.15) {
          heroBg.style.setProperty("--parallax", y * 0.22 + "px");
        }
      }

      if (tributeStack) {
        var rect = tributeStack.getBoundingClientRect();
        var mid = rect.top + rect.height / 2;
        var offset = (window.innerHeight / 2 - mid) * 0.08;
        var clamped = Math.max(-18, Math.min(18, offset));
        tributeStack.style.setProperty("--parallax", clamped.toFixed(2) + "px");
      }
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  function initMagnetic() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var buttons = document.querySelectorAll(".btn-gold, .share-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("mousemove", function (event) {
        var rect = btn.getBoundingClientRect();
        var x = event.clientX - rect.left - rect.width / 2;
        var y = event.clientY - rect.top - rect.height / 2;
        btn.style.setProperty("--mx", (x * 0.22).toFixed(2) + "px");
        btn.style.setProperty("--my", (y * 0.28).toFixed(2) + "px");
        btn.classList.add("is-magnetic");
      });

      btn.addEventListener("mouseleave", function () {
        btn.classList.remove("is-magnetic");
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }

  function isInternalPageLink(anchor) {
    if (!anchor || !anchor.getAttribute) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;
    var href = anchor.getAttribute("href");
    if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
      return false;
    }
    if (href.indexOf("javascript:") === 0) return false;

    var url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (err) {
      return false;
    }
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.hash) return false;
    if (url.href.split("#")[0] === window.location.href.split("#")[0]) return false;
    return true;
  }

  function initPageTransitions() {
    document.addEventListener("click", function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var anchor = event.target.closest ? event.target.closest("a[href]") : null;
      if (!isInternalPageLink(anchor)) return;

      event.preventDefault();
      var href = anchor.href;
      document.documentElement.classList.add("is-leaving");
      window.setTimeout(function () {
        window.location.href = href;
      }, 260);
    });

    window.addEventListener("pageshow", function (event) {
      document.documentElement.classList.remove("is-leaving");
      if (event.persisted) {
        document.documentElement.classList.add("is-return");
      }
    });
  }

  function initExtraReveals() {
    var footer = document.querySelector(".footer-inner");
    if (footer && !footer.classList.contains("reveal")) {
      footer.classList.add("reveal");
      if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(
          function (entries, obs) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            });
          },
          { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
        );
        observer.observe(footer);
      } else {
        footer.classList.add("is-visible");
      }
    }
  }
})();
