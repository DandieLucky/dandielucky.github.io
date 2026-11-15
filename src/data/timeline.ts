export type TimelineEntry = {
  year: string;
  role: { id: string; en: string };
  org: { id: string; en: string };
};

/** Isi `year` hanya yang benar-benar diketahui — jangan mengarang tanggal. */
export const timeline: TimelineEntry[] = [
  {
    year: 'Mei 2025 — sekarang',
    role: { id: 'Social Media Specialist', en: 'Social Media Specialist' },
    org: { id: 'Matahari Grosir', en: 'Matahari Grosir' },
  },
  {
    year: '2026',
    role: { id: 'Desainer UI/UX, Aplikasi Internal', en: 'UI/UX Designer, Internal Application' },
    org: { id: 'TNI AL — Pusinfomar', en: 'TNI AL — Pusinfomar' },
  },
  {
    year: '2026',
    role: { id: 'Tim Motion Graphics', en: 'Motion Graphics Team' },
    org: { id: 'HUT ke-50 Darya Varia', en: 'Darya Varia 50th Anniversary' },
  },
  {
    year: '2026',
    role: { id: 'Desainer Konten Media Sosial', en: 'Social Media Content Designer' },
    org: { id: 'Olimpiade Polimedia & PKKMB Polimedia', en: 'Polimedia Olympiad & PKKMB Polimedia' },
  },
  {
    year: '',
    role: { id: 'Tim Kreatif, Dokumentasi & Teknis Lapangan', en: 'Creative, Documentation & Field Tech Team' },
    org: { id: 'BNSP', en: 'BNSP (National Professional Certification Body)' },
  },
  {
    year: '',
    role: { id: 'Staf Hubungan Masyarakat', en: 'Public Relations Staff' },
    org: { id: 'BEM Polimedia', en: 'BEM Polimedia (Student Executive Board)' },
  },
];

export const skills = [
  {
    title: { id: 'Desain Grafis & Visual', en: 'Graphic & Visual Design' },
    items: ['Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Canva'],
  },
  {
    title: { id: 'UI/UX', en: 'UI/UX' },
    items: ['Wireframe', 'User flow', 'Prototipe interaktif / interactive prototype', 'Design system (Figma)'],
  },
  {
    title: { id: 'Video & Motion', en: 'Video & Motion' },
    items: ['Adobe Premiere Pro', 'DaVinci Resolve', 'CapCut'],
  },
  {
    title: { id: 'Fotografi & Editing', en: 'Photography & Editing' },
    items: ['Adobe Lightroom', 'Product photography', 'Retouching'],
  },
  {
    title: { id: 'AI & Otomasi Kerja', en: 'AI & Work Automation' },
    items: ['AI agent workflow (Hermes Agent)', 'Prompt-based drafting', 'Aset & QC otomatis'],
  },
  {
    title: { id: 'Pemrograman (dasar)', en: 'Programming (basic)' },
    items: ['Flutter', 'PHP', 'SQL', 'Unity'],
  },
];
