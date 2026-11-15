// Latar air bening: tirai garis tipis yang beriak seperti permukaan air.
// Riak paling terang di sekitar kursor; gelombang tetap bergerak pelan sendiri.
// Kanvas dibuat satu kali lalu disisipkan ulang ke <body> yang sedang aktif
// (view transition mengganti <body>, jadi kanvas lama ikut hilang).

type Pt = { x: number; y: number };

let kursor: Pt = { x: -9999, y: -9999 };
let halus: Pt = { x: -9999, y: -9999 };
let jalan = false;
let raf = 0;
let waktu = 0;
let kanvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let pendengar = false;

const kurangiGerak = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- kanvas ukuran jendela ----
function siapkan() {
  const semua = document.querySelectorAll<HTMLCanvasElement>('canvas.backdrop');
  semua.forEach((c, i) => {
    if (i > 0) c.remove();
  });

  const ada: HTMLCanvasElement | null = document.querySelector('canvas.backdrop');
  kanvas = ada ?? document.createElement('canvas');
  if (!ada) {
    kanvas.className = 'backdrop';
    kanvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(kanvas);
  }
  ctx = kanvas.getContext('2d');
  if (!pendengar) {
    window.addEventListener('resize', ukurUlang, { passive: true });
    pendengar = true;
  }
  ukurUlang();
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
}

function aktif() {
  return (
    document.documentElement.dataset.backdrop === 'on' ||
    !!document.querySelector('[data-backdrop]')
  );
}

function warna(nama: string, cadangan: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return v || cadangan;
}

function hexDanAlfa(hex: string, a: number) {
  const h = hex.replace('#', '').trim();
  const penuh =
    h.length === 3
      ? h
          .split('')
          .map((x) => x + x)
          .join('')
      : h.padEnd(6, '0').slice(0, 6);
  const r = parseInt(penuh.slice(0, 2), 16) || 42;
  const g = parseInt(penuh.slice(2, 4), 16) || 111;
  const b = parseInt(penuh.slice(4, 6), 16) || 119;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ---- satu tirai: garis mendatar yang naik-turun seperti permukaan air ----
function tirai(
  c: CanvasRenderingContext2D,
  w: number,
  y: number,
  amp: number,
  panjang: number,
  kecepatan: number,
  fase: number,
  alfaDasar: number,
  warnaLembut: string,
  warnaKuat: string,
  R: number
) {
  const langkah = 10; // jarak sampel, px CSS
  const titik: number[] = [];

  for (let x = -langkah; x <= w + langkah; x += langkah) {
    // dua lapis gelombang -> terlihat organik, tidak seperti sinus kaku
    let yv =
      Math.sin(x / panjang + waktu * kecepatan + fase) * amp +
      Math.sin(x / (panjang * 0.43) - waktu * kecepatan * 0.7 + fase * 1.7) * amp * 0.34;

    // permukaan air tertarik sedikit ke arah kursor -> terasa beriak
    const dx = x - halus.x;
    const dy = y - halus.y;
    const jarak2 = dx * dx + dy * dy;
    const tarik = Math.exp(-jarak2 / (R * R)) * 15;
    yv += (halus.y > y ? 1 : -1) * tarik;

    titik.push(yv);
  }

  c.beginPath();
  let i = 0;
  for (let x = -langkah; x <= w + langkah; x += langkah, i++) {
    const yv = y + titik[i];
    if (i === 0) c.moveTo(x, yv);
    else c.lineTo(x, yv);
  }

  const grad = c.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, hexDanAlfa(warnaLembut, 0));
  grad.addColorStop(0.1, warnaLembut);
  grad.addColorStop(0.9, warnaLembut);
  grad.addColorStop(1, hexDanAlfa(warnaLembut, 0));
  c.strokeStyle = grad;
  c.globalAlpha = alfaDasar;
  c.lineWidth = 1.15;
  c.stroke();

  // pantulan kursor: garis lebih terang hanya di sekitar kursor
  if (halus.x > -9000) {
    c.save();
    const sorot = c.createRadialGradient(halus.x, halus.y, 0, halus.x, halus.y, R);
    sorot.addColorStop(0, warnaKuat);
    sorot.addColorStop(0.45, warnaLembut);
    sorot.addColorStop(1, hexDanAlfa(warnaKuat, 0));
    c.strokeStyle = sorot;
    c.globalAlpha = Math.min(0.85, alfaDasar * 4);
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
  }
  c.globalAlpha = 1;
}

function frame() {
  if (!ctx || !kanvas) return;
  const w = document.documentElement.clientWidth;
  const h = window.innerHeight;
  const gelap = document.documentElement.dataset.theme === 'dark';
  const R = 200;

  const warnaJauh = warna('--air-1', gelap ? '#7ec6c9' : '#2a6f77');
  const warnaDekat = warna('--air-2', gelap ? '#2a6f77' : '#7ec6c9');
  const alfaDasar = parseFloat(warna('--air-alfa', '0.16')) || 0.16;

  // kursor dikejar pelan -> riak terasa punya massa
  if (halus.x < -9000 && kursor.x > -9000) {
    halus = { ...kursor };
  } else {
    halus.x += (kursor.x - halus.x) * 0.055;
    halus.y += (kursor.y - halus.y) * 0.055;
  }

  const kursorTerlihat = halus.x > -9000;

  waktu += 1 / 60;
  ctx.clearRect(0, 0, w, h);

  const jumlah = 11;
  for (let i = 0; i < jumlah; i++) {
    const t = i / (jumlah - 1);
    const y = h * (0.1 + t * 0.82);
    const amp = (7 + Math.sin(t * 3.1 + 1.2) * 5) * (w < 640 ? 0.72 : 1);
    const panjang = (150 + (i % 4) * 55) * (w < 640 ? 1.5 : 1);
    const kecepatan = 0.3 + (i % 3) * 0.09;
    const fase = i * 1.53;

    // gelombang yang sedang dilewati kursor diberi sedikit tambahan alfa
    const jarakY = kursorTerlihat ? Math.abs(halus.y - y) : 1e4;
    const dekat = Math.exp(-(jarakY * jarakY) / (2 * Math.pow(h * 0.3, 2)));
    const alfa = alfaDasar * (0.6 + dekat * 0.8);

    tirai(ctx, w, y, amp, panjang, kecepatan, fase, alfa, warnaJauh, warnaDekat, R);
  }

  raf = requestAnimationFrame(frame);
}

function mulai() {
  if (jalan) return;
  jalan = true;
  raf = requestAnimationFrame(frame);
}

function pasang() {
  siapkan();

  window.addEventListener(
    'pointermove',
    (e) => {
      kursor = { x: e.clientX, y: e.clientY };
    },
    { passive: true }
  );
  window.addEventListener(
    'pointerdown',
    (e) => {
      kursor = { x: e.clientX, y: e.clientY };
    },
    { passive: true }
  );
  document.addEventListener('mouseleave', () => {
    kursor = { x: -9999, y: -9999 };
  });
  window.addEventListener('blur', () => {
    kursor = { x: -9999, y: -9999 };
  });

  // tema berubah -> ukuran & warna dibaca ulang otomatis di frame berikutnya
  new MutationObserver(() => {
    ukurUlang();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export function initBackdrop() {
  if (!aktif()) return;
  if (kurangiGerak()) {
    // gerak minim: cukup lapisan air statis lewat CSS, tanpa kanvas
    return;
  }
  if (!pendengar) {
    pendengar = true;
    pasang();
  } else {
    siapkan();
  }
  cancelAnimationFrame(raf);
  jalan = false;
  mulai();
}
