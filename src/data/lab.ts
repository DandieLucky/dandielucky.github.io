export type LabEntry = {
  n: string;
  title: { id: string; en: string };
  body: { id: string; en: string };
  status: { id: string; en: string };
  stack: string[];
  href?: string;
};

export const lab: LabEntry[] = [
  {
    n: '01',
    title: { id: 'Situs portofolio ini', en: 'This portfolio site' },
    body: {
      id: 'Dibangun sendiri dengan Astro dan CSS dari nol — tanpa template — lengkap dengan dua bahasa, motion yang menghormati preferensi pengguna, filter karya, dan pengecekan aset otomatis.',
      en: 'Hand-built with Astro and CSS from scratch — no template — with two languages, motion that respects user preferences, work filtering, and automated asset checks.',
    },
    status: { id: 'Live', en: 'Live' },
    stack: ['Astro', 'CSS', 'Vanilla JS'],
  },
  {
    n: '02',
    title: { id: 'Generator CV ATS satu halaman', en: 'One-page ATS CV generator' },
    body: {
      id: 'Alur kerja untuk menyusun CV yang lolos pembaca ATS: layout satu kolom dibangun dari HTML, tinggi halaman diukur otomatis supaya tidak pernah lewat satu halaman, lalu dicetak ke PDF lewat Chromium.',
      en: 'A workflow for building ATS-safe CVs: a single-column layout from HTML, page height measured automatically so it never spills to a second page, then printed to PDF through Chromium.',
    },
    status: { id: 'Selesai', en: 'Done' },
    stack: ['HTML', 'Headless Chromium', 'Hermes Agent'],
  },
  {
    n: '03',
    title: { id: 'Workflow AI agent untuk produksi konten', en: 'AI-agent workflow for content production' },
    body: {
      id: 'Memakai AI agent untuk riset referensi, menyusun draft caption, dan mengecek konsistensi aset sebelum tayang — mempercepat bagian yang berulang, tanpa menyerahkan keputusan visual ke mesin.',
      en: 'Using an AI agent for reference research, caption drafting, and pre-publish asset checks — speeding up the repetitive parts without handing visual decisions to a machine.',
    },
    status: { id: 'Berjalan', en: 'Ongoing' },
    stack: ['Hermes Agent'],
  },
];
