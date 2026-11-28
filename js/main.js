(function () {
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  const links = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("main section[id]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mainEl = document.querySelector("main");
  const footerEl = document.querySelector(".footer");

  function setMenu(open, restoreFocus) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("is-menu-open", open);

    const lock = open && window.innerWidth < 768;
    if ("inert" in HTMLElement.prototype) {
      if (mainEl) mainEl.inert = lock;
      if (footerEl) footerEl.inert = lock;
    }

    if (open) {
      const firstLink = nav.querySelector("a");
      if (firstLink) firstLink.focus();
    } else if (restoreFocus) {
      toggle.focus();
    }
  }

  function closeMenu() {
    setMenu(false, false);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setMenu(open, !open);
    });

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false, false);
      });
    });

    nav.addEventListener("click", function (event) {
      if (event.target === nav) setMenu(false, true);
    });

    document.addEventListener("keydown", function (event) {
      const overlay = nav.classList.contains("is-open") && window.innerWidth < 768;
      if (!overlay) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(false, true);
        return;
      }

      if (event.key !== "Tab") return;
      const items = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll("a")));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) setMenu(false, false);
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          links.forEach(function (link) {
            const active = link.getAttribute("href") === "#" + id;
            link.classList.toggle("is-active", active);
          });
        });
      },
      {
        rootMargin: "-" + (header ? header.offsetHeight + 8 : 80) + "px 0px -55% 0px",
        threshold: 0.2,
      }
    );

    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  initCountdown();
  initSparkle();
  initCounters();
  initLightbox();
  initShare();
  initOfferCopy();
  initBirthdayConfetti();

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  // Next calendar date for this month and day. The year is never written on the page.
  function nextOccurrence(month, day, now) {
    const year = now.getFullYear();
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    if (now >= start && now < end) {
      return { today: true, target: null };
    }

    if (now < start) {
      return { today: false, target: start };
    }

    return { today: false, target: new Date(year + 1, month - 1, day, 0, 0, 0, 0) };
  }

  function initCountdown() {
    const hero = document.querySelector("#hero");
    const clock = document.querySelector("#countdown");
    const todayMessage = document.querySelector("#countdown-today");
    const dateLabel = document.querySelector("#hero-date");
    if (!hero || !clock || !todayMessage) return;

    const month = Number(hero.getAttribute("data-birthday-month"));
    const day = Number(hero.getAttribute("data-birthday-day"));
    if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return;

    if (dateLabel) {
      dateLabel.textContent = MONTH_NAMES[month - 1] + " " + day;
    }

    const fields = {
      days: clock.querySelector('[data-unit="days"]'),
      hours: clock.querySelector('[data-unit="hours"]'),
      minutes: clock.querySelector('[data-unit="minutes"]'),
      seconds: clock.querySelector('[data-unit="seconds"]'),
    };

    let spoken = "";

    function render() {
      const now = new Date();
      const next = nextOccurrence(month, day, now);

      if (next.today) {
        clock.hidden = true;
        todayMessage.hidden = false;
        if (spoken !== "today") {
          clock.setAttribute("aria-label", "Today is the day");
          spoken = "today";
        }
        return;
      }

      clock.hidden = false;
      todayMessage.hidden = true;

      const diff = Math.max(0, next.target.getTime() - now.getTime());
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (fields.days) fields.days.textContent = pad(days);
      if (fields.hours) fields.hours.textContent = pad(hours);
      if (fields.minutes) fields.minutes.textContent = pad(minutes);
      if (fields.seconds) fields.seconds.textContent = pad(seconds);

      function unit(count, word) {
        return count + " " + word + (count === 1 ? "" : "s");
      }

      const label =
        unit(days, "day") + ", " + unit(hours, "hour") + ", and " + unit(minutes, "minute") + " until the birthday";
      if (label !== spoken) {
        clock.setAttribute("aria-label", label);
        spoken = label;
      }
    }

    render();
    window.setInterval(render, 1000);
  }

  function initSparkle() {
    const canvas = document.querySelector("#hero-sparkle");
    const hero = document.querySelector("#hero");
    if (!canvas || !hero || reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles = [];
    let raf = 0;
    let running = false;

    function count() {
      return window.innerWidth < 768 ? 26 : 48;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = hero.clientWidth;
      const height = hero.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn(width, height);
    }

    function spawn(width, height) {
      particles = [];
      const n = count();
      for (let i = 0; i < n; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.6 + 0.4,
          speed: Math.random() * 0.28 + 0.08,
          twinkle: Math.random() * Math.PI * 2,
          drift: (Math.random() - 0.5) * 0.18,
        });
      }
    }

    function frame() {
      if (!running) return;
      const width = hero.clientWidth;
      const height = hero.clientHeight;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.y -= p.speed;
        p.x += p.drift;
        p.twinkle += 0.03;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;

        const alpha = 0.18 + Math.abs(Math.sin(p.twinkle)) * 0.62;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(240, 215, 123, " + alpha + ")";
        ctx.fill();
      }

      raf = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(raf);
    }

    resize();
    start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
  }

  function animateCount(el) {
    const target = Number(el.getAttribute("data-count"));
    const suffix = el.getAttribute("data-suffix") || "";
    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      el.textContent = target.toLocaleString("en-US") + suffix;
      return;
    }

    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString("en-US") + suffix;
      if (t < 1) window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  function initCounters() {
    const counters = document.querySelectorAll(".stat-value[data-count]");
    if (!counters.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
      return;
    }

    const grid = document.querySelector(".stat-grid");
    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          counters.forEach(animateCount);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(grid || counters[0]);
  }

  function initLightbox() {
    const lightbox = document.querySelector("#lightbox");
    const image = document.querySelector("#lightbox-image");
    const caption = document.querySelector("#lightbox-caption");
    const closeBtn = document.querySelector(".lightbox-close");
    const prevBtn = document.querySelector(".lightbox-prev");
    const nextBtn = document.querySelector(".lightbox-next");
    const items = Array.prototype.slice.call(document.querySelectorAll("[data-gallery-index]"));
    if (!lightbox || !image || !items.length) return;

    const photos = items.map(function (item) {
      const img = item.querySelector("img");
      return {
        src: img ? img.getAttribute("src") : "",
        alt: img ? img.getAttribute("alt") || "" : "",
        trigger: item,
      };
    });

    let index = 0;
    let lastFocus = null;

    function focusables() {
      return [closeBtn, prevBtn, nextBtn].filter(Boolean);
    }

    function show(i) {
      index = (i + photos.length) % photos.length;
      const photo = photos[index];
      image.src = photo.src;
      image.alt = photo.alt || "";
      if (caption) {
        var text = (photo.alt || "").trim();
        caption.textContent = text;
        caption.hidden = !text;
      }
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lightbox.hidden = false;
      document.body.classList.add("is-lightbox-open");
      closeMenu();
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.hidden = true;
      document.body.classList.remove("is-lightbox-open");
      image.removeAttribute("src");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        open(Number(item.getAttribute("data-gallery-index")) || 0);
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { show(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(index + 1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1);
        return;
      }

      if (event.key !== "Tab") return;

      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  // Gold pieces from the top of the viewport. Skipped when motion is reduced.
  function burstConfetti() {
    if (reduceMotion) return;

    const previous = document.querySelector(".confetti-layer");
    if (previous) previous.remove();

    const canvas = document.createElement("canvas");
    canvas.className = "confetti-layer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#f0d77b", "#d4af37", "#b8922a", "#faf7ef", "#e8c872"];
    const count = width < 768 ? 88 : 150;
    const pieces = [];

    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = 7 + Math.random() * 13;
      pieces.push({
        x: width * (0.18 + Math.random() * 0.64),
        y: height * (0.08 + Math.random() * 0.12),
        vx: Math.cos(angle) * speed * (0.45 + Math.random() * 0.7),
        vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 7,
        h: 9 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.26,
        color: colors[i % colors.length],
        circle: Math.random() < 0.22,
      });
    }

    const start = performance.now();
    const duration = 3200;

    function frame(now) {
      const t = (now - start) / duration;
      if (t >= 1) {
        canvas.remove();
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const fade = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;

      for (let i = 0; i < pieces.length; i += 1) {
        const piece = pieces[i];
        piece.vy += 0.2;
        piece.vx *= 0.992;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rot += piece.spin;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = piece.color;
        if (piece.circle) {
          ctx.beginPath();
          ctx.arc(0, 0, piece.w * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h * 0.45);
        }
        ctx.restore();
      }

      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  window.burstConfetti = burstConfetti;

  function initBirthdayConfetti() {
    const hero = document.querySelector("#hero");
    if (!hero || reduceMotion) return;

    const month = Number(hero.getAttribute("data-birthday-month"));
    const day = Number(hero.getAttribute("data-birthday-day"));
    const now = new Date();
    if (now.getMonth() + 1 !== month || now.getDate() !== day) return;

    window.setTimeout(burstConfetti, 350);
  }

  function initOfferCopy() {
    const buttons = document.querySelectorAll(".offer-copy");
    if (!buttons.length) return;

    function fallbackCopy(text) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      area.remove();
      return ok;
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      const label = btn.querySelector(".offer-copy-label") || btn;
      const original = label.textContent;
      const status = btn.parentNode ? btn.parentNode.querySelector(".offer-copy-status") : null;
      const number = btn.getAttribute("data-copy") || "";

      function markCopied() {
        label.textContent = "Copied";
        btn.setAttribute("aria-label", "Account number copied");
        if (status) status.textContent = "Account number copied.";
        window.setTimeout(function () {
          label.textContent = original;
          if (number) btn.setAttribute("aria-label", "Copy account number " + number);
          if (status) status.textContent = "";
        }, 1800);
      }

      btn.addEventListener("click", function () {
        const text = btn.getAttribute("data-copy") || "";
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(markCopied).catch(function () {
            if (fallbackCopy(text)) markCopied();
          });
        } else if (fallbackCopy(text)) {
          markCopied();
        }
      });
    });
  }

  function initShare() {
    const whatsapp = document.querySelector("#share-whatsapp");
    const facebook = document.querySelector("#share-facebook");
    const copyBtn = document.querySelector("#share-copy");
    const copyLabel = document.querySelector("#share-copy-label");
    const status = document.querySelector("#share-status");
    if (!whatsapp || !facebook || !copyBtn) return;

    const message =
      "Celebrating Pastor Omhonria Emmanuel. January 14. With love from Psalmist Nation Tabernacle.";

    function pageUrl() {
      return window.location.href.split("#")[0];
    }

    function refreshLinks() {
      const url = pageUrl();
      whatsapp.href = "https://wa.me/?text=" + encodeURIComponent(message + " " + url);
      facebook.href =
        "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    }

    refreshLinks();

    function markCopied() {
      if (status) status.textContent = "Link copied.";
      if (copyLabel) copyLabel.textContent = "Copied";
      window.setTimeout(function () {
        if (copyLabel) copyLabel.textContent = "Copy link";
      }, 1800);
    }

    function fallbackCopy(url) {
      const area = document.createElement("textarea");
      area.value = url;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      area.remove();
      if (ok) markCopied();
      else if (status) status.textContent = "Copy the address from the browser bar.";
    }

    copyBtn.addEventListener("click", function () {
      const url = pageUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(markCopied).catch(function () {
          fallbackCopy(url);
        });
      } else {
        fallbackCopy(url);
      }
    });
  }
})();

