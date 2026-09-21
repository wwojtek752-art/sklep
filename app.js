(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  /* ============================================================
     Pomocnicze
     ============================================================ */
  const money = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });
  const toCents = (zl) => Math.round(zl * 100);
  const fmt = (cents) => money.format(cents / 100);

  const el = (tag, attrs = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    node.append(...kids);
    return node;
  };

  // Zastępcze "zdjęcie": ikona prezentu (small/medium/large) z podpisem
  const GIFT_PX = { small: 56, medium: 84, large: 120 };
  const placeholder = (size, label = "Zdjęcie wkrótce", inline = false) => {
    const key = size in GIFT_PX ? size : "medium";
    const px = inline ? 36 : GIFT_PX[key];
    const box = el("div", { class: inline ? "thumb" : `ph ph--${key}`, role: "img", "aria-label": label });
    box.innerHTML = `<svg width="${px}" height="${px}" viewBox="0 0 64 64" aria-hidden="true"><use href="#gift"/></svg>` +
      (inline ? "" : "<span>Zdjęcie wkrótce</span>");
    return box;
  };
  /* ------------------------------------------------------------
     Animowana paczka niespodzianka (pz-): ikona SVG + pajęczyny w rogach karty.
     Jeden "komponent" z parametrem rozmiaru: small = 3, medium = 4, large = 6 słodyczy.
     Animacja jest w styles.css (sekcja "pz-"), tu tylko budujemy znaczniki.
     ------------------------------------------------------------ */
  const PZ_INK = "#1e1033";
  const PZ_OUT = `stroke="${PZ_INK}" stroke-width="2" stroke-linejoin="round"`; // kontur słodyczy pasuje do konturów kart
  const PZ_CANDY = {
    lolli: `<line x1="0" y1="10" x2="0" y2="46" stroke="#5b2a91" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-2" r="15" fill="#ff5fa2" ${PZ_OUT}/><path d="M0 -2 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    star: `<path d="M0,-15 L3.9,-5.3 L14.3,-4.6 L6.3,2 L8.8,12.1 L0,6.6 L-8.8,12.1 L-6.3,2 L-14.3,-4.6 L-3.9,-5.3z" fill="#ffd84d" ${PZ_OUT}/>`,
    wrap: `<path d="M-11 0 l-13 -9 v18z" fill="#ffd84d" ${PZ_OUT}/><path d="M11 0 l13 -9 v18z" fill="#ffd84d" ${PZ_OUT}/><ellipse cx="0" cy="0" rx="15" ry="10" fill="#8a5bd6" ${PZ_OUT}/><path d="M-8 -6 l6 12 M2 -7 l6 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    ball: `<circle cx="0" cy="0" r="13" fill="#4fc3f7" ${PZ_OUT}/><path d="M-9 -9 q10 9 0 18 M2 -12.5 q10 12.5 0 25" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    corn: `<path d="M0 -17 L-4.5 -5 H4.5z" fill="#fff" ${PZ_OUT}/><path d="M-4.5 -5 H4.5 L8.5 5 H-8.5z" fill="#ff8a1f" ${PZ_OUT}/><path d="M-8.5 5 H8.5 L12 14 Q0 18 -12 14z" fill="#ffd84d" ${PZ_OUT}/>`,
    heart: `<path d="M0 12 C-19 0 -14 -15 0 -6 C14 -15 19 0 0 12z" fill="#ff4d5e" ${PZ_OUT}/>`,
  };
  // [rodzaj, x, dx, dy, obrót, skala, opóźnienie wyskoku, opóźnienie bujania, czas bujania]
  const PZ_SIZES = {
    small:  { px: 150, candies: [["lolli", 74, -26, -72, -14, 1, .12, .7, 1.3], ["star", 100, 0, -100, 20, 1.12, .06, .6, 1.2], ["wrap", 124, 28, -80, 12, 1, .2, .9, 1.5]] },
    medium: { px: 170, candies: [["lolli", 68, -34, -68, -16, 1, .12, .7, 1.3], ["star", 90, -14, -102, 18, 1.1, .05, .6, 1.2], ["wrap", 112, 12, -96, 10, 1, .2, .9, 1.5], ["ball", 136, 30, -70, -10, 1, .28, .8, 1.4]] },
    large:  { px: 190, candies: [["lolli", 62, -40, -64, -16, 1, .12, .7, 1.3], ["corn", 78, -30, -96, -12, 1, .06, .6, 1.2], ["star", 94, -16, -116, 18, 1.1, .02, .8, 1.4], ["wrap", 110, 8, -110, 10, 1, .16, .9, 1.5], ["heart", 124, 28, -90, 14, 1, .24, .65, 1.25], ["ball", 138, 40, -62, -10, 1, .3, .85, 1.35]] },
  };
  const pzSpark = (x, y, s, color, delay) => `<g class="pz-spark" style="--sd:${delay}s"><path d="M${x} ${y} l${s} ${s * 2.7} ${s * 2.7} ${s} -${s * 2.7} ${s} -${s} ${s * 2.7} -${s} -${s * 2.7} -${s * 2.7} -${s} ${s * 2.7} -${s}z" fill="${color}"/></g>`;

  const pzIcon = (size) => {
    const cfg = PZ_SIZES[size] || PZ_SIZES.medium;
    const candies = cfg.candies.map(([kind, x, dx, dy, r, s, d, bd, bt]) =>
      `<g transform="translate(${x} 120)"><g class="pz-c" style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg;--s:${s};--d:${d}s"><g class="pz-bob" style="--bd:${bd}s;--bt:${bt}s">${PZ_CANDY[kind]}</g></g></g>`).join("");
    return `<svg class="pz-ico" viewBox="0 0 200 200" style="--pz-w:${cfg.px}px" aria-hidden="true" focusable="false">` +
      `<ellipse cx="100" cy="184" rx="58" ry="7" fill="${PZ_INK}" opacity=".28"/>` +
      pzSpark(28, 62, 3, "#ffd84d", 0) + pzSpark(168, 48, 3, "#ff5fa2", .25) +
      pzSpark(174, 110, 2, "#5b2a91", .5) + pzSpark(20, 118, 2, "#ff9a3c", .75) +
      candies +
      `<g class="pz-box"><rect x="45" y="100" width="110" height="78" rx="9" fill="#5b2a91"/><rect x="45" y="160" width="110" height="18" rx="9" fill="#000" opacity=".16"/>` +
      `<path d="M76 121 l8 -1 -6 12z M124 121 l-8 -1 6 12z" fill="#ff9a3c"/><path d="M78 143 q22 16 44 0" fill="none" stroke="#ff9a3c" stroke-width="4.5" stroke-linecap="round"/></g>` +
      `<g class="pz-lid"><rect x="38" y="80" width="124" height="28" rx="9" fill="${PZ_INK}"/><rect x="92" y="80" width="16" height="28" fill="#ff9a3c"/>` +
      `<ellipse cx="86" cy="72" rx="15" ry="9" transform="rotate(-20 86 72)" fill="#ff9a3c"/><ellipse cx="114" cy="72" rx="15" ry="9" transform="rotate(20 114 72)" fill="#ff9a3c"/>` +
      `<circle cx="100" cy="76" r="6.5" fill="#e07f14" stroke="${PZ_INK}" stroke-width="2"/></g></svg>`;
  };

  // Pajęczyna wychodząca z rogu (fx/fy: 0 = lewy/górny róg, 1 = prawy/dolny). Ten sam wzór, tylko odbity.
  const pzWebPath = (fx, fy) => {
    const X = (x) => +(fx ? 100 - x : x).toFixed(1), Y = (y) => +(fy ? 100 - y : y).toFixed(1);
    const at = (r, a) => `${X(r * Math.cos(a))} ${Y(r * Math.sin(a))}`;
    let d = "";
    for (let k = 0; k <= 4; k++) d += `M${X(0)} ${Y(0)}L${at(96, (k * Math.PI) / 8)}`;
    for (const r of [24, 44, 64, 84]) {
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 8;
        d += `M${at(r, a)}Q${at(r * 0.8, a + Math.PI / 16)} ${at(r, a + Math.PI / 8)}`;
      }
    }
    return d;
  };
  const pzWebs = () => [["tl", 0, 0], ["tr", 1, 0], ["bl", 0, 1], ["br", 1, 1]].map(([pos, fx, fy]) =>
    `<svg class="pz-web pz-${pos}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${pzWebPath(fx, fy)}" pathLength="1" fill="none" stroke="${PZ_INK}" stroke-width="1.4" stroke-linecap="round"/></svg>`).join("");

  // Zamiast zdjęcia: scena z animowaną paczką (gdy w products.js brak pola image)
  const pzStage = (p) => {
    const stage = el("div", { class: "pz-stage", role: "img", "aria-label": `Paczka niespodzianka: ${p.name}` });
    stage.innerHTML = pzIcon(p.size) +
      '<span class="pz-hint" aria-hidden="true"><span class="pz-h-hover">Najedź, aby otworzyć</span><span class="pz-h-touch">Dotknij, aby otworzyć</span></span>';
    return stage;
  };

  // Zdjęcie produktu; gdy pole image jest puste pokazujemy animowaną paczkę, a gdy plik się nie wczyta – ikonę prezentu
  const productMedia = (p, inline = false) => {
    const fallback = () => placeholder(p.size, `Zdjęcie wkrótce: ${p.name}`, inline);
    if (!p.image) return inline ? fallback() : pzStage(p);
    const img = el("img", { src: p.image, alt: inline ? "" : p.name, loading: "lazy", width: "400", height: "300" });
    const node = inline ? el("div", { class: "thumb" }, img) : img;
    img.addEventListener("error", () => node.replaceWith(fallback()), { once: true });
    return node;
  };

  /* ============================================================
     Dane sklepu (z products.js)
     ============================================================ */
  document.title = `${SHOP.name} – Paczki niespodzianki dla dzieci`;
  document.querySelectorAll("[data-shop-name]").forEach((n) => (n.textContent = SHOP.name));
  document.querySelector("[data-shop-label]").setAttribute("aria-label", `${SHOP.name} – strona główna`);
  document.querySelectorAll("[data-free-from]").forEach((n) => (n.textContent = fmt(toCents(SHOP.freeShippingFrom)).replace(",00", "")));
  $("#year").textContent = new Date().getFullYear();

  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

  /* ============================================================
     Koszyk (localStorage)
     ============================================================ */
  const CART_KEY = "halloween-cart-v1";
  const MAX_QTY = 20;

  const loadCart = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY));
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((i) => i && byId.has(i.id) && Number.isInteger(i.qty) && i.qty > 0)
        .map((i) => ({ id: i.id, qty: Math.min(i.qty, MAX_QTY) }));
    } catch { return []; }
  };
  const saveCart = () => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* tryb prywatny – trudno */ }
  };

  let cart = loadCart();

  const cartBtn = $("#cart-btn");
  const drawer = $("#drawer");
  const backdrop = $("#backdrop");
  const closeBtn = $("#cart-close");
  const itemsBox = $("#cart-items");
  const foot = $("#cart-foot");
  const countBadge = $("#cart-count");
  const checkoutMsg = $("#checkout-msg");
  const toastEl = $("#toast");

  const totals = () => {
    const items = cart.reduce((s, i) => s + toCents(byId.get(i.id).price) * i.qty, 0);
    const free = toCents(SHOP.freeShippingFrom);
    const ship = items === 0 || items >= free ? 0 : toCents(SHOP.shippingCost);
    return { items, ship, total: items + ship, free };
  };

  const changeQty = (id, delta) => {
    const line = cart.find((i) => i.id === id);
    if (!line) return;
    line.qty = Math.min(MAX_QTY, line.qty + delta);
    if (line.qty <= 0) cart = cart.filter((i) => i.id !== id);
    renderCart();
  };

  const addToCart = (id) => {
    const line = cart.find((i) => i.id === id);
    if (line) line.qty = Math.min(MAX_QTY, line.qty + 1);
    else cart.push({ id, qty: 1 });
    renderCart();
    countBadge.classList.remove("bump");
    void countBadge.offsetWidth;
    countBadge.classList.add("bump");
    toast(`Dodano do koszyka: ${byId.get(id).name}`);
  };

  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  };

  const renderCart = () => {
    saveCart();
    const qtyTotal = cart.reduce((s, i) => s + i.qty, 0);
    countBadge.textContent = qtyTotal;
    cartBtn.setAttribute("aria-label", `Koszyk, produktów: ${qtyTotal}`);
    checkoutMsg.textContent = "";

    itemsBox.replaceChildren();
    if (!cart.length) {
      itemsBox.append(el("div", { class: "empty" },
        el("p", { text: "Twój koszyk jest pusty. Wybierz paczkę z oferty." })));
      foot.hidden = true;
      return;
    }
    foot.hidden = false;

    for (const { id, qty } of cart) {
      const p = byId.get(id);
      itemsBox.append(el("div", { class: "line" },
        productMedia(p, true),
        el("div", {},
          el("h3", { text: p.name }),
          el("p", { class: "line-unit", text: `${fmt(toCents(p.price))} / szt.` })),
        el("div", { class: "line-row" },
          el("div", { class: "qty", role: "group", "aria-label": `Ilość: ${p.name}` },
            el("button", { type: "button", "aria-label": `Zmniejsz ilość: ${p.name}`, text: "−", onclick: () => changeQty(id, -1) }),
            el("output", { text: String(qty), "aria-live": "polite" }),
            el("button", { type: "button", "aria-label": `Zwiększ ilość: ${p.name}`, text: "+", onclick: () => changeQty(id, 1), ...(qty >= MAX_QTY ? { disabled: "" } : {}) })),
          el("span", { class: "line-total", text: fmt(toCents(p.price) * qty) }))));
    }

    const t = totals();
    $("#sum-items").textContent = fmt(t.items);
    $("#sum-ship").textContent = t.ship ? fmt(t.ship) : "0,00 zł (gratis)";
    $("#sum-total").textContent = fmt(t.total);
    $("#ship-msg").textContent = t.items >= t.free
      ? "Masz darmową dostawę! 🎃"
      : `Do darmowej dostawy brakuje ${fmt(t.free - t.items)}`;
    $("#ship-fill").style.width = `${Math.min(100, (t.items / t.free) * 100)}%`;
  };

  /* --- otwieranie / zamykanie panelu koszyka --- */
  let lastFocus = null;
  const openCart = () => {
    lastFocus = document.activeElement;
    drawer.classList.add("open");
    backdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    cartBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("lock");
    closeBtn.focus();
  };
  const closeCart = () => {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    cartBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("lock");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  };

  cartBtn.addEventListener("click", openCart);
  closeBtn.addEventListener("click", closeCart);
  backdrop.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (!drawer.classList.contains("open")) return;
    if (e.key === "Escape") { closeCart(); return; }
    if (e.key !== "Tab") return;
    const f = [...drawer.querySelectorAll("button:not([disabled])")].filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  $("#clear").addEventListener("click", () => { cart = []; renderCart(); closeBtn.focus(); });
  $("#checkout").addEventListener("click", () => {
    checkoutMsg.textContent = "To wersja demonstracyjna – płatności nie są jeszcze podłączone.";
  });

  /* ============================================================
     Produkty (bez filtrów – zawsze pokazujemy wszystkie paczki z products.js)
     ============================================================ */
  const grid = $("#grid");

  const renderProducts = () => {
    grid.replaceChildren(...PRODUCTS.map((p) => {
      const card = el("article", { class: p.image ? "card" : "card pz-card" },
        productMedia(p),
        el("div", { class: "card-body" },
          el("h3", { text: p.name }),
          el("p", { class: "card-desc", text: p.description }),
          el("div", { class: "card-foot" },
            el("span", { class: "price", text: fmt(toCents(p.price)) }),
            el("button", { class: "btn", type: "button", "aria-label": `Dodaj do koszyka: ${p.name}`, text: "Do koszyka", onclick: () => addToCart(p.id) }))));
      if (!p.image) card.insertAdjacentHTML("afterbegin", pzWebs()); // pajęczyny w rogach karty z animowaną paczką
      return el("li", {}, card);
    }));
  };

  // Telefony (brak hovera): dotknięcie karty z paczką włącza/wyłącza animację (klasa pz-open)
  if (matchMedia("(hover: none)").matches) {
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".pz-card");
      if (card && !e.target.closest("button")) card.classList.toggle("pz-open");
    });
  }

  // zdjęcia zastępcze w sekcjach "Opakowanie" i "Co jest w środku" (podmienisz je na <img> w index.html)
  $("#media-opakowanie").replaceChildren(placeholder("large"));
  $("#media-zawartosc").replaceChildren(placeholder("medium"));

  renderProducts();
  renderCart();

  /* ============================================================
     Menu w nagłówku (telefon: hamburger, komputer: rząd linków)
     ============================================================ */
  const menuBtn = $("#menu-btn");
  const nav = $("#nav");
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
  };
  const closeMenu = () => setMenu(false);
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  // Płynne przewijanie do sekcji (kotwice): zatrzymujemy się pod przyklejonym nagłówkiem.
  // Robimy to w JS, bo GSAP potrafi nadpisać CSS-owe scroll-behavior.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = a.getAttribute("href").length > 1 && document.querySelector(a.getAttribute("href"));
    if (a.closest("#nav")) closeMenu();
    if (!target || a.classList.contains("skip-link")) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + scrollY - (document.querySelector("#header").offsetHeight + 8);
    scrollTo({ top: Math.max(0, top), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    history.replaceState(null, "", a.getAttribute("href"));
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("open") && !e.target.closest("#nav, #menu-btn")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) { closeMenu(); menuBtn.focus(); }
  });

  /* ============================================================
     Formularz kontaktowy (na razie tylko wygląd, bez wysyłki)
     ============================================================ */
  const form = $("#contact-form");
  const formMsg = $("#form-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      formMsg.textContent = "Uzupełnij wszystkie pola i podaj poprawny adres e-mail.";
      form.querySelector(":invalid")?.focus();
      return;
    }
    formMsg.textContent = "Formularz jest jeszcze w przygotowaniu. Napisz do nas na adres e-mail powyżej.";
  });

  /* ============================================================
     Sceny 1 i 2: gwiazdy + animacja zaglądania do dyni (GSAP)
     ============================================================ */
  const header = $("#header");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const makeStars = () => {
    const box = $("#stars");
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 70; i++) {
      const s = document.createElement("span");
      const size = Math.random() < 0.85 ? 1 + Math.random() * 1.5 : 2.5 + Math.random();
      s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
        `--o:${0.35 + Math.random() * 0.6};--d:${3 + Math.random() * 4}s;--delay:${-Math.random() * 6}s`;
      frag.append(s);
    }
    box.append(frag);
  };

  const initIntro = () => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const scene = $("#intro");
    const canvas = $("#gl");
    const hint = $("#hint");
    const fill = $("#fill");
    const stars = $("#stars");
    const aura = $("#aura");

    /* ---------- Dynia 3D (Three.js, cała geometria i tekstura liczone w kodzie) ---------- */
    const RIBS = 12;       // liczba żeber
    const HEIGHT = 0.8;    // wysokość względem promienia (dynia jest szersza niż wyższa)
    const RIM = 0.62;      // kąt (od góry), na którym wycięte jest wieczko
    const WALL = 0.93;     // skala wewnętrznej ściany (grubość skórki)

    const point = (theta, phi, s = 1) => {
      const sp = Math.sin(phi);
      const rib = 1 + 0.07 * Math.cos(RIBS * theta) * Math.pow(sp, 0.6) + 0.01 * Math.sin(3 * theta + 1) * sp;
      const r = sp * rib;
      const dip = 0.1 * Math.exp(-Math.pow(phi / 0.28, 2)); // wgłębienie wokół łodyżki
      return [Math.cos(theta) * r * s, (Math.cos(phi) * HEIGHT - dip) * s, Math.sin(theta) * r * s];
    };

    // Powłoka dyni od kąta phiA do phiB. shade(v) opcjonalnie koloruje wierzchołki.
    const shell = (phiA, phiB, s, cols, rows, shade) => {
      const pos = [], uv = [], col = [], idx = [];
      for (let j = 0; j <= rows; j++) {
        const v = j / rows, phi = phiA + (phiB - phiA) * v;
        for (let i = 0; i <= cols; i++) {
          const u = i / cols;
          pos.push(...point(u * Math.PI * 2, phi, s));
          uv.push(u, 1 - v);
          if (shade) col.push(...shade(v));
        }
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      if (shade) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      // wygładzenie szwu (pierwsza i ostatnia kolumna to ten sam punkt)
      const n = g.attributes.normal;
      for (let j = 0; j <= rows; j++) {
        const a = j * (cols + 1), b = a + cols;
        const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
        const l = Math.hypot(x, y, z) || 1;
        n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
      }
      return g;
    };

    // Obrzeże otworu: pasek między zewnętrzną a wewnętrzną krawędzią
    const rimStrip = (phi, cols) => {
      const pos = [], idx = [];
      for (let i = 0; i <= cols; i++) {
        const th = (i / cols) * Math.PI * 2;
        pos.push(...point(th, phi, 1), ...point(th, phi, WALL));
      }
      for (let i = 0; i < cols; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };

    // ---- Wycięta twarz (współrzędne w jednostkach promienia dyni; sx w prawo, sy w górę) ----
    const mirrorX = (pts) => pts.map(([x, y]) => [-x, y]);
    const smile = () => {
      const n = 12, up = [], lo = [];
      for (let i = 0; i <= n; i++) {
        const x = -0.8 + (1.6 * i) / n, k = 1 - Math.pow(x / 0.8, 2);
        const yu = -0.12 - 0.3 * k, thick = 0.05 + 0.3 * k, tooth = Math.min(0.14, thick * 0.5);
        up.push([x, yu - (i % 2 ? tooth : 0)]);
        lo.push([x, yu - thick + (i % 2 ? 0 : tooth)]);
      }
      return [...up, ...lo.reverse()];
    };
    const FACE = [
      [[-0.68, 0.38], [-0.12, 0.24], [-0.42, -0.04]],   // lewe oko
      mirrorX([[-0.68, 0.38], [-0.12, 0.24], [-0.42, -0.04]]), // prawe oko
      [[0, 0.09], [-0.1, -0.09], [0.1, -0.09]],          // nos
      smile(),                                            // uśmiech z zębami
    ];

    // Tekstura skórki: pomarańcz, delikatne bruzdy między żebrami, subtelne smugi.
    // withFace: front (theta = PI/2) dostaje wyciętą twarz. Dla wieczka twarzy nie rysujemy.
    const skinTexture = (withFace, W = 2048, H = 1024, mask = false, rough = false) => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const g = c.getContext("2d");
      if (rough) {
        g.fillStyle = "#6b6b6b"; g.fillRect(0, 0, W, H);   // chropowatość skórki ~0.42, otwory 1.0 (matowa czerń)
      } else if (!mask) {
        g.fillStyle = "#ee7a1c"; g.fillRect(0, 0, W, H);
        const ribW = W / RIBS;
        for (let i = 0; i <= RIBS; i++) {
          // wybrzuszenie żebra jest w u = i/RIBS, bruzdy pośrodku między nimi
          const x0 = i * ribW;
          const gr = g.createLinearGradient(x0 - ribW / 2, 0, x0 + ribW / 2, 0);
          gr.addColorStop(0, "rgba(120,45,0,.4)");
          gr.addColorStop(0.2, "rgba(170,70,5,.08)");
          gr.addColorStop(0.5, "rgba(255,175,80,.22)");
          gr.addColorStop(0.8, "rgba(170,70,5,.08)");
          gr.addColorStop(1, "rgba(120,45,0,.4)");
          g.fillStyle = gr; g.fillRect(x0 - ribW / 2, 0, ribW, H);
        }
        for (let i = 0; i < 600; i++) {
          const x = Math.random() * W, y = Math.random() * H, len = 40 + Math.random() * 300;
          g.strokeStyle = Math.random() < 0.5 ? `rgba(110,40,0,${0.02 + Math.random() * 0.04})` : `rgba(255,190,100,${0.02 + Math.random() * 0.04})`;
          g.lineWidth = 1.2 + Math.random() * 2.5;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 6, y + len); g.stroke();
        }
      } else {
        g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
      }
      if (withFace) {
        // punkt na powierzchni -> piksel tekstury (u rośnie w lewo patrząc z przodu, dlatego "-")
        const toPx = ([sx, sy], dx = 0, dy = 0) => {
          const phi = Math.PI / 2 - (sy + dy) / 0.85;
          const theta = Math.PI / 2 - (sx + dx) / Math.max(0.35, Math.sin(phi));
          return [(theta / (Math.PI * 2)) * W, ((phi - RIM) / (Math.PI - RIM)) * H];
        };
        const poly = (pts, color, dx, dy) => {
          g.beginPath();
          pts.forEach((pt, k) => { const [x, y] = toPx(pt, dx, dy); k ? g.lineTo(x, y) : g.moveTo(x, y); });
          g.closePath(); g.fillStyle = color; g.fill();
        };
        for (const shape of FACE) {
          if (!mask && !rough) poly(shape, "#f6c86a", -0.014, -0.024); // jasny miąższ na przeciętej krawędzi
          poly(shape, rough ? "#fff" : "#050208");             // czarny środek: dynia jest pusta w środku
        }
      }
      const t = new THREE.CanvasTexture(c);
      if (!rough) t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.anisotropy = 8;
      return t;
    };
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const three = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);

    three.add(new THREE.HemisphereLight(0x9b8cff, 0x3a1a10, 0.75));
    const key = new THREE.DirectionalLight(0xffe0bd, 2.1); key.position.set(2.5, 3.5, 4); three.add(key);
    const rimLight = new THREE.DirectionalLight(0x8f7bff, 0.9); rimLight.position.set(-4, 2.5, -3); three.add(rimLight);
    const glow = new THREE.PointLight(0xff8a2a, 1.4, 5); glow.position.set(0, 0.3, 0); three.add(glow);

    const skin = new THREE.MeshStandardMaterial({ map: skinTexture(true), roughnessMap: skinTexture(true, 2048, 1024, false, true), roughness: 1, metalness: 0 });
    const pumpkin = new THREE.Group();
    three.add(pumpkin);

    // korpus (od otworu w dół)
    pumpkin.add(new THREE.Mesh(shell(RIM, Math.PI, 1, 240, 130), skin));
    // wnętrze: jasne, świecące, ciemniejsze tuż przy krawędzi
    const c1 = new THREE.Color("#ff9a3c");
    const inner = new THREE.Mesh(
      shell(RIM, Math.PI, WALL, 96, 60, (v) => { const f = 0.55 + 0.45 * Math.min(1, v * 2.2); return [c1.r * f, c1.g * f, c1.b * f]; }),
      new THREE.MeshBasicMaterial({ vertexColors: true, map: skinTexture(true, 1024, 512, true), side: THREE.BackSide, toneMapped: false }));
    pumpkin.add(inner);
    const flesh = new THREE.MeshStandardMaterial({ color: 0xf0a955, roughness: 0.8, side: THREE.DoubleSide });
    pumpkin.add(new THREE.Mesh(rimStrip(RIM, 96), flesh));

    // wieczko z łodyżką
    const lid = new THREE.Group();
    const cap = new THREE.Mesh(shell(0, RIM, 1, 168, 40), new THREE.MeshStandardMaterial({ map: skinTexture(false, 1024, 512), roughness: 0.42, side: THREE.DoubleSide }));
    lid.add(cap);
    lid.add(new THREE.Mesh(shell(0, RIM, WALL, 96, 24), new THREE.MeshStandardMaterial({ color: 0xe9a24e, roughness: 0.85, side: THREE.BackSide })));
    lid.add(new THREE.Mesh(rimStrip(RIM, 96), flesh));

    const profile = [[0.21, 0], [0.16, 0.05], [0.12, 0.14], [0.105, 0.25], [0.118, 0.32], [0.09, 0.36], [0.0, 0.375]].map(([r, y]) => new THREE.Vector2(r, y));
    const stemGeo = new THREE.LatheGeometry(profile, 24, 0, Math.PI * 2);
    const sp = stemGeo.attributes.position, sc = [];
    const green = new THREE.Color("#5f8a2e"), brown = new THREE.Color("#7a5a2a");
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i), a = Math.atan2(z, x);
      const k = 1 + 0.09 * Math.cos(5 * a);
      const bend = 0.22 * Math.pow(y / 0.375, 2);
      sp.setXYZ(i, x * k + bend, y, z * k);
      const m = THREE.MathUtils.smoothstep(y, 0.28, 0.375);
      const col = green.clone().lerp(brown, m);
      sc.push(col.r, col.g, col.b);
    }
    stemGeo.setAttribute("color", new THREE.Float32BufferAttribute(sc, 3));
    stemGeo.computeVertexNormals();
    const stem = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }));
    stem.position.y = HEIGHT - 0.1 - 0.02;
    lid.add(stem);
    pumpkin.add(lid);

    /* ---------- Kamera: stan animowany przez GSAP ---------- */
    // e – wysokość kamery nad horyzontem (0 = z boku, PI/2 = pionowo z góry)
    // k – mnożnik dystansu, ty – wysokość punktu, w który patrzymy, lift – odlot wieczka, spin – obrót dyni
    const cam = { e: 0, k: 1, ty: 0.15, lift: 0, spin: 0 };
    let dirty = true, finished = false;

    // dystans startowy dobrany tak, by cała dynia z łodyżką mieściła się w kadrze (też na telefonie)
    const baseDist = () => {
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return Math.max(3.3 / (2 * t * camera.aspect), 3.3 / (2 * t));
    };

    const resize = () => {
      const w = scene.clientWidth, h = scene.clientHeight;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    };

    const draw = () => {
      if (finished || !dirty) return;
      dirty = false;
      const e = cam.e, dist = baseDist() * cam.k;
      camera.position.set(0, cam.ty + Math.sin(e) * dist, Math.cos(e) * dist);
      camera.up.set(0, Math.cos(e), -Math.sin(e));
      camera.lookAt(0, cam.ty, 0);
      pumpkin.rotation.y = cam.spin;
      const L = cam.lift;
      lid.visible = L < 0.985;
      lid.position.set(L * 0.7, L * 4.6, L * 0.4);
      lid.rotation.set(L * 0.5, L * 1.6, -L * 0.8);
      glow.intensity = 1.4 * (1 - Math.min(1, cam.e / 1.2)) + 0.3;
      renderer.render(three, camera);
    };

    resize();
    addEventListener("resize", resize);
    gsap.ticker.add(draw);

    // Sekwencja (jednostki czasu = kawałki scrolla):
    //  0.0–1.8  wieczko odlatuje w górę, napis znika
    //  0.3–6.4  kamera unosi się z 0° (twarzą w twarz) do 90° (pionowo w dół)
    //  4.2–8.8  kamera zjeżdża do wnętrza dyni
    //  7.4–9.4  wnętrze wypełnia ekran kolorem #FF9A3C
    //  9.4–10.4 scena znika, pod nią jest już sklep
    const T_FILL_END = 9.4;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: () => {
        dirty = true;
        const t = tl.time();
        header.classList.toggle("on-shop", t > 8.6);
        if (t <= 8.6) closeMenu();
        finished = t >= T_FILL_END;
        scene.classList.toggle("done", finished);
      },
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: "+=140%",
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(hint, { opacity: 0, y: -14, duration: 0.5 }, 0)
      .to(cam, { lift: 1, duration: 1.8, ease: "power2.in" }, 0)
      .to(cam, { e: Math.PI / 2, duration: 6.1, ease: "power1.inOut" }, 0.3)
      .to(cam, { spin: 0.3, duration: 6.5 }, 0)
      .to(cam, { ty: -0.3, duration: 5.8, ease: "power1.inOut" }, 3)
      .to(cam, { k: () => 0.32 / baseDist(), duration: 4.6, ease: "power2.in" }, 4.2)
      .to(aura, { opacity: 0, duration: 5 }, 1)
      .to(stars, { scale: 1.25, duration: 8 }, 0)
      .to(fill, { opacity: 1, duration: 2 }, 7.4)
      .to(scene, { opacity: 0, duration: 1 }, T_FILL_END);
  };

  makeStars();

  const canWebGL = () => {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
  };

  if (reduced || !window.gsap || !window.ScrollTrigger || !window.THREE || !canWebGL()) {
    root.classList.add("no-intro");
  } else {
    initIntro();
  }
})();