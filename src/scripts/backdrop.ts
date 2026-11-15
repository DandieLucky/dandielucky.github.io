// Water Ripple — simulasi permukaan air sungguhan di belakang konten.
//
// Metode: dua kisi tinggi (Float32Array). Tiap bingkai tiap sel menjadi
// rata-rata empat tetangganya × 2 dikurangi nilainya sendiri, lalu diredam.
// Itu bentuk diskrit persamaan gelombang — riak benar-benar menyebar,
// memantul di tepi, dan bersilangan antar-jentikan.
//
// Semua yang terlihat diturunkan dari kisi tinggi itu:
//   • lereng gelombang -> kilau & bayangan (kesan permukaan air 3D)
//   • pembiasan: judul & paragraf bergeser ≥1 px mengikuti kemiringan air,
//     jadi teksnya ikut beriak tipis saat riak lewat (refraksi)
//   • warna air & pencampuran mode layar diatur CSS (.backdrop)
//
// Hemat: berhenti sendiri saat air tenang, saat tab disembunyikan, dan
// dimatikan untuk prefers-reduced-motion.

type Titik = { x: number; y: number };

let kanvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let bufTampil: HTMLCanvasElement | null = null;
let bufCtx: CanvasRenderingContext2D | null = null;
let gambar: ImageData | null = null;

// kisi tinggi: "sekarang" dan "sebelumnya"
let a: Float32Array = new Float32Array(0);
let b: Float32Array = new Float32Array(0);

let KOLOM = 0;
let BARIS = 0;
let SEL = 3; // px CSS per sel
let DPR = 1;

let jalan = false;
let raf = 0;
let pendengar = false;
let tenang = true;

let kursorLama: Titik = { x: -9999, y: -9999 };
let jatuhTerakhir = 0;

const kurangiGerak = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- setelan (bisa ditimpa lewat data-* di <html>) ----------
const ambil = (nama: string, cadangan: number) => {
  const v = parseFloat(document.documentElement.dataset[nama] ?? '');
  return Number.isFinite(v) ? v : cadangan;
};
const damping = () => ambil('rippleDamping', 0.992);
const radiusJatuh = () => ambil('rippleRadius', 6);
const kuatKlik = () => ambil('rippleKuat', 2400);
const kuatHover = () => ambil('rippleHover', 300);
const biasCahaya = () => ambil('rippleCahaya', 1600);
const biasBias = () => ambil('rippleBias', 60);

// ---------- kisi ----------
function ukurUlang() {
  if (!kanvas || !ctx) return;
  const w = Math.max(1, document.documentElement.clientWidth);
  const h = Math.max(1, window.innerHeight);
  DPR = Math.min(window.devicePixelRatio || 1, 2);

  // batasi jumlah sel supaya ringan (≤ ~260 ribu sel)
  SEL = Math.max(3, Math.ceil(Math.sqrt((w * h) / 260000)));
  KOLOM = Math.floor(w / SEL) + 1;
  BARIS = Math.floor(h / SEL) + 1;

  kanvas.width = Math.round(w * DPR);
  kanvas.height = Math.round(h * DPR);
  kanvas.style.width = w + 'px';
  kanvas.style.height = h + 'px';

  a = new Float32Array(KOLOM * BARIS);
  b = new Float32Array(KOLOM * BARIS);

  if (!bufTampil) {
    bufTampil = document.createElement('canvas');
    bufCtx = bufTampil.getContext('2d');
  }
  bufTampil.width = KOLOM;
  bufTampil.height = BARIS;
  gambar = bufCtx ? bufCtx.createImageData(KOLOM, BARIS) : null;
}

function siapkan() {
  document.querySelectorAll('canvas.backdrop').forEach((c, i) => {
    if (i > 0) c.remove();
  });
  const ada = document.querySelector('canvas.backdrop') as HTMLCanvasElement | null;
  const baru = ada ?? document.createElement('canvas');
  if (!ada) {
    baru.className = 'backdrop';
    baru.setAttribute('aria-hidden', 'true');
    document.body.prepend(baru);
  }
  kanvas = baru;
  ctx = baru.getContext('2d');
  ukurUlang();
}

// ---------- satu jentikan ----------
function jatuh(cx: number, cy: number, radiusPx: number, kuat: number) {
  const i0 = Math.round(cx / SEL);
  const j0 = Math.round(cy / SEL);
  const r = Math.max(2, Math.round(radiusPx / SEL));
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      const x = i0 + i;
      const y = j0 + j;
      if (x <= 0 || y <= 0 || x >= KOLOM - 1 || y >= BARIS - 1) continue;
      const d = Math.sqrt(i * i + j * j);
      if (d > r) continue;
      // turun di tengah, netral di tepi -> bentuk tetes
      const bentuk = Math.cos((d / r) * Math.PI * 0.5);
      a[y * KOLOM + x] += kuat * bentuk * bentuk;
    }
  }
  tenang = false;
}

// ---------- satu langkah simulasi + gambar ----------
function langkah() {
  if (!ctx || !kanvas || !gambar || !bufCtx || !bufTampil) return;

  const redam = damping();
  const bias = biasCahaya();
  const gelap = document.documentElement.dataset.theme === 'dark';
  let maks = 0;

  // A. persamaan gelombang (tepi = dinding: pinggiran diredam kuat,
  //    jadi riak memantul balik seperti di kolam, tidak hilang di tepi layar)
  for (let y = 1; y < BARIS - 1; y++) {
    const baris = y * KOLOM;
    for (let x = 1; x < KOLOM - 1; x++) {
      const i = baris + x;
      let baru =
        ((a[i - 1] + a[i + 1] + a[i - KOLOM] + a[i + KOLOM]) * 0.5 - b[i]) * redam;
      const diTepi = x < 2 || y < 2 || x > KOLOM - 3 || y > BARIS - 3;
      if (diTepi) baru *= 0.35;
      b[i] = baru;
      const abs = baru < 0 ? -baru : baru;
      if (abs > maks) maks = abs;
    }
  }
  // b berisi keadaan baru -> tukar supaya `a` selalu keadaan sekarang
  {
    const tukar = a;
    a = b;
    b = tukar;
  }

  // B. render: kemiringan gelombang -> kilau & bayangan
  const data = gambar.data;
  const alfaKilau = gelap ? 0.30 : 0.55;
  const alfaBayang = gelap ? 0.26 : 0.34;
  for (let y = 1; y < BARIS - 1; y++) {
    const baris = y * KOLOM;
    for (let x = 1; x < KOLOM - 1; x++) {
      const i = baris + x;
      const sx = (a[i - 1] - a[i + 1]) / 2;
      const sy = (a[i - KOLOM] - a[i + KOLOM]) / 2;
      let v = (-sx - sy) * (bias / 1000); // cahaya dari kiri-atas
      if (v > 220) v = 220;
      if (v < -220) v = -220;
      const p = i * 4;
      if (v >= 0) {
        data[p] = 255;
        data[p + 1] = 255;
        data[p + 2] = 255;
        data[p + 3] = (v * alfaKilau) | 0;
      } else {
        data[p] = 12;
        data[p + 1] = 22;
        data[p + 2] = 26;
        data[p + 3] = (-v * alfaBayang) | 0;
      }
    }
  }
  bufCtx.putImageData(gambar, 0, 0);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, kanvas.width, kanvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bufTampil, 0, 0, KOLOM * SEL * DPR, BARIS * SEL * DPR);

  // C. pembiasan konten mengikuti kemiringan air
  terapkanPembiasan(biasBias());

  // hening = puncak kecil DAN sudah tidak ada gundukan tersisa di kisi
  let sisa = 0;
  for (let i = KOLOM; i < a.length - KOLOM; i += 7) {
    const v = a[i] < 0 ? -a[i] : a[i];
    if (v > sisa) sisa = v;
  }

  if (maks < 2 && sisa < 45) {
    tenang = true;
    jalan = false;
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    a.fill(0);
    b.fill(0);
    pulihkanKonten();
    return;
  }
  raf = requestAnimationFrame(putar);
}

function putar() {
  langkah();
}

// ---------- pembiasan konten ----------
let elemenKonten: HTMLElement[] = [];
let siapKonten = false;

function cariKonten() {
  const pola: HTMLElement[] = [];
  const judul = document.querySelector<HTMLElement>('.hero-title, main h1, main .case-hero h1');
  if (judul) pola.push(judul);
  document.querySelectorAll<HTMLElement>('[data-ripple]').forEach((el) => pola.push(el));
  elemenKonten = pola;
  siapKonten = pola.length > 0;
}

// kemiringan air pada satu titik kisi
function lereng(xpx: number, ypx: number): Titik {
  const x = Math.max(1, Math.min(KOLOM - 2, Math.round(xpx / SEL)));
  const y = Math.max(1, Math.min(BARIS - 2, Math.round(ypx / SEL)));
  const i = y * KOLOM + x;
  return { x: (a[i - 1] - a[i + 1]) / 2, y: (a[i - KOLOM] - a[i + KOLOM]) / 2 };
}

function terapkanPembiasan(kuat: number) {
  if (!siapKonten) cariKonten();
  if (elemenKonten.length === 0) return;

  for (const el of elemenKonten) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) {
      if (el.style.transform) el.style.transform = '';
      continue;
    }
    // dua titik pada elemen: kiri-atas & kanan-bawah, lalu gabungkan
    const l = lereng(r.left + r.width * 0.2, r.top + r.height * 0.3);
    const rr = lereng(r.left + r.width * 0.8, r.top + r.height * 0.75);
    const sx = (l.x + rr.x) / 2;
    const sy = (l.y + rr.y) / 2;
    const batas = 4;
    const dx = Math.max(-batas, Math.min(batas, (sx * kuat) / 380));
    const dy = Math.max(-batas, Math.min(batas, (sy * kuat) / 380));
    el.style.transform =
      dx || dy ? `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)` : '';
    el.style.willChange = 'transform';
  }
}

function pulihkanKonten() {
  for (const el of elemenKonten) {
    el.style.transform = '';
    el.style.willChange = '';
  }
}

// ---------- penjadwalan ----------
function jadwal() {
  if (jalan || kurangiGerak() || document.hidden) return;
  jalan = true;
  raf = requestAnimationFrame(putar);
}

function pasang() {
  siapkan();

  window.addEventListener(
    'pointermove',
    (e) => {
      if (kurangiGerak()) return;
      const now = performance.now();
      const dx = e.clientX - kursorLama.x;
      const dy = e.clientY - kursorLama.y;
      const jarak = Math.hypot(dx, dy);
      const baru = kursorLama.x < -9000 || jarak > 400;
      kursorLama = { x: e.clientX, y: e.clientY };
      if (baru || jarak < 2) return;
      if (now - jatuhTerakhir < 42) return;
      jatuhTerakhir = now;
      // jejak bangun: makin cepat kursor, makin kuat jentikannya
      const kuat = Math.min(kuatHover(), kuatHover() * (jarak / 26));
      jatuh(e.clientX, e.clientY, radiusJatuh() * 1.1, kuat);
      jadwal();
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (kurangiGerak()) return;
      jatuh(e.clientX, e.clientY, radiusJatuh() * 1.7, kuatKlik());
      jadwal();
    },
    { passive: true }
  );

  window.addEventListener('resize', ukurUlang, { passive: true });
  document.addEventListener('mouseleave', () => {
    kursorLama = { x: -9999, y: -9999 };
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      jalan = false;
    } else if (!tenang) {
      jadwal();
    }
  });
  new MutationObserver(() => {
    ukurUlang();
    pulihkanKonten();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export function initBackdrop() {
  if (kurangiGerak()) return;
  if (!pendengar) {
    pendengar = true;
    pasang();
  } else {
    siapkan();
    pulihkanKonten();
  }
  cancelAnimationFrame(raf);
  jalan = false;
  tenang = true;
}
