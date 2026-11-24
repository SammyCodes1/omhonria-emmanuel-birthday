import { firebaseConfig } from "./firebase-config.js";

const POSITIONS = ["Family", "Friends", "Church Member", "Leader"];
const POSITION_ICONS = {
  Family:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="2.4"/><path d="M5.2 18.5v-1.4c0-2 1.7-3.6 3.8-3.6s3.8 1.6 3.8 3.6v1.4"/><circle cx="16.2" cy="9.2" r="2.1"/><path d="M13.2 18.5v-1.1c0-1.6 1.3-2.9 3-2.9s3 1.3 3 2.9v1.1"/></svg>',
  Friends:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8.5" cy="12" r="4.2"/><circle cx="15.5" cy="12" r="4.2"/></svg>',
  "Church Member":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v5"/><path d="M10 5h4"/><path d="M5 11.5 12 7l7 4.5"/><path d="M7 11.5V20h10v-8.5"/><path d="M11 20v-5h2v5"/></svg>',
  Leader:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5 14.2 9l5.8.5-4.4 3.8 1.4 5.7L12 15.8 6.99 19l1.4-5.7L4 9.5l5.8-.5L12 3.5z"/></svg>',
};
const NAME_MAX = 60;
const MESSAGE_MAX = 600;
const COOLDOWN_MS = 30000;
const PAGE = 50;
const STORAGE_KEY = "omhonria-emmanuel-wishes";
const COOLDOWN_KEY = "omhonria-emmanuel-wish-cooldown";
const FIREBASE_VERSION = "10.14.1";
const CDN = "https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/";

const form = document.querySelector("#wish-form");
const wall = document.querySelector("#wish-wall");
const statusEl = document.querySelector("#wish-status");
const countEl = document.querySelector("#wish-count");
const totalEl = document.querySelector("#wish-total");
const messageEl = document.querySelector("#wish-message");
const submitBtn = document.querySelector("#wish-submit");

if (form && wall) {
  const state = {
    wishes: [],
    usingFirebase: false,
    unsubscribe: null,
    addDoc: null,
    collectionRef: null,
    pageLimit: PAGE,
    listenWishes: null,
  };

  function cleanPosition(value) {
    const clean = sanitize(value, 40);
    return POSITIONS.indexOf(clean) === -1 ? "" : clean;
  }

  function fillPositionBadge(el, position) {
    if (!el) return;
    el.replaceChildren();
    const safe = cleanPosition(position);
    if (!safe) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    const icon = document.createElement("span");
    icon.className = "wish-position-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = POSITION_ICONS[safe] || "";
    const label = document.createElement("span");
    label.className = "wish-position-label";
    label.textContent = safe;
    el.appendChild(icon);
    el.appendChild(label);
  }

  function syncPositionMark() {
    const select = form.elements.position;
    const mark = document.querySelector("#wish-position-mark");
    fillPositionBadge(mark, select ? select.value : "");
  }

  function sanitize(value, max) {
    return String(value || "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function sanitizeMessage(value, max) {
    return String(value || "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/[<>]/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, max);
  }

  function isFirebaseConfigured(config) {
    const apiKey = config && config.apiKey ? String(config.apiKey).trim() : "";
    const projectId = config && config.projectId ? String(config.projectId).trim() : "";
    if (!apiKey || !projectId) return false;
    if (apiKey.indexOf("YOUR_") !== -1) return false;
    if (projectId === "your-project-id") return false;
    return apiKey.length > 10;
  }

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "wish-status" + (kind ? " is-" + kind : "");
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(function (wish) {
        const createdAt =
          typeof wish.createdAt === "number" ? wish.createdAt : Number(wish.createdMs) || 0;
        return {
          id: wish.id,
          name: sanitize(wish.name, NAME_MAX),
          position: cleanPosition(wish.position),
          message: sanitizeMessage(wish.message, MESSAGE_MAX),
          createdAt: createdAt,
        };
      });
    } catch (err) {
      return [];
    }
  }

  function writeLocal(list) {
    const safe = list.map(function (wish) {
      return {
        id: wish.id,
        name: wish.name,
        position: cleanPosition(wish.position),
        message: wish.message,
        createdAt: typeof wish.createdAt === "number" ? wish.createdAt : Date.now(),
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  }

  function timeOf(wish) {
    const stamp = wish.createdAt;
    if (stamp && typeof stamp.toMillis === "function") return stamp.toMillis();
    if (typeof stamp === "number") return stamp;
    return 0;
  }

  function sortWishes(list) {
    return list.slice().sort(function (a, b) {
      return timeOf(b) - timeOf(a);
    });
  }

  function visibleList() {
    const sorted = sortWishes(state.wishes);
    if (state.usingFirebase) return sorted;
    return sorted.slice(0, state.pageLimit);
  }

  function updateLoadMore() {
    const btn = document.querySelector("#wish-load-more");
    if (!btn) return;
    var hasMore = false;
    if (state.usingFirebase) {
      hasMore = state.wishes.length >= state.pageLimit;
    } else {
      hasMore = sortWishes(state.wishes).length > state.pageLimit;
    }
    btn.hidden = !hasMore;
    btn.disabled = false;
  }

  function loadMoreWishes() {
    const btn = document.querySelector("#wish-load-more");
    if (btn) btn.disabled = true;
    state.pageLimit += PAGE;
    if (state.usingFirebase && typeof state.listenWishes === "function") {
      state.listenWishes();
      return;
    }
    render();
  }

  function render() {
    const list = visibleList();
    wall.replaceChildren();

    if (totalEl) {
      const n = list.length;
      totalEl.textContent =
        n === 0 ? "No wishes yet" : n === 1 ? "Showing 1 wish" : "Showing " + n + " wishes";
    }

    if (!list.length) {
      const empty = document.createElement("p");
      empty.className = "wish-empty";
      empty.textContent = "Be the first to leave a blessing on this wall.";
      wall.appendChild(empty);
      updateLoadMore();
      return;
    }

    list.forEach(function (wish) {
      const card = document.createElement("article");
      card.className = "wish-card";

      const name = document.createElement("h3");
      name.className = "wish-name";
      name.textContent = wish.name;

      const message = document.createElement("p");
      message.className = "wish-message";
      message.textContent = wish.message;

      card.appendChild(name);
      if (wish.position) {
        const position = document.createElement("p");
        position.className = "wish-position";
        fillPositionBadge(position, wish.position);
        card.appendChild(position);
      }
      card.appendChild(message);

      wall.appendChild(card);
    });

    updateLoadMore();
  }

  function cooldownRemaining() {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    const passed = Date.now() - last;
    return passed >= COOLDOWN_MS ? 0 : COOLDOWN_MS - passed;
  }

  function markCooldown() {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  }

  function addLocal(wish) {
    const list = readLocal();
    list.push(wish);
    writeLocal(list);
    state.wishes = list;
    render();
  }

  function addRemote(wish) {
    return state.addDoc(state.collectionRef, {
      name: wish.name,
      position: wish.position,
      message: wish.message,
      createdAt: wish.createdAt,
    });
  }

  function addWish(wish) {
    if (state.usingFirebase) return addRemote(wish);
    addLocal(wish);
    return Promise.resolve();
  }

  function subscribeLocal() {
    state.wishes = readLocal();
    render();
    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEY) {
        state.wishes = readLocal();
        render();
      }
    });
  }

  async function connectFirebase() {
    if (!isFirebaseConfigured(firebaseConfig)) return false;

    const appMod = await import(CDN + "firebase-app.js");
    const dbMod = await import(CDN + "firebase-firestore.js");

    const app = appMod.initializeApp(firebaseConfig);
    const db = dbMod.getFirestore(app);

    state.usingFirebase = true;
    state.collectionRef = dbMod.collection(db, "wishes");
    state.addDoc = dbMod.addDoc;
    state.serverTimestamp = dbMod.serverTimestamp;

    state.listenWishes = function () {
      if (state.unsubscribe) state.unsubscribe();
      const wishesQuery = dbMod.query(
        state.collectionRef,
        dbMod.orderBy("createdAt", "desc"),
        dbMod.limit(state.pageLimit)
      );
      state.unsubscribe = dbMod.onSnapshot(
        wishesQuery,
        function (snapshot) {
          state.wishes = snapshot.docs.map(function (docSnap) {
            const data = docSnap.data() || {};
            return {
              id: docSnap.id,
              name: sanitize(data.name, NAME_MAX),
              position: cleanPosition(data.position),
              message: sanitizeMessage(data.message, MESSAGE_MAX),
              createdAt: data.createdAt || null,
            };
          });
          render();
        },
        function () {
          if (state.unsubscribe) state.unsubscribe();
          state.unsubscribe = null;
          state.usingFirebase = false;
          state.listenWishes = null;
          setStatus("The live wall could not be reached. Showing wishes from this browser.", "error");
          subscribeLocal();
        }
      );
    };

    state.listenWishes();

    return true;
  }

  if (messageEl && countEl) {
    messageEl.addEventListener("input", function () {
      countEl.textContent = String(messageEl.value.length);
    });
  }

  if (form.elements.position) {
    form.elements.position.addEventListener("change", syncPositionMark);
    syncPositionMark();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("");

    const honey = form.elements.company;
    if (honey && String(honey.value || "").trim()) {
      setStatus("Amen. Your wish is on the wall.", "success");
      form.reset();
      syncPositionMark();
      if (countEl) countEl.textContent = "0";
      return;
    }

    const name = sanitize(form.elements.name.value, NAME_MAX);
    const position = cleanPosition(form.elements.position.value);
    const message = sanitizeMessage(form.elements.message.value, MESSAGE_MAX);

    if (name.length < 2) {
      setStatus("Please add your name so he knows who blessed him.", "error");
      form.elements.name.focus();
      return;
    }

    if (!position) {
      setStatus("Please choose Family, Friends, Church Member, or Leader.", "error");
      form.elements.position.focus();
      return;
    }

    if (message.length < 4) {
      setStatus("Please write a short birthday message.", "error");
      form.elements.message.focus();
      return;
    }

    const wait = cooldownRemaining();
    if (wait > 0) {
      const seconds = Math.ceil(wait / 1000);
      setStatus("Please wait " + seconds + " seconds before sending another wish.", "error");
      return;
    }

    const wish = {
      id:
        window.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + "-" + Math.random().toString(16).slice(2),
      name: name,
      position: position,
      message: message,
      createdAt: state.usingFirebase ? state.serverTimestamp() : Date.now(),
    };

    submitBtn.disabled = true;
    addWish(wish)
      .then(function () {
        markCooldown();
        form.reset();
        syncPositionMark();
        if (countEl) countEl.textContent = "0";
        setStatus("Amen. Your wish is on the wall. Thank you.", "success");
        if (typeof window.burstConfetti === "function") window.burstConfetti();
        if (!state.usingFirebase) render();
      })
      .catch(function () {
        setStatus("The wish could not be saved. Please try again in a moment.", "error");
      })
      .then(function () {
        submitBtn.disabled = false;
      });
  });

  const loadMoreBtn = document.querySelector("#wish-load-more");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadMoreWishes);
  }

  connectFirebase()
    .then(function (ok) {
      if (!ok) subscribeLocal();
    })
    .catch(function () {
      state.usingFirebase = false;
      subscribeLocal();
    });
}
