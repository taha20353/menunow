/* MenuNow QR menu — no dependencies. Reads window.PLACE and window.MENU from menu.js */
(function () {
  "use strict";
  const P = window.PLACE, M = window.MENU;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => `${Number(n).toLocaleString("en-US")} ${P.currency || "ج.م"}`;
  const norm = (s) => String(s).toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ً-ْ]/g, "");
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const params = new URLSearchParams(location.search);
  const TABLE = (params.get("t") || params.get("table") || "").replace(/\D/g, "").slice(0, 4);
  const canOrder = !!(P.whatsapp || P.demo) && !!P.ordering;

  /* ---------- theme + header ---------- */
  const r = document.documentElement.style;
  const C = P.colors || {};
  if (C.brand) r.setProperty("--brand", C.brand);
  if (C.accent) r.setProperty("--accent", C.accent);
  if (C.bg) r.setProperty("--bg", C.bg);
  if (C.ink) r.setProperty("--ink", C.ink);
  document.querySelector('meta[name="theme-color"]').content = C.brand || "#1d1a16";
  document.title = `${P.name} | المنيو`;
  document.querySelector('meta[name="description"]').content = `منيو ${P.name}${P.address ? " — " + P.address : ""}: الأصناف والأسعار${canOrder ? " واطلب على واتساب" : ""}.`;
  $("#name").textContent = P.name;
  $("#tagline").textContent = P.tagline || "";
  const logo = $("#logo");
  if (/\.(png|jpe?g|webp|svg)$/i.test(P.logo || "")) logo.innerHTML = `<img src="${esc(P.logo)}" alt="">`;
  else logo.textContent = P.logo || P.name.trim()[0];
  if (P.cover) $("#cover").style.backgroundImage = `url("${P.cover}")`;
  if (P.demo) {
    const d = $("#demoBar"); d.textContent = P.demo; d.hidden = false;
    const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex, nofollow"; document.head.appendChild(m);
  }

  const info = [];
  if (TABLE) info.push(`<span class="chip chip--hi">🪑 ترابيزة ${esc(TABLE)}</span>`);
  if (P.hours) info.push(`<span class="chip">🕘 ${esc(P.hours)}</span>`);
  if (P.address) info.push(P.mapsUrl ? `<a class="chip" href="${esc(P.mapsUrl)}" target="_blank" rel="noopener">📍 ${esc(P.address)}</a>` : `<span class="chip">📍 ${esc(P.address)}</span>`);
  if (P.phone) info.push(`<a class="chip" href="tel:${esc(P.phone.replace(/\s/g, ""))}">📞 ${esc(P.phone)}</a>`);
  $("#info").innerHTML = info.join("");

  /* ---------- menu ---------- */
  let uid = 0;
  M.forEach((c, ci) => { c.id = "c" + ci; c.items.forEach((it) => { it.id = ++uid; }); });
  const byId = {};
  M.forEach((c) => c.items.forEach((it) => { byId[it.id] = it; }));
  const sel = {};                                     // chosen option index per item
  const priceOf = (it, oi = sel[it.id] || 0) => (it.o ? it.o[oi][1] : it.p);

  $("#cats").innerHTML = M.map((c) => `<a role="listitem" class="cat" href="#${c.id}" data-cat="${c.id}">${c.icon ? `<span aria-hidden="true">${c.icon}</span>` : ""}${esc(c.cat)}</a>`).join("");

  function itemHTML(it) {
    const opts = it.o ? `<div class="opts" role="radiogroup" aria-label="الحجم">${it.o.map(([l, p], i) =>
      `<button type="button" class="opt${(sel[it.id] || 0) === i ? " on" : ""}" data-opt="${it.id}:${i}" role="radio" aria-checked="${(sel[it.id] || 0) === i}">${esc(l)} <b>${p}</b></button>`).join("")}</div>` : "";
    const add = canOrder && !it.off ? `<button type="button" class="add" data-add="${it.id}" aria-label="أضف ${esc(it.n)} للطلب">+</button>` : "";
    return `<article class="item${it.img ? " item--img" : ""}${it.off ? " item--off" : ""}" data-id="${it.id}">
      ${it.img ? `<img src="img/${esc(it.img)}.jpg" alt="${esc(it.n)}" loading="lazy" width="96" height="96">` : ""}
      <div class="item__body">
        <h3>${esc(it.n)}${it.pop ? ' <span class="pop">الأكثر طلباً</span>' : ""}${it.off ? ' <span class="soldout">خلصان</span>' : ""}</h3>
        ${it.d ? `<p>${esc(it.d)}</p>` : ""}
        ${opts}
        <div class="item__foot"><span class="price">${money(priceOf(it))}</span>${add}</div>
      </div>
    </article>`;
  }

  function render(filter = "") {
    const f = norm(filter.trim());
    let shown = 0;
    $("#menu").innerHTML = M.map((c) => {
      const items = f ? c.items.filter((it) => norm(it.n + " " + (it.d || "") + " " + c.cat).includes(f)) : c.items;
      shown += items.length;
      if (!items.length) return "";
      return `<section class="sec" id="${c.id}" aria-labelledby="h-${c.id}">
        <h2 id="h-${c.id}">${c.icon ? `<span aria-hidden="true">${c.icon}</span> ` : ""}${esc(c.cat)} <small>${items.length}</small></h2>
        <div class="items">${items.map(itemHTML).join("")}</div></section>`;
    }).join("");
    $("#empty").hidden = shown > 0;
    spy();
  }

  $("#q").addEventListener("input", (e) => render(e.target.value));
  $("#menu").addEventListener("click", (e) => {
    const o = e.target.closest("[data-opt]");
    if (o) {
      const [id, i] = o.dataset.opt.split(":").map(Number);
      sel[id] = i;
      const card = o.closest(".item");
      card.outerHTML = itemHTML(byId[id]);
      return;
    }
    const a = e.target.closest("[data-add]");
    if (a) add(+a.dataset.add);
  });

  /* category bar: highlight current section */
  let io;
  function spy() {
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        document.querySelectorAll(".cat").forEach((c) => c.classList.toggle("on", c.dataset.cat === en.target.id));
        const on = document.querySelector(".cat.on");
        if (on) on.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".sec").forEach((s) => io.observe(s));
  }

  /* ---------- order bag ---------- */
  const KEY = "menunow-bag-" + norm(P.name);
  let bag = store.get(KEY, {});                         // { "id:opt": qty }
  const lines = () => Object.entries(bag).map(([k, q]) => {
    const [id, oi] = k.split(":").map(Number); const it = byId[id];
    if (!it || it.off) return null;
    return { k, q, it, name: it.n + (it.o ? ` (${it.o[oi][0]})` : ""), price: priceOf(it, oi) };
  }).filter(Boolean);
  const total = () => lines().reduce((s, l) => s + l.q * l.price, 0);

  function add(id) {
    const k = `${id}:${sel[id] || 0}`;
    bag[k] = (bag[k] || 0) + 1;
    save();
    toast(`اتضاف: ${byId[id].n}`);
  }
  function save() {
    store.set(KEY, bag);
    const n = lines().reduce((s, l) => s + l.q, 0);
    $("#bagBtn").hidden = !canOrder || n === 0;
    $("#bagCount").textContent = n;
    $("#bagTotal").textContent = money(total());
    if (!$("#sheet").hidden) drawSheet();
  }

  let mode = TABLE || !P.ordering?.delivery ? "dine" : "delivery";
  function drawSheet() {
    const ls = lines();
    $("#lines").innerHTML = ls.length ? ls.map((l) => `<li>
      <div><strong>${esc(l.name)}</strong><span>${money(l.price)}</span></div>
      <div class="qty"><button data-q="${l.k}:-1" aria-label="أقل">−</button><b>${l.q}</b><button data-q="${l.k}:1" aria-label="أكتر">+</button></div>
    </li>`).join("") : `<li class="none">لسه مفيش أصناف في طلبك.</li>`;
    $("#sum").textContent = money(total());
    const modes = [];
    if (P.ordering.dineIn) modes.push(["dine", "في المكان"]);
    if (P.ordering.delivery) modes.push(["delivery", "دليفري"]);
    if (!modes.some(([m]) => m === mode)) mode = modes[0][0];
    $("#mode").innerHTML = modes.length > 1 ? modes.map(([m, l]) => `<button type="button" role="radio" aria-checked="${m === mode}" class="${m === mode ? "on" : ""}" data-mode="${m}">${l}</button>`).join("") : "";
    $("#tableField").hidden = mode !== "dine";
    $("#addrField").hidden = mode !== "delivery";
    $("#feeHint").textContent = mode === "delivery" ? (P.ordering.deliveryNote || "") : "";
    $("#send").disabled = !ls.length;
  }
  $("#table").value = TABLE;
  $("#bagBtn").addEventListener("click", () => { $("#sheet").hidden = false; drawSheet(); document.body.classList.add("lock"); });
  $("#sheet").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) { $("#sheet").hidden = true; document.body.classList.remove("lock"); return; }
    const q = e.target.closest("[data-q]");
    if (q) {
      const parts = q.dataset.q.split(":"); const d = +parts.pop(); const k = parts.join(":");
      bag[k] = (bag[k] || 0) + d; if (bag[k] <= 0) delete bag[k];
      save(); return;
    }
    const m = e.target.closest("[data-mode]");
    if (m) { mode = m.dataset.mode; drawSheet(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) $("#sheet [data-close]").click(); });

  $("#send").addEventListener("click", () => {
    const ls = lines(); if (!ls.length) return;
    const t = $("#table").value.trim(), addr = $("#addr").value.trim(), note = $("#note").value.trim();
    if (mode === "delivery" && !addr) { toast("اكتب العنوان الأول"); $("#addr").focus(); return; }
    const msg = [
      `طلب جديد من منيو ${P.name}`,
      mode === "dine" ? `🪑 في المكان${t ? ` — ترابيزة ${t}` : ""}` : `🛵 دليفري — ${addr}`,
      "",
      ...ls.map((l) => `• ${l.q} × ${l.name} = ${money(l.q * l.price)}`),
      "",
      `الإجمالي: ${money(total())}${mode === "delivery" ? " + التوصيل" : ""}`,
      note ? `ملاحظات: ${note}` : "",
    ].filter((x, i, a) => x !== "" || (a[i - 1] !== "" && i < a.length - 1)).join("\n");
    const url = `https://wa.me/${P.whatsapp || ""}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  });

  /* ---------- footer ---------- */
  const links = [];
  if (P.instagram) links.push(`<a href="${esc(P.instagram)}" target="_blank" rel="noopener">إنستجرام</a>`);
  if (P.facebook) links.push(`<a href="${esc(P.facebook)}" target="_blank" rel="noopener">فيسبوك</a>`);
  if (P.whatsapp) links.push(`<a href="https://wa.me/${esc(P.whatsapp)}" target="_blank" rel="noopener">واتساب</a>`);
  const credit = P.credit ? (P.credit.url ? `<a href="${esc(P.credit.url)}" target="_blank" rel="noopener">${esc(P.credit.text)}</a>` : esc(P.credit.text)) : "";
  $("#foot").innerHTML = `${links.length ? `<p class="foot__links">${links.join(" · ")}</p>` : ""}<p class="foot__note">الأسعار بالجنيه المصري وممكن تتغير.</p>${credit ? `<p class="foot__credit">${credit}</p>` : ""}`;

  /* ---------- toast ---------- */
  let tt;
  function toast(s) { const t = $("#toast"); t.textContent = s; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 1800); }

  render();
  save();
})();
