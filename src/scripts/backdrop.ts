// Jentikan air di kursor: cincin tipis yang menyebar lalu memudar.
// Latar dibiarkan kosong — tidak ada garis/kisi/gelombang yang menutupi teks.
// Cincin hanya lahir saat kursor benar-benar bergerak, lalu hilang sendiri.

type Cincin = { x: number; y: number; lahir: number; radius: number; tebal: number };

let kanvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let jalan = false;
let pendengar = false;

let cincin: Cincin[] = [];
let terakhir = { x: -9999, y: -9999 };
let diamSejak = 0;
let jarakJalan = 0;

const kurangiGerak = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const JARAK_MIN = 52; // px — jeda minimum antar cincin
const JARAK_MAKS = 140; // px — saat kursor bergerak cepat, cincin lebih renggang
const UMUR = 820; // ms
const RADIUS_AKHIR = 58; // px
const MAKS = 14; // cincin bersamaan

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

function warna(nama: string, cadangan: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return v || cadangan;
}

function hexDanAlfa(hex: string, a: number) {
  const h = hex.replace('#', '').trim();
  const penuh =
    h.length === 3 ? h.split('').map((x) => x + x).join('') : h.padEnd(6, '0').slice(0, 6);
  const r = parseInt(penuh.slice(0, 2), 16) || 42;
  const g = parseInt(penuh.slice(2, 4), 16) || 111;
  const b = parseInt(penuh.slice(4, 6), 16) || 119;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function frame(t: number) {
  if (!ctx || !kanvas) return;
  const w = document.documentElement.clientWidth;
  const h = window.innerHeight;
  const gelap = document.documentElement.dataset.theme === 'dark';
  const air = warna('--jentik-warna', gelap ? '#a8e0e2' : '#2a6f77');
  const alfaDasar = parseFloat(warna('--jentik-alfa', '0.34')) || 0.34;

  ctx.clearRect(0, 0, w, h);
  cincin = cincin.filter((c) => t - c.lahir < UMUR);

  for (const c of cincin) {
    const p = Math.min(1, (t - c.lahir) / UMUR);
    const mudah = 1 - Math.pow(1 - p, 2.2); // melambat seperti riak air
    const r = c.radius + (RADIUS_AKHIR - c.radius) * mudah;
    const alfa = alfaDasar * (1 - p) * (1 - p);

    // cincin utama
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = hexDanAlfa(air, alfa);
    ctx.lineWidth = c.tebal * (1 - p * 0.6);
    ctx.stroke();

    // cincin kedua lebih lebar & samar -> kesan permukaan air, bukan donat
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * 1.32, 0, Math.PI * 2);
    ctx.strokeStyle = hexDanAlfa(air, alfa * 0.32);
    ctx.lineWidth = Math.max(0.5, c.tebal * 0.65 * (1 - p));
    ctx.stroke();
  }

  if (cincin.length > 0) {
    raf = requestAnimationFrame(frame);
  } else {
    ctx.clearRect(0, 0, w, h);
    jalan = false;
  }
}

function jadwal() {
  if (jalan) return;
  jalan = true;
  raf = requestAnimationFrame(frame);
}

function pasang() {
  siapkan();

  window.addEventListener(
    'pointermove',
    (e) => {
      if (kurangiGerak()) return;
      const now = performance.now();
      const dx = e.clientX - terakhir.x;
      const dy = e.clientY - terakhir.y;
      const jarak = Math.hypot(dx, dy);

      // kursor baru masuk jendela -> jangan tarik cincin dari titik mustahil
      if (terakhir.x < -9000 || jarak > 400) {
        terakhir = { x: e.clientX, y: e.clientY };
        diamSejak = now;
        jarakJalan = 0;
        return;
      }
      if (jarak < 1.2) return; // getaran mikro diabaikan

      terakhir = { x: e.clientX, y: e.clientY };
      diamSejak = now;

      // makin cepat kursor, makin renggang cincinnya supaya tidak menumpuk
      const cepat = Math.min(1, jarak / 40);
      const butuh = JARAK_MIN + (JARAK_MAKS - JARAK_MIN) * cepat;
      jarakJalan += jarak;

      if (jarakJalan >= butuh && cincin.length < MAKS) {
        jarakJalan = 0;
        cincin.push({ x: e.clientX, y: e.clientY, lahir: now, radius: 4, tebal: 1.1 });
        jadwal();
      }
    },
    { passive: true }
  );

  document.addEventListener('mouseleave', () => {
    terakhir = { x: -9999, y: -9999 };
  });
  window.addEventListener('blur', () => {
    terakhir = { x: -9999, y: -9999 };
  });
  window.addEventListener('resize', ukurUlang, { passive: true });
  new MutationObserver(() => ukurUlang()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

export function initBackdrop() {
  if (kurangiGerak()) return;
  if (!pendengar) {
    pendengar = true;
    pasang();
  } else {
    siapkan();
  }
  cancelAnimationFrame(raf);
  jalan = false;
  cincin = [];
}
