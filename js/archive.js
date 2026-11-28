(function () {
  /*
    PHOTO ARCHIVE LIST
    ------------------
    To add a photograph:
      1. Save the file in the images/ folder (for example images/gallery7.jpg).
      2. Add an object to ARCHIVE_PHOTOS below, using this shape:
           { src: "images/gallery7.jpg", alt: "A short description of the photograph", category: "ministry" }
      3. Use "ministry" or "portraits", or add a new lowercase category (a filter chip will appear on its own).

    Logos, SVG icons, and designed share graphics should not be added here.
  */
  var ARCHIVE_PHOTOS = [
    {
      src: "images/archive-wife.jpg",
      alt: "The Wife of His Youth",
      caption: "The Wife of His Youth",
      category: "ministry",
      tall: true,
      featured: "wife"
    },
    {
      src: "images/archive-wife-2.jpg",
      alt: "The Wife of His Youth",
      caption: "The Wife of His Youth",
      category: "ministry",
      tall: true,
      featured: "wife2"
    },
    {
      src: "images/archive-friend.jpg",
      alt: "His Beloved Friend",
      caption: "His Beloved Friend",
      category: "ministry",
      group: true,
      friend: true
    },
    {
      src: "images/archive-leaders.jpg",
      alt: "With The Leaders",
      caption: "With The Leaders",
      category: "ministry",
      group: true,
      featured: "leaders"
    },
    {
      src: "images/archive-ushering.jpg",
      alt: "The Ushering and Protocol Unit",
      caption: "The Ushering and Protocol Unit",
      category: "ministry",
      group: true
    },
    {
      src: "images/archive-choir.jpg",
      alt: "The Choir Unit",
      caption: "The Choir Unit",
      category: "ministry",
      group: true
    },
    {
      src: "images/archive-media.jpg",
      alt: "The Media Unit",
      caption: "The Media Unit",
      category: "ministry",
      group: true
    },
    {
      src: "images/archive-sanitation.jpg",
      alt: "The Sanitation Unit",
      caption: "The Sanitation Unit",
      category: "ministry",
      group: true
    },
    {
      src: "images/gallery-celebrant-bw.jpg",
      alt: "The Birthday Celebrant",
      caption: "The Birthday Celebrant",
      category: "portraits",
      portrait: true,
      topPair: true
    },
    {
      src: "images/pastor-portrait.jpg",
      alt: "The Birthday Celebrant",
      caption: "The Birthday Celebrant",
      category: "portraits",
      portrait: true,
      mobileFeature: true
    },
    {
      src: "images/gallery-mentor.jpg",
      alt: "",
      category: "ministry"
    },
    {
      src: "images/gallery-psalmist.jpg",
      alt: "",
      category: "ministry"
    },
    {
      src: "images/gallery-father.jpg",
      alt: "",
      category: "ministry"
    },
    {
      src: "images/pastor.jpg",
      alt: "The Birthday Celebrant",
      category: "portraits"
    },
    {
      src: "images/gallery-celebrant-jacket.jpg",
      alt: "The Birthday Celebrant",
      category: "portraits"
    },
    {
      src: "images/gallery-celebrant-smile.jpg",
      alt: "The Birthday Celebrant",
      category: "portraits"
    },
    {
      src: "images/archive-pulpit.jpg",
      alt: "Preaching at a clear pulpit",
      category: "ministry"
    },
    {
      src: "images/gallery-teacher.jpg",
      alt: "",
      category: "ministry"
    },
    {
      src: "images/gallery-priest.jpg",
      alt: "",
      category: "ministry"
    },
    {
      src: "images/gallery-shepherd.jpg",
      alt: "",
      category: "ministry"
    }
  ];

  var CATEGORY_LABELS = {
    ministry: "Ministry",
    portraits: "Portraits"
  };

  var grid = document.querySelector("#archive-grid");
  var filterBar = document.querySelector("#archive-filters");
  var empty = document.querySelector("#archive-empty");
  if (!grid) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var currentFilter = "all";

  function labelFor(slug) {
    if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  function categories() {
    var found = [];
    ARCHIVE_PHOTOS.forEach(function (photo) {
      if (photo.category && found.indexOf(photo.category) === -1) found.push(photo.category);
    });
    return found;
  }

  function renderFilters() {
    if (!filterBar) return;
    var cats = categories();
    var html = '<button class="archive-filter is-active" type="button" data-filter="all" aria-pressed="true">All</button>';
    cats.forEach(function (cat) {
      html +=
        '<button class="archive-filter" type="button" data-filter="' +
        cat +
        '" aria-pressed="false">' +
        labelFor(cat) +
        "</button>";
    });
    filterBar.innerHTML = html;
  }

  function renderGrid() {
    grid.innerHTML = "";
    ARCHIVE_PHOTOS.forEach(function (photo, index) {
      var card = document.createElement("figure");
      card.className = "archive-card reveal";
      if (photo.featured === "wife") card.className += " archive-card--wife";
      if (photo.featured === "wife2") card.className += " archive-card--wife-2";
      if (photo.featured === "leaders") card.className += " archive-card--leaders";
      if (photo.mobileFeature) card.className += " archive-card--mobile-feature";
      if (photo.topPair) card.className += " archive-card--top-pair";
      card.setAttribute("data-category", photo.category || "ministry");

      var button = document.createElement("button");
      button.className = "archive-item";
      if (photo.portrait) button.className += " is-portrait";
      if (photo.group) button.className += " is-group";
      if (photo.tall) button.className += " is-tall";
      if (photo.friend) button.className += " is-friend";
      button.type = "button";
      button.setAttribute("data-archive-index", String(index));
      button.setAttribute("data-category", photo.category || "ministry");
      button.setAttribute("aria-label", "View " + (photo.alt || photo.caption || "photograph"));

      var mat = document.createElement("span");
      mat.className = "gallery-mat";

      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.alt || "";
      img.loading = "eager";
      img.decoding = "async";

      var overlay = document.createElement("span");
      overlay.className = "gallery-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.textContent = "View";

      mat.appendChild(img);
      mat.appendChild(overlay);
      button.appendChild(mat);
      card.appendChild(button);

      var captionText = (photo.caption || "").trim();
      if (captionText) {
        var cap = document.createElement("figcaption");
        cap.className = "gallery-caption";
        cap.textContent = captionText;
        card.appendChild(cap);
      }

      grid.appendChild(card);
    });
  }

  function visibleButtons() {
    return Array.prototype.slice.call(grid.querySelectorAll(".archive-item")).filter(function (btn) {
      var card = btn.closest(".archive-card");
      return !btn.hidden && !(card && card.hidden);
    });
  }

  function applyFilter(slug) {
    currentFilter = slug || "all";
    var buttons = grid.querySelectorAll(".archive-item");
    var shown = 0;
    Array.prototype.forEach.call(buttons, function (btn) {
      var match = currentFilter === "all" || btn.getAttribute("data-category") === currentFilter;
      var card = btn.closest(".archive-card") || btn;
      card.hidden = !match;
      btn.hidden = !match;
      if (match) {
        shown += 1;
        if (reduceMotion) {
          btn.classList.add("is-visible");
          card.classList.add("is-visible");
        }
      }
    });
    if (empty) empty.classList.toggle("is-visible", shown === 0);

    if (filterBar) {
      Array.prototype.forEach.call(filterBar.querySelectorAll(".archive-filter"), function (chip) {
        var on = chip.getAttribute("data-filter") === currentFilter;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }

  function initFilters() {
    if (!filterBar) return;
    filterBar.addEventListener("click", function (event) {
      var chip = event.target.closest ? event.target.closest(".archive-filter") : null;
      if (!chip) return;
      applyFilter(chip.getAttribute("data-filter"));
    });
  }

  function initLightbox() {
    var lightbox = document.querySelector("#lightbox");
    var image = document.querySelector("#lightbox-image");
    var caption = document.querySelector("#lightbox-caption");
    var closeBtn = document.querySelector(".lightbox-close");
    var prevBtn = document.querySelector(".lightbox-prev");
    var nextBtn = document.querySelector(".lightbox-next");
    if (!lightbox || !image) return;

    var index = 0;
    var lastFocus = null;

    function set(i, list) {
      var items = list || visibleButtons();
      if (!items.length) return;
      index = (i + items.length) % items.length;
      var photoIndex = Number(items[index].getAttribute("data-archive-index"));
      var photo = ARCHIVE_PHOTOS[photoIndex];
      if (!photo) return;
      image.src = photo.src;
      image.alt = photo.alt || "";
      if (caption) {
        var text = (photo.alt || "").trim();
        caption.textContent = text;
        caption.hidden = !text;
      }
    }

    function open(fromButton) {
      var items = visibleButtons();
      var start = items.indexOf(fromButton);
      if (start < 0) start = 0;
      lastFocus = document.activeElement;
      set(start, items);
      lightbox.hidden = false;
      document.body.classList.add("is-lightbox-open");
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.hidden = true;
      document.body.classList.remove("is-lightbox-open");
      image.removeAttribute("src");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    grid.addEventListener("click", function (event) {
      var btn = event.target.closest ? event.target.closest(".archive-item") : null;
      if (!btn || btn.hidden) return;
      open(btn);
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", function () { set(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { set(index + 1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        set(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        set(index + 1);
      }
    });
  }

  renderFilters();
  renderGrid();
  applyFilter("all");
  initFilters();
  initLightbox();
})();
