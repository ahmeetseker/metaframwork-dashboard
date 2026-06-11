# AI-First Developer Panel — Prototip Tasarım Dokümanı

**Tarih:** 2026-06-11
**Durum:** Onaylandı (brainstorming oturumu sonucu)
**Hedef:** Drupal/Frappe/Django admin benzeri, son kullanıcı değil **geliştirici odaklı (DX)**, AI-first bir panel prototipi. Müşterinin istediği özelleştirmeler: brand colors, custom fields, custom forms, custom modules.

---

## 1. Karar Özeti

| Konu | Karar |
|---|---|
| Kabuk yerleşimi | **B** — Üst global bar + sol nav + **AI alt dock** (Linear/Raycast kalıbı) |
| Form Builder | **B** — Temiz canvas + sağdan açılır **Sheet** konfigüratör |
| Tema editörü | **B** — **AI-first**: prompt → 3 palet varyantı → token ince ayarı + canlı önizleme |
| Prototip tipi | **Frontend-only, simüle AI** — backend yok, localStorage, deterministik AI motoru |
| Kapsam | Çekirdek + API Explorer + Audit Log + Roles & Permissions |
| UI dili | **İngilizce + i18n altyapısı** (metinler `src/i18n/en.ts` sözlüğünde, `t()` ile) |
| Stack | **Vite + React 18 + TypeScript**, Tailwind CSS, shadcn/ui, Radix UI (Next.js YOK) |

## 2. Mimari İlkeler

1. **Tek doğruluk kaynağı: şema JSON'u.** Her modül bir JSON tanımıdır (alanlar, validasyon, koşullar, izinler). Görsel builder, JSON editörü ve AI aynı JSON'u düzenler. AI çıktısı doğal olarak diff'lenebilir.
2. **AI her zaman "öner → önizle → uygula".** Hiçbir AI önerisi onaysız uygulanmaz; her öneri accept/reject diff kartıdır (Supabase AI Assistant v2 kalıbı).
3. **Tema = CSS variables.** `--primary`, `--radius`, `--font-sans` vb. shadcn token seti; marka özelleştirmesi yalnızca tokenları yazar, komponentlere dokunmaz.
4. **AI bağlam-farkındadır.** AI dock, aktif sayfayı ve mevcut şemaları bilir; Form Builder'dayken "bu forma…" diye konuşulabilir.
5. **Demo asla kırılmaz.** Simüle AI tanımadığı prompt'ta dürüst bir "prototype simulation" mesajı ve örnek komutlar gösterir.

## 3. Teknoloji ve Kütüphaneler

- **Build:** Vite (react-ts şablonu)
- **UI:** Tailwind CSS, shadcn/ui, Radix UI
- **State:** Zustand + `persist` middleware (localStorage); "Reset demo data" eylemi
- **Router:** react-router-dom
- **Tablo:** TanStack Table (otomatik CRUD görünümleri)
- **Drag-drop:** dnd-kit (form canvas alan sıralama)
- **Komut paleti:** cmdk (shadcn Command)
- **Toast:** Sonner
- **i18n:** Hafif, elle yazılmış `t()` yardımcısı + `en.ts` sözlüğü (sonradan `tr.ts` eklenebilir)

## 4. Veri Modeli (çekirdek tipler)

```ts
type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'relation'
              | 'date' | 'boolean' | 'json' | 'file' | 'email' | 'url';

interface ConditionRule { field: string; operator: 'is'|'is_not'|'contains'|'gt'|'lt'; value: unknown }
interface ConditionalLogic { action: 'show'|'hide'|'require'; logic: 'and'|'or'; rules: ConditionRule[] }

interface Field {
  id: string; name: string; label: string; type: FieldType;
  required?: boolean; unique?: boolean; hidden?: boolean;
  options?: string[];                 // select için
  relation?: { module: string };     // relation için
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
  conditional?: ConditionalLogic;
  layout?: { width: 'full'|'half' }; // canvas yerleşimi
}

interface Module {
  id: string; name: string; label: string; icon: string;
  fields: Field[];
  createdAt: string; updatedAt: string;
}

interface ThemeTokens {
  light: Record<string, string>;   // --primary, --secondary, --destructive, --background…
  dark: Record<string, string>;
  radius: string; fontSans: string;
}

interface AuditEntry {
  id: string; timestamp: string; actor: string;     // prototipte 'you' | 'ai-assistant'
  action: string;                                    // 'module.create', 'field.update', 'theme.apply'…
  target: string; payload: unknown;                  // JSON diff/detay
}

interface Role { id: string; name: string; permissions: Record<string /*moduleId*/, { create: boolean; read: boolean; update: boolean; delete: boolean }> }

type Record_ = { id: string; [fieldName: string]: unknown };  // modül kayıtları
```

Store dilimleri: `modules`, `records` (moduleId → Record_[]), `theme`, `roles`, `audit`, `ui` (aktif env, sidebar durumu, AI dock durumu).

## 5. Simüle AI Motoru (`src/ai/engine.ts`)

- **Deterministik, keyword tabanlı** intent eşleyici. Streaming hissi için karakter karakter yazma efekti.
- Desteklenen intent'ler (prototip):
  1. **NL → şema:** "create a complaints module with title, priority, assignee" → modül + alan taslağı (diff kartı)
  2. **Alan ekleme:** "add a priority select field to tickets" → şema patch'i
  3. **Validasyon üretimi:** "phone must be TR format" → pattern + mesaj
  4. **Conditional logic:** "make tax_no required when type is corporate" → kural nesnesi
  5. **Tema üretimi:** "dark green, corporate but warm" → 3 palet varyantı (light+dark token setleri)
  6. **AI filtre:** "open tickets from last 30 days" → DataTable filtre seti
- Her intent çıktısı **JSON patch + insan-okur özet** çiftidir; UI bunu diff kartına çevirir. Accept → store mutasyonu + audit kaydı (`actor: 'ai-assistant'`).
- Tanınmayan prompt → "This is a prototype simulation" mesajı + tıklanabilir örnek komutlar.
- Arayüz: `aiEngine.run(prompt, context) => Promise<AiResponse>` — gerçek Claude API'ye geçiş bu tek modülün değişimiyle olur.

## 6. Ekranlar

### 6.1 Kabuk
- **Üst bar:** workspace logosu/adı, env switcher (dev/staging/prod — görsel `Select`), ortada ⌘K tetikleyici, sağda light/dark toggle + avatar.
- **Sol nav (daraltılabilir):** MAIN (Dashboard, Data) · BUILD (Modules, Form Builder, Theme) · DEVELOPER (API Explorer, Audit Log) · ADMIN (Roles & Permissions).
- **AI Dock:** altta ortada yüzen kapsül; tık veya ⌘J ile genişler (chat geçmişi + diff kartları, `ScrollArea`). Sayfa bağlamı prompt'a otomatik eklenir.
- **⌘K Command Palette:** sayfalar, eylemler ("New module", "Toggle dark mode"), kayıt arama, "Ask AI" fallback.

### 6.2 Dashboard
Özet kartlar (modül/kayıt/rol sayıları), son aktivite listesi (audit'ten), hızlı eylemler.

### 6.3 Modules (Şema Builder)
- Modül listesi (kart/tablo), "New Module" → boş **veya** "Generate with AI".
- Modül detayı: alan listesi tablosu, alan satırından Form Builder'a geçiş, modül silme `AlertDialog` ile.

### 6.4 Form Builder
- **Temiz canvas** ortada (max genişlik sınırlı), alanlar dnd-kit ile sıralanır; half-width alanlar yan yana.
- Satır arası "+" veya ⌘K ile alan tipi seçimi.
- Alana tıkla → sağdan **Sheet**: General / Validation / Conditional Logic (alan-operatör-değer kural satırları, AND/OR) / Access sekmeleri (`Tabs` veya `Accordion`).
- Üstte görünüm geçişi: **Visual | JSON | Preview**. JSON çift yönlü senkron (basit textarea + parse/validate; hata durumunda inline uyarı). Preview: şemadan üretilen gerçek form, canlı validasyonla.

### 6.5 Theme & Branding
- Üstte **AI prompt çubuğu** ("Generate") → 3 palet varyant kartı → seçim token editörüne yüklenir.
- Token editörü: renk picker'ları (react-colorful), radius `Slider`, font `Select`, Light/Dark sekmeleri.
- Sağda **canlı önizleme**: gerçek shadcn komponentlerinden mini sayfa.
- "Copy CSS" → `:root`/`.dark` bloğu panoya; tema anında tüm panele uygulanır.

### 6.6 Data (otomatik CRUD)
- Modül seçimi sol nav altından (dinamik liste).
- Şemadan üretilen DataTable: kolon tipleri alanlardan, sıralama/filtre/arama/bulk seçim/pagination.
- Kayıt oluştur/düzenle: sağdan Sheet, şemadan üretilen form (conditional logic + validasyon çalışır).
- Tablo üstünde **AI filtre kutusu** (NL → filtre seti, uygulanan filtreler `Badge` olarak görünür ve tek tek kaldırılabilir).

### 6.7 API Explorer
- Modüllerden türetilen endpoint listesi (`GET/POST/PATCH/DELETE /api/<module>`).
- Request panel (params/headers/body `Tabs`) → store verisinden simüle JSON yanıt (gecikme efektiyle).
- Kod snippet sekmeleri: curl / fetch (JS).

### 6.8 Audit Log
- Her store mutasyonu otomatik `AuditEntry` üretir (şema, veri, tema, izin değişiklikleri).
- DataTable + satır tıklayınca Sheet'te JSON payload; actor `Badge` ('you' / 'ai-assistant').

### 6.9 Roles & Permissions
- Rol listesi + seçili rol için **modül × CRUD checkbox matrisi**.
- Matris değişiklikleri audit'e düşer. (Prototipte izinler görsel; runtime enforcement yok.)

## 7. Demo İçeriği (seed)

- 3 modül: **customers** (8 alan), **orders** (7 alan, customers'a relation), **tickets** (9 alan, priority select + conditional örneğiyle).
- Her modüle 15–20 sahte kayıt; 3 rol (Admin, Developer, Viewer); "Acme" hazır teması; 20+ audit girdisi.
- Seed, ilk açılışta yüklenir; "Reset demo data" ile geri döner.

## 8. Hata Durumları & Edge Case'ler

- JSON editöründe geçersiz JSON → inline hata, Visual'a geçiş engellenmez (son geçerli state korunur).
- Modül/alan silme → `AlertDialog`; relation'ı kırılan alanlar uyarı `Badge`'i alır.
- Form preview'da validasyon gerçek zamanlı; pattern hatalarında özel mesaj gösterilir.
- localStorage dolu/bozuk → güvenli sıfırlama akışı.
- AI motoru her zaman yanıt verir (tanımadığında öneri listesi) — demo kırılmaz.

## 9. Test Yaklaşımı

- **Vitest + React Testing Library.**
- Birim: şema → form üretimi, conditional logic değerlendirici, validasyon, AI intent eşleyici, tema token uygulayıcı.
- Komponent: Form Builder ekleme/sıralama/Sheet düzenleme, DataTable filtreleme, diff kartı accept/reject akışı.
- TDD: davranış başına önce kırmızı test, sonra implementasyon.

## 10. Kapsam Dışı (prototipte yok)

Gerçek backend/API, gerçek AI çağrısı, gerçek auth/izin enforcement'ı, çoklu workspace, gerçek webhook/flows, plugin marketplace, ERD görünümü, MCP server. Bunlar üretim yol haritası adaylarıdır.
