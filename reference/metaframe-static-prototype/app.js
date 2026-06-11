/* Metaframe prototype — interactions (mock state, no backend) */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- navigation ---------------- */

const SCREENS = ["overview", "schema", "forms", "theme", "modules"];
const CRUMBS = {
  overview: "Overview", schema: "Schema & Fields", forms: "Form Builder",
  theme: "Theme Studio", modules: "Modules",
};

function showScreen(name) {
  if (!SCREENS.includes(name)) name = "overview";
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === `screen-${name}`));
  $$(".nav-item[data-screen]").forEach(n =>
    n.classList.toggle("active", n.dataset.screen === name && n.closest(".sidebar")));
  // only highlight the first matching nav entry
  const matches = $$(`.nav-item[data-screen="${name}"]`);
  $$(".nav-item").forEach(n => n.classList.remove("active"));
  if (matches.length) matches[0].classList.add("active");
  $("#crumb").textContent = CRUMBS[name];
  location.hash = name === "overview" ? "" : name;
}

$$(".nav-item[data-screen]").forEach(n =>
  n.addEventListener("click", () => showScreen(n.dataset.screen)));

/* hash routing — #ai opens overview + assistant + palette (screenshot mode) */
function route() {
  const h = location.hash.replace("#", "");
  if (h === "ai") {
    showScreen("overview");
    openAI(true);
    openPalette("vat");
    return;
  }
  showScreen(h || "overview");
}

/* ---------------- entities & fields (schema screen) ---------------- */

const ENTITIES = [
  { name: "Customer", count: 9, module: "crm-core" },
  { name: "Invoice", count: 12, module: "invoicing" },
  { name: "InvoiceLine", count: 6, module: "invoicing" },
  { name: "Payment", count: 7, module: "invoicing" },
  { name: "Approval", count: 5, module: "approvals" },
  { name: "Product", count: 8, module: "inventory" },
];

let FIELDS = JSON.parse(localStorage.getItem("mf.fields") || "null") || [
  { name: "invoice_no", type: "string", rule: "unique, auto", source: "base", req: true },
  { name: "customer", type: "relation → Customer", rule: "required", source: "base", req: true },
  { name: "invoice_date", type: "date", rule: "required", source: "base", req: true },
  { name: "status", type: "select", rule: "draft|sent|paid", source: "base", req: false },
  { name: "total", type: "currency", rule: "computed: Σ lines", source: "base", req: false },
  { name: "vat_number", type: "string", rule: 'req_if region=="EU"', source: "overlay", req: true },
  { name: "po_reference", type: "string", rule: "—", source: "overlay", req: false },
];

let selectedField = "vat_number";

function renderEntities() {
  $("#entity-list").innerHTML =
    `<div class="nav-label" style="padding-top:6px">Entities</div>` +
    ENTITIES.map(e => `
      <button class="entity-item ${e.name === "Invoice" ? "active" : ""}">
        <span class="mono">${e.name}</span><span class="count">${e.count}</span>
      </button>`).join("");
}

function renderFields() {
  $("#field-rows").innerHTML = FIELDS.map(f => `
    <tr data-fname="${f.name}" class="${f.name === selectedField ? "selected" : ""}">
      <td class="fname">${f.name}${f.req ? ' <span class="req">*</span>' : ""}</td>
      <td><span class="chip">${f.type}</span></td>
      <td class="mono" style="color:var(--text-faint);font-size:11px">${f.rule}</td>
      <td>${f.source === "overlay"
        ? '<span class="chip lime">overlay</span>'
        : '<span class="chip">base</span>'}</td>
    </tr>`).join("");

  $$("#field-rows tr").forEach(tr =>
    tr.addEventListener("click", () => {
      selectedField = tr.dataset.fname;
      $("#fi-name").value = selectedField;
      $("#fi-label").value = selectedField.replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
      renderFields(); renderFieldJSON();
    }));
  renderFieldJSON();
}

function renderFieldJSON() {
  const f = FIELDS.find(x => x.name === selectedField) || FIELDS[0];
  $("#field-json").innerHTML =
`{
  <span class="k">"field"</span>: <span class="s">"${f.name}"</span>,
  <span class="k">"type"</span>: <span class="s">"${f.type}"</span>,
  <span class="k">"required"</span>: <span class="n">${f.req}</span>,
  <span class="k">"storage"</span>: <span class="s">"${f.source}"</span>,
  <span class="k">"rule"</span>: <span class="s">"${f.rule}"</span>
  <span class="c">// overlay alanlar tabCustomField'da yaşar,</span>
  <span class="c">// meta-load sırasında base schema ile birleşir</span>
}`;
}

$("#nf-add").addEventListener("click", () => {
  const name = $("#nf-name").value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!name) return;
  FIELDS.push({ name, type: $("#nf-type").value, rule: "—", source: "overlay", req: false });
  localStorage.setItem("mf.fields", JSON.stringify(FIELDS));
  selectedField = name;
  $("#nf-name").value = "";
  renderFields();
});

/* inspector tabs */
$$("[data-itab]").forEach(t => t.addEventListener("click", () => {
  $$("[data-itab]").forEach(x => x.classList.toggle("active", x === t));
  $("#itab-props").style.display = t.dataset.itab === "props" ? "" : "none";
  $("#itab-json").style.display = t.dataset.itab === "json" ? "" : "none";
}));

/* generic toggles */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-toggle]");
  if (t) t.classList.toggle("on");
});

/* ---------------- form builder ---------------- */

const FORM_SCHEMA = {
  form: "invoice-entry", entity: "Invoice", version: 7,
  sections: [
    { title: "Genel", columns: 2, fields: [
      { id: "customer", type: "relation", required: true },
      { id: "invoice_date", type: "date", required: true },
      { id: "status", type: "select", options: ["draft", "sent", "paid"] },
      { id: "currency", type: "select", options: ["EUR", "USD", "TRY"] },
    ]},
    { title: "Vergi", columns: 2, origin: "ai:approved", fields: [
      { id: "vat_number", type: "string", required: true,
        show_if: 'customer.region == "EU"', pattern: "^[A-Z]{2}[0-9A-Z]+$" },
      { id: "tax_rate", type: "number", default: 19 },
    ]},
    { title: "Kalemler", columns: 1, fields: [
      { id: "line_items", type: "child_table", target: "InvoiceLine" },
    ]},
  ],
};

function renderFormJSON() {
  $("#form-json").textContent = JSON.stringify(FORM_SCHEMA, null, 2);
}

$$("[data-ftab]").forEach(t => t.addEventListener("click", () => {
  $$("[data-ftab]").forEach(x => x.classList.toggle("active", x === t));
  $("#ftab-inspector").style.display = t.dataset.ftab === "inspector" ? "" : "none";
  $("#ftab-json").style.display = t.dataset.ftab === "json" ? "" : "none";
}));

$$(".ffield").forEach(f => f.addEventListener("click", () => {
  $$(".ffield").forEach(x => x.classList.remove("selected"));
  f.classList.add("selected");
  $("#ftab-selected").textContent = f.dataset.f;
}));

/* palette items add a field to the last section + schema */
$$("[data-add]").forEach(p => p.addEventListener("click", () => {
  const kind = p.dataset.add;
  if (["section", "tabs", "columns"].includes(kind)) return;
  const id = `${kind}_${Math.floor(Math.random() * 90 + 10)}`;
  FORM_SCHEMA.sections[0].fields.push({ id, type: kind });
  const grid = $$(".form-section .form-grid")[0];
  const el = document.createElement("div");
  el.className = "ffield"; el.dataset.f = id;
  el.innerHTML = `<div class="fl">${id} <span class="chip" style="font-size:9px">${kind}</span></div><div class="fv">—</div>`;
  el.addEventListener("click", () => {
    $$(".ffield").forEach(x => x.classList.remove("selected"));
    el.classList.add("selected");
    $("#ftab-selected").textContent = id;
  });
  grid.appendChild(el);
  renderFormJSON();
}));

/* ---------------- theme studio ---------------- */

function hexToHsl(hex) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255,
        g = parseInt(m.slice(2, 4), 16) / 255,
        b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const LIGHTNESS = [96, 91, 82, 71, 60, 50, 42, 34, 26, 18];

function applyBrand(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const [h, s] = hexToHsl(hex);
  document.documentElement.style.setProperty("--brand", hex);
  document.documentElement.style.setProperty("--brand-soft", `hsla(${h}, ${s}%, 50%, 0.13)`);
  $("#brand-color").value = hex.toLowerCase();
  $("#brand-hex").value = hex.toUpperCase();

  $("#ramp").innerHTML = STEPS.map((st, i) =>
    `<div class="step" style="background:hsl(${h}, ${Math.min(s, 92)}%, ${LIGHTNESS[i]}%)"><span>${st}</span></div>`
  ).join("");

  const tokens = [
    ["color.brand.primary", hex.toUpperCase(), hex],
    ["color.brand.soft", `hsl(${h.toFixed(0)} ${s.toFixed(0)}% 93%)`, `hsl(${h}, ${s}%, 93%)`],
    ["color.action.cta.bg", "{color.brand.primary}", hex],
    ["color.chart.series-1", `hsl(${h.toFixed(0)} ${s.toFixed(0)}% 60%)`, `hsl(${h}, ${s}%, 60%)`],
    ["color.focus.ring", `hsl(${h.toFixed(0)} ${s.toFixed(0)}% 50% / .35)`, `hsla(${h}, ${s}%, 50%, .35)`],
  ];
  $("#token-list").innerHTML =
    `<div class="nav-label" style="padding:0 0 6px">Türetilen semantic token'lar</div>` +
    tokens.map(([n, v, c]) =>
      `<div class="token-row"><span class="sw" style="background:${c}"></span><span class="tn">${n}</span><span class="tv">${v}</span></div>`
    ).join("");

  localStorage.setItem("mf.brand", hex);
}

$("#brand-color").addEventListener("input", e => applyBrand(e.target.value));
$("#brand-hex").addEventListener("change", e => applyBrand(e.target.value));
$("#brand-random").addEventListener("click", () => {
  const h = Math.floor(Math.random() * 360);
  const tmp = document.createElement("canvas").getContext("2d");
  tmp.fillStyle = `hsl(${h}, 70%, 55%)`;
  applyBrand(tmp.fillStyle.startsWith("#") ? tmp.fillStyle : hslToHex(h, 70, 55));
});

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = x => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

/* ---------------- modules ---------------- */

const MODULES = [
  { icon: "🧾", name: "invoicing", ver: "2.4.1", on: true,
    desc: "Fatura, ödeme ve tahsilat akışları; e-fatura entegrasyon noktaları.",
    contrib: ["4 entity", "3 form", "2 nav", "1 AI tool"], deps: ["crm-core"] },
  { icon: "👥", name: "crm-core", ver: "3.1.0", on: true,
    desc: "Müşteri, kişi ve segment yönetimi — diğer modüllerin temel bağımlılığı.",
    contrib: ["3 entity", "2 form", "1 nav"], deps: [] },
  { icon: "✅", name: "approvals", ver: "1.2.0", on: true,
    desc: "Çok adımlı onay zincirleri; her entity'ye approval state machine ekler.",
    contrib: ["2 entity", "1 nav", "1 AI tool"], deps: ["crm-core"] },
  { icon: "📦", name: "inventory", ver: "0.9.2", on: false,
    desc: "Stok, depo ve ürün varyantları. Henüz beta — dev ortamında test edin.",
    contrib: ["5 entity", "4 form", "2 nav"], deps: ["crm-core"] },
  { icon: "📊", name: "reports", ver: "1.0.3", on: true,
    desc: "Sorgu konsolundan beslenen zamanlanmış raporlar ve panolar.",
    contrib: ["1 entity", "3 nav", "2 AI tool"], deps: [] },
  { icon: "🔔", name: "notifications", ver: "1.5.0", on: false,
    desc: "E-posta / webhook / in-app bildirim kuralları; olay tabanlı tetikleyiciler.",
    contrib: ["2 entity", "1 nav"], deps: ["crm-core", "approvals"] },
];

function renderModules() {
  $("#module-grid").innerHTML = MODULES.map((m, i) => `
    <div class="card module-card">
      <div class="mc-head">
        <div class="mc-icon">${m.icon}</div>
        <div><div class="mc-name mono">${m.name}</div><div class="mc-ver">v${m.ver}</div></div>
        ${m.on ? '<span class="chip green" style="margin-left:auto">aktif</span>'
               : '<span class="chip" style="margin-left:auto">kapalı</span>'}
      </div>
      <div class="mc-desc">${m.desc}</div>
      <div class="mc-contrib">${m.contrib.map(c => `<span class="chip">${c}</span>`).join("")}</div>
      <div class="mc-foot">
        ${m.deps.length
          ? `<span class="mono" style="font-size:10px;color:var(--text-faint)">deps: ${m.deps.join(", ")}</span>`
          : '<span class="mono" style="font-size:10px;color:var(--text-faint)">bağımsız</span>'}
        <span class="toggle ${m.on ? "on" : ""}" data-mod="${i}"></span>
      </div>
    </div>`).join("");

  $$("[data-mod]").forEach(t => t.addEventListener("click", () => {
    const m = MODULES[+t.dataset.mod];
    m.on = !m.on;
    renderModules();
  }));
}

/* ---------------- AI assistant ---------------- */

function openAI(open) {
  $("#app").classList.toggle("ai-open", open);
}
$("#ai-toggle").addEventListener("click", () => openAI(!$("#app").classList.contains("ai-open")));
$("#ai-close").addEventListener("click", () => openAI(false));

$("#diff-apply")?.addEventListener("click", e => {
  const card = e.target.closest(".diff-card");
  card.querySelector(".chip").outerHTML = '<span class="chip green">uygulandı · audit #882</span>';
  card.querySelector(".diff-card-foot").innerHTML =
    '<span style="font-size:11.5px;color:var(--ok)">✓ Migration #215 kuyruğa alındı — denetim kaydı oluşturuldu.</span>';
});

function aiRespond(text) {
  const thread = $("#ai-thread");
  const u = document.createElement("div");
  u.className = "msg-user"; u.textContent = text;
  thread.appendChild(u);
  const a = document.createElement("div");
  a.className = "msg-ai";
  a.innerHTML = "İsteğini şemaya çevirdim — değişiklik <b>diff olarak</b> hazırlanıyor. (Prototipte AI yanıtları simüledir; üretimde her öneri yine bu onay kartından geçer.)";
  thread.appendChild(a);
  thread.scrollTop = thread.scrollHeight;
}

$("#ai-send").addEventListener("click", () => {
  const t = $("#ai-text").value.trim();
  if (!t) return;
  $("#ai-text").value = "";
  aiRespond(t);
});
$("#ai-text").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#ai-send").click(); }
});

/* ---------------- command palette ---------------- */

const COMMANDS = [
  { g: "Git", icon: "▦", label: "Overview", meta: "G O", act: () => showScreen("overview") },
  { g: "Git", icon: "⛁", label: "Schema & Fields", meta: "G S", act: () => showScreen("schema") },
  { g: "Git", icon: "▤", label: "Form Builder", meta: "G F", act: () => showScreen("forms") },
  { g: "Git", icon: "◐", label: "Theme Studio", meta: "G T", act: () => showScreen("theme") },
  { g: "Git", icon: "⬡", label: "Modules", meta: "G M", act: () => showScreen("modules") },
  { g: "Aksiyon", icon: "+", label: "Yeni entity oluştur", meta: "" },
  { g: "Aksiyon", icon: "+", label: "Invoice'a alan ekle", meta: "" },
  { g: "Aksiyon", icon: "⇪", label: "Schema'yı prod'a deploy et", meta: "" },
  { g: "Aksiyon", icon: "⎘", label: "tokens.json dışa aktar", meta: "" },
  { g: "Kayıt", icon: "🧾", label: "INV-1042 — Acme GmbH", meta: "Invoice" },
  { g: "Kayıt", icon: "🧾", label: "vat_number — Invoice alanı", meta: "field" },
  { g: "Doküman", icon: "?", label: "Overlay alanlar upgrade'de nasıl korunur?", meta: "docs" },
];

function openPalette(query = "") {
  $("#overlay").classList.add("open");
  $("#palette").classList.add("open");
  const q = $("#palette-q");
  q.value = query;
  renderPalette(query);
  q.focus();
}
function closePalette() {
  $("#overlay").classList.remove("open");
  $("#palette").classList.remove("open");
}

function renderPalette(q) {
  const ql = q.toLowerCase();
  const hits = COMMANDS.filter(c => !ql || c.label.toLowerCase().includes(ql) || c.g.toLowerCase().includes(ql));
  let html = "";
  let lastG = "";
  hits.forEach((c, i) => {
    if (c.g !== lastG) { html += `<div class="palette-group">${c.g}</div>`; lastG = c.g; }
    html += `<button class="palette-item-r ${i === 0 ? "hot" : ""}" data-ci="${COMMANDS.indexOf(c)}">
      <span class="pi-icon">${c.icon}</span> ${c.label}
      <span class="meta">${c.meta ? `<span class="kbd">${c.meta}</span>` : ""}</span>
    </button>`;
  });
  if (ql) {
    html += `<div class="palette-group">AI</div>
      <button class="palette-item-r ai-fallthrough">
        <span class="pi-icon">⚡</span> AI'a sor: “${q}”
        <span class="meta"><span class="kbd">tab</span></span>
      </button>`;
  }
  if (!hits.length && !ql) html += `<div class="empty-note">Yazmaya başla…</div>`;
  $("#palette-results").innerHTML = html;
  $$("[data-ci]").forEach(b => b.addEventListener("click", () => {
    const c = COMMANDS[+b.dataset.ci];
    closePalette();
    c.act?.();
  }));
  $(".ai-fallthrough")?.addEventListener("click", () => {
    closePalette(); openAI(true); aiRespond(q);
  });
}

$("#search-trigger").addEventListener("click", () => openPalette());
$("#overlay").addEventListener("click", closePalette);
$("#palette-q").addEventListener("input", e => renderPalette(e.target.value));

document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
    e.preventDefault(); openAI(!$("#app").classList.contains("ai-open"));
  }
  if (e.key === "Escape") closePalette();
});

/* ---------------- boot ---------------- */

renderEntities();
renderFields();
renderFormJSON();
renderModules();
applyBrand(localStorage.getItem("mf.brand") || "#6366F1");
route();
window.addEventListener("hashchange", route);
