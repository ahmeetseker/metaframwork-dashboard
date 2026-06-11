# Metaframe — AI-first Developer Panel Prototipi

Drupal / Frappe / Django admin sınıfında, **son kullanıcıya değil geliştiriciye** dönük,
AI-first ve DX odaklı bir panel prototipi. Backend yok — tüm builder'lar mock state
ile gerçekten çalışır (localStorage'a yazar).

## Çalıştırma

```bash
open index.html        # kurulum yok, tarayıcıda direkt açılır
```

## Ekranlar

| # | Ekran | Hash | İçerik |
|---|-------|------|--------|
| 1 | Overview | `#` | Stat'ler, AI hero input, değişiklik akışı (insan+AI aktör), background jobs, schema sağlığı |
| 2 | Schema & Fields | `#schema` | Entity listesi, field tablosu (base/overlay ayrımı), inspector + JSON sekmesi, migration draft barı |
| 3 | Form Builder | `#forms` | Alan paleti, canvas (section/koşullu alan), canlı JSON Schema sekmesi |
| 4 | Theme Studio | `#theme` | Brand color → 50-900 ramp + semantic token türetimi, **canlı** müşteri-app önizlemesi |
| 5 | Modules | `#modules` | Modül registry (toggle, deps, katkılar), AI scaffolder (plan → onay → file tree) |
| 6 | AI katmanı | `#ai` | ⌘K command palette (AI fallthrough) + ⌘I assistant (diff-onay kartı) |

## Klavye

- `⌘K` — command palette (eşleşme yoksa girdi AI'a düşer)
- `⌘I` — AI assistant panelini aç/kapat
- `Esc` — palette'i kapat

## Tasarım ilkeleri (araştırma bulgularından)

1. **Her şey metadata, metadata koddur** — custom field'lar base schema üzerine *overlay*
   yazılır (Frappe modeli); UI'daki her hamle git-diff'lenebilir JSON üretir (Payload modeli).
2. **AI önerir, asla sessizce uygulamaz** — her AI çıktısı incelenebilir bir diff kartıdır;
   yazma işlemleri açık onay ister, denetim kaydına işlenir (Supabase/Retool paterni).
   Modele yalnızca şema gönderilir, satır verisi gönderilmez.
3. **Klavye-öncelikli, kaçış-kapısı-her-yerde** — ⌘K her yerde; her görsel builder'ın
   "JSON'u göster" sekmesi var.
4. **Panel önce API, sonra UI** — her yetenek (alan ekle, token değiştir) bir tool olarak
   tasarlanır; panelin kendi asistanı da dış ajanlar (MCP) da aynı tool'ları çağırır.

## Dosyalar

- `index.html` — 6 ekranın tamamı
- `styles.css` — design token'lar (reference → semantic) + bileşenler
- `app.js` — etkileşimler: routing, palette, asistan, theme türetme, builder state
- `screenshots/` — ekran başına bir yatay PNG (tasarım referansı)
