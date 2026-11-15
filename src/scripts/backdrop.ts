// Latar interaktif: kisi-kisi halus yang meneriakkan sorot di sekitar kursor.
// Satu kanvas berukuran jendela, hanya menyala saat halaman punya data-backdrop
// atau elemen .backdrop. Dimatikan bila pengguna meminta gerak minim.

type Pt = { x: number; y: number };

let kursor: Pt = { x: -9999, y: -9999 };
let halus: Pt = { x: -9999, y: -9999 };
let jalan = false;
let raf = 0;
let kanvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let siap = false;
let pendengar = false;
let kisiGambar: HTMLCanvasElement | null = null;

const kurangiGerak = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- kanvas ukuran jendela, ikut resolusi layar (maks 2x agar hemat) ----
function siapkan() {
  // view transition mengganti <body>, jadi kanvas harus selalu disisipkan
  // ke body yang sedang aktif (bukan disimpan dari halaman sebelumnya).
  const lama = document.querySelectorAll('canvas.backdrop');
  lama.forEach((c, i) => {
    if (i === 0) return; // simpan satu, sisanya buang
    c.remove();
  });

  const ada = document.querySelector('canvas.backdrop') as HTMLCanvasElement | null;
  kanvas = ada ?? document.createElement('canvas');
  if (!ada) {
    kanvas.className = 'backdrop';
    kanvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(kanvas);
  }
  ctx = kanvas.getContext('2d');
  if (!pendengar) {
    window.addEventListener('resize', ukurUlang, { passive: true });
    window.addEventListener('scroll', ukurUlang, { passive: true });
    pendengar = true;
  }
  ukurUlang();
  siap = true;
}

function ukurUlang() {
  if (!kanvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = document.documentElement.clientWidth;
  const h = window.innerHeight;
  kanvas.width = Math.round(w * dpr);
  kanvas.height = Math.round(h * dpr);
  kanvas.style.width = w + 'px';
  kanvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  kisiGambar = null; // cache kisi ikut berubah ukuran
}

function aktif() {
  return document.documentElement.dataset.backdrop === 'on' || !!document.querySelector('[data-backdrop]');
}

// ---- kisi digambar sekali ke kanvas kecil, lalu diulang (pola) ----
function kisi(): HTMLCanvasElement | null {
  if (kisiGambar) return kisiGambar;
  const c = document.createElement('canvas');
  const G = 32; // jarak garis, px CSS
  c.width = G;
  c.height = G;
  const g = c.getContext('2d');
  if (!g) return null;
  g.strokeStyle = 'rgba(90, 78, 100, 0.5)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0.5, 0);
  g.lineTo(0.5, G);
  g.moveTo(0, 0.5);
  g.lineTo(G, 0.5);
  g.stroke();
  kisiGambar = c;
  return c;
}

function warna(nama: string, cadangan: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return v || cadangan;
}

function frame() {
  if (!ctx || !kanvas) return;
  const w = document.documentElement.clientWidth;
  const h = window.innerHeight;
  const gelap = document.documentElement.dataset.theme === 'dark';
  const ungu = warna('--plum', '#5f4575');
  const alfaKisi = parseFloat(warna('--kisi-alfa', '0.16')) || 0.16;
  const alfaSorot = parseFloat(warna('--sorot-alfa', '0.42')) || 0.42;
  const G = 32;
  const R = 210; // radius sorot

  // kursor bergerak halus menuju posisi asli
  const faktor = 0.12;
  halus.x += (kursor.x - halus.x) * faktor;
  halus.y += (kursor.y - halus.y) * faktor;

  const diam = Math.abs(kursor.x - halus.x) < 0.4 && Math.abs(kursor.y - halus.y) < 0.4;
  const masuk = kursor.x > -9000;

  ctx.clearRect(0, 0, w, h);

  // kalau kursor di luar jendela dan sudah berhenti -> tidak perlu gambar apa pun
  if (!masuk && diam) {
    jalan = false;
    return;
  }

  // 1. kisi dasar (sangat samar)
  const pola = kisi();
  if (pola) {
    const pat = ctx.createPattern(pola, 'repeat');
    if (pat) {
      ctx.globalAlpha = alfaKisi;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // 2. kisi yang lebih terang di sekitar kursor, ditapis lingkar sorot
  if (masuk) {
    ctx.save();
    const sorot = ctx.createRadialGradient(halus.x, halus.y, 0, halus.x, halus.y, R);
    const kuat = alfaSorot;
    sorot.addColorStop(0, hexDanAlfa(ungu, kuat));
    sorot.addColorStop(0.55, hexDanAlfa(ungu, kuat * 0.45));
    sorot.addColorStop(1, hexDanAlfa(ungu, 0));
    ctx.fillStyle = sorot;
    ctx.fillRect(halus.x - R, halus.y - R, R * 2, R * 2);
    ctx.restore();
  }

  // 3. kotak kisi di sekitar kursor menyala satu per satu (maks 4x4)
  if (masuk) {
    const cx = Math.floor(halus.x / G);
    const cy = Math.floor(halus.y / G);
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        const gx = cx + i;
        const gy = cy + j;
        const px = gx * G + G / 2;
        const py = gy * G + G / 2;
        const d = Math.hypot(px - halus.x, py - halus.y);
        if (d > R * 0.8) continue;
        const t = 1 - d / (R * 0.8);
        ctx.globalAlpha = t * t * (alfaSorot * 1.1);
        ctx.fillStyle = ungu;
        ctx.fillRect(gx * G + 1, gy * G + 1, G - 2, G - 2);
      }
    }
    ctx.globalAlpha = 1;

    // 4. titik kecil tepat di kursor
    ctx.beginPath();
    ctx.arc(halus.x, halus.y, gelap ? 3 : 2.4, 0, Math.PI * 2);
    ctx.fillStyle = hexDanAlfa(ungu, gelap ? 0.85 : 0.7);
    ctx.fill();
  }

  // lanjutkan loop selama masih ada gerakan atau kursor di jendela
  if (!diam || masuk) {
    raf = requestAnimationFrame(frame);
  } else {
    jalan = false;
  }
}

function hexDanAlfa(hex: string, a: number) {
  const h = hex.replace('#', '').trim();
  const penuh = h.length === 3 ? h.split('').map((x) => x + x).join('') : h.padEnd(6, '0').slice(0, 6);
  const r = parseInt(penuh.slice(0, 2), 16) || 95;
  const g = parseInt(penuh.slice(2, 4), 16) || 69;
  const b = parseInt(penuh.slice(4, 6), 16) || 117;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function mulai() {
  if (jalan) return;
  jalan = true;
  raf = requestAnimationFrame(frame);
}

function pasang() {
  if (kurangiGerak() || !aktif()) return;
  siapkan();
  if (!siap) return;

  window.addEventListener(
    'pointermove',
    (e) => {
      kursor = { x: e.clientX, y: e.clientY };
      mulai();
    },
    { passive: true }
  );
  window.addEventListener(
    'pointerdown',
    (e) => {
      kursor = { x: e.clientX, y: e.clientY };
      mulai();
    },
    { passive: true }
  );
  document.addEventListener('mouseleave', () => {
    kursor = { x: -9999, y: -9999 };
    mulai();
  });
  window.addEventListener('blur', () => {
    kursor = { x: -9999, y: -9999 };
    mulai();
  });

  // tema berubah -> gambar ulang sekali supaya warna kisi ikut
  new MutationObserver(() => {
    ukurUlang();
    kursor = { x: -9999, y: -9999 };
    jalan = false;
    mulai();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export function initBackdrop() {
  if (!document.querySelector('[data-backdrop]') && document.documentElement.dataset.backdrop !== 'on') {
    return;
  }
  if (kurangiGerak()) {
    // gerak minim: cukup kisi statis lewat CSS, tanpa kanvas
    return;
  }
  pasang();
  mulai();
}
