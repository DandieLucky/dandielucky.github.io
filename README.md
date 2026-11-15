# Portfolio Dandie Lucky Maulana

Situs portofolio pribadi: desain grafis, konten media sosial, motion graphics, fotografi, dan UI/UX.
Dibangun sendiri dengan **Astro 5**, CSS custom, dan JavaScript vanilla — tanpa template, tanpa framework UI.

- **Dua bahasa**: Indonesia di `/`, Inggris di `/en`.
- **Motion terkontrol**: reveal saat scroll, preview mengikuti kursor, transisi halaman — semua otomatis mati kalau pengunjung mengaktifkan *reduce motion*.
- **Slot aset**: gambar placeholder sudah terpasang. Ganti dengan file asli memakai **nama file yang sama**, tidak perlu mengubah kode.
- **Cek aset**: `npm run check-assets` menunjukkan slot mana yang masih placeholder.

---

## 1. Menjalankan di komputer

```bash
cd ~/Documents/portfolio-dandie
npm install          # sekali saja
npm run dev          # http://localhost:4321
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan (auto reload) |
| `npm run build` | Bangun situs ke folder `dist/` |
| `npm run preview` | Lihat hasil `dist/` seperti di server asli |
| `npm run check-assets` | Daftar slot aset: mana yang masih placeholder |
| `npm run assets:placeholders` | Buat ulang semua gambar placeholder |
| `npm run deploy` | Build + unggah ke Cloudflare Pages |

---

## 2. Struktur folder

```
portfolio-dandie/
├─ src/
│  ├─ content/work/
│  │  ├─ id/*.mdx          ← isi proyek versi Indonesia
│  │  └─ en/*.mdx          ← isi proyek versi Inggris
│  ├─ pages/               ← rute: /, /work, /about, /lab, /contact (+ /en/...)
│  ├─ views/               ← komponen halaman (dipakai dua bahasa)
│  ├─ components/          ← Header, Footer, Slot, Gallery, BeforeAfter, Card
│  ├─ layouts/Base.astro   ← <head>, SEO, header, footer, overlay
│  ├─ i18n/ui.ts           ← SEMUA teks antarmuka (label, judul, CTA)
│  ├─ data/
│  │  ├─ lab.ts            ← isi halaman Lab
│  │  ├─ timeline.ts       ← timeline & daftar keahlian
│  │  ├─ disciplines.ts    ← daftar filter disiplin
│  │  └─ assets.json       ← daftar aset + status placeholder (otomatis)
│  ├─ lib/work.ts          ← helper baca konten
│  ├─ scripts/site.js      ← semua interaksi
│  └─ styles/global.css    ← seluruh desain (token warna, tipografi, komponen)
├─ public/
│  ├─ assets/work/<slug>/  ← cover & gambar proses tiap proyek
│  ├─ assets/about/        ← foto profil
│  ├─ assets/cv/           ← CV PDF yang diunduh dari situs
│  └─ favicon.svg, og.png
└─ scripts/                ← generator placeholder + pemeriksa aset
```

---

## 3. Mengisi aset (langkah paling penting)

Semua slot sudah ada gambar placeholder-nya. **Cara ganti: timpa file dengan nama yang sama.**

```bash
npm run check-assets     # lihat sisa slot
# salin file asli menimpa placeholder, contoh:
cp ~/Downloads/foto-feed-1.jpg public/assets/work/matahari-grosir/proses-01.jpg
npm run build            # atau biarkan `npm run dev` menyegarkan sendiri
```

| Slot | Lokasi | Ukuran ideal | Format | Catatan |
|---|---|---|---|---|
| Cover proyek | `public/assets/work/<slug>/cover.jpg` | 1600×1200 (4:3) | JPG | dipakai di kartu karya + preview hover |
| Gambar proses 1–3 | `public/assets/work/<slug>/proses-0{1,2,3}.jpg` | 1200×900 (4:3) | JPG | isi bagian Proses |
| Before / After | `public/assets/work/posh-by-her/before.jpg` & `after.jpg` | 1200×900 | JPG | slider interaktif |
| Foto profil | `public/assets/about/portrait.jpg` | 1200×1500 (4:5) | JPG | halaman Tentang & beranda |
| OG image | `public/assets/og.png` | 1200×630 | PNG/JPG | pratinjau saat link dibagikan di WhatsApp/LinkedIn |
| CV | `public/assets/cv/Dandie-Lucky-Maulana_CV.pdf` | — | PDF | tombol unduh CV |

Tips: kompres JPG sampai di bawah ~400 KB (mis. [squoosh.app](https://squoosh.app)), dan jangan unggah foto mentah 8 MB dari kamera.

Cara kerja penandanya: setiap file placeholder dibuat oleh `scripts/make-placeholders.py` dan membawa penanda byte `SLOT ASET` (komentar JPEG / teks PNG). `npm run check-assets` membaca penanda itu — jadi slot dianggap "terisi" begitu kamu menimpanya dengan file asli, tanpa perlu mengubah daftar apa pun. Kalau perlu membuat ulang placeholder tapi tidak ingin menimpa file tertentu (misalnya `og.png` yang sudah jadi):

```bash
python3 scripts/make-placeholders.py --skip og.png
```

`/assets/og.png` adalah kartu pratinjau saat link dibagikan (WhatsApp, LinkedIn, X). Boleh diganti gambar apa pun berukuran 1200×630 px.

---

## 4. Mengubah teks

| Ingin mengubah | Buka file |
|---|---|
| Judul beranda, kalimat pembuka, label tombol | `src/i18n/ui.ts` |
| Isi satu proyek (konteks, peran, proses, hasil) | `src/content/work/id/<slug>.mdx` dan versi `en/` |
| Timeline & daftar keahlian | `src/data/timeline.ts` |
| Isi halaman Lab | `src/data/lab.ts` |
| Email, WhatsApp, LinkedIn, Instagram, link CV | `src/i18n/ui.ts` (objek `site` di bagian bawah) |

### Menambah proyek baru
1. Salin salah satu file di `src/content/work/id/`, ganti nama jadi `<slug-baru>.mdx`.
2. Ubah frontmatter: `slug`, `order`, `title`, `tagline`, `summary`, `role`, `client`, `year`, `disciplines`, `scope`, `tools`, `cover`.
3. Lakukan hal yang sama di `src/content/work/en/<slug-baru>.mdx`.
4. Siapkan `public/assets/work/<slug-baru>/cover.jpg` dan `proses-01..03.jpg`.
5. `npm run build`. Rute `/work/<slug-baru>` dan `/en/work/<slug-baru>` otomatis dibuat.

---

## 5. Deploy ke internet (gratis)

### Pratinjau cepat di HP (tanpa akun apa pun)

```bash
./scripts/preview-phone.sh
```

Perintah itu melakukan build, menyalakan server lokal, lalu membuka tunnel Cloudflare. Hasilnya dua alamat:

- `http://<IP-Mac>:4321` — untuk HP yang tersambung ke WiFi yang sama.
- `https://xxxx.trycloudflare.com` — bisa dibuka dari jaringan mana pun, termasuk data seluler.

Sifatnya sementara: URL mati begitu skrip dihentikan (Ctrl+C) atau Mac tidur. Untuk alamat permanen, pakai salah satu opsi di bawah.

### Opsi A — Cloudflare Pages lewat perintah (paling cepat)

```bash
npm run deploy      # build + unggah; pertama kali minta login sekali
```

Nama proyek menentukan alamat gratismu: `--project-name dandielucky` → `https://dandielucky.pages.dev`.
Setelah punya domain sendiri, buka **Cloudflare Pages → project → Custom domains → Add**.

**Autentikasi (sekali saja, salah satu):**

| Cara | Perintah / langkah | Cocok untuk |
|---|---|---|
| OAuth | `npx wrangler login` → tekan **Allow** di browser | Jalan normal, paling cepat |
| API token | Buat token di *dash.cloudflare.com/profile/api-tokens* dengan izin **Account → Cloudflare Pages → Edit**, simpan ke `~/.cloudflare-pages-token` | Kalau CLI tidak bisa membuka browser, atau untuk otomatisasi |

**Memperbarui situs kapan pun:** jalankan `npm run deploy` lagi. Tidak ada langkah lain — skripnya yang build, unggah, dan mencetak alamatnya.

**Kalau ada yang salah setelah deploy:** buka **Cloudflare → Workers & Pages → dandielucky → Deployments**, pilih versi sebelumnya, klik **Rollback**. Situs langsung kembali ke versi lama.

**Catatan versi supaya tidak berubah sendiri:** `wrangler` dikunci sebagai devDependency (4.162.0) dan `package-lock.json` ikut di-commit, jadi build di mesinmu memakai versi yang sama dari waktu ke waktu. Versi dependensi lain juga terkunci di lockfile itu.

### Opsi B — drag & drop (tanpa terminal)

1. `npm run build`
2. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Upload assets**
3. Seret folder `dist/` ke halaman itu.
4. Nama proyek: `dandie` → jadi `https://dandie.pages.dev`.

### Opsi C — GitHub + Cloudflare (otomatis setiap kali push)

1. `git remote add origin <repo-kamu>` lalu `git push -u origin main`
2. Cloudflare Pages → **Connect to Git** → pilih repo.
3. Build command: `npm run build` · Output directory: `dist`

### Setelah punya domain sendiri

Ubah dua tempat lalu build ulang:

- `astro.config.mjs` → `site: 'https://dandielucky.com'`
- `public/robots.txt` → baris `Sitemap:`

---

## 6. Checklist sebelum link ini dikirim ke recruiter

- [ ] `npm run check-assets` → **0 slot masih placeholder**
- [ ] Foto profil sudah terisi (bukan monogram "DLM")
- [ ] Semua `[DATA MENYUSUL]` di case study sudah diisi atau dihapus
- [ ] Link LinkedIn, Instagram, dan WhatsApp benar-benar bisa dibuka
- [ ] CV di `public/assets/cv/` adalah versi terbaru
- [ ] Dicoba buka di HP sendiri: navigasi, tombol menu, dan slider before/after
- [ ] `npm run build` tanpa error

---

## 7. Tema gelap & terang

Situs **default terang** (palet editorial yang sama dengan CV). Tombol ☾/☀ di header mengaktifkan tema gelap untuk pengunjung yang memilihnya:

- Pilihan disimpan di `localStorage` (`theme`), jadi bertahan saat pindah halaman dan saat kembali lagi.
- Dipasang oleh skrip kecil di `<head>` **sebelum** halaman dilukis, jadi tidak ada kedipan putih.
- Tidak mengikuti tema sistem operasi secara otomatis — disengaja, supaya recruiter dengan OS gelap tetap melihat versi terang yang sudah kamu setel.
- Semua pasangan warna teks/latar di tema gelap sudah diukur: rasio kontras terendah **5.88:1** (di atas ambang WCAG AA 4.5:1).

Mau menjadikannya terang‑saja atau gelap‑saja? Cukup hapus tombol `<button class="theme-toggle" ...>` di `src/components/Header.astro` — sisanya tidak perlu diubah.

## 8. Catatan desain

- **Arah visual**: editorial terang, tipografi Fraunces + Inter, satu warna aksen navy (`#1C3F5E`) yang sama dengan CV agar brand terasa satu.
- **Kenapa bukan dark**: karya berisi poster event terang, foto produk, dan UI aplikasi terang — latar gelap membuat semuanya tenggelam.
- **Motion**: durasi 0.4–0.7 s, easing `cubic-bezier(.16,1,.3,1)`. Tidak ada scroll-jacking, tidak ada preloader palsu.
- **Aksesibilitas**: skip link, `aria-current` di navigasi, fokus terlihat, semua animasi mati saat `prefers-reduced-motion`.
- **Performa**: tanpa framework UI, font dimuat mandiri (tanpa Google Fonts), tidak ada request pihak ketiga.
