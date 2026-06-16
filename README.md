# Glorya Motor POS

Sistem Kasir dan Manajemen Bengkel untuk **Glorya Motor** — dibangun dengan Next.js 14 & Supabase.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase)](https://supabase.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://pos-glorya-motor.vercel.app)

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Prasyarat & Instalasi](#prasyarat--instalasi)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Cara Penggunaan](#cara-penggunaan)
- [Struktur Direktori](#struktur-direktori)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)
- [Kontak](#kontak)

---

## Tentang Proyek

**Glorya Motor POS** adalah aplikasi *Point of Sale* dan manajemen bengkel yang dirancang khusus untuk toko spare part dan bengkel motor **Glorya Motor**. Aplikasi ini memungkinkan kasir dan admin untuk mengelola transaksi penjualan, stok barang, serta memantau laporan keuangan secara *real-time* — semuanya dalam satu platform web yang dapat diinstal sebagai PWA di perangkat apapun.

**Live Demo**: [pos-glorya-motor.vercel.app](https://pos-glorya-motor.vercel.app)

---

## Fitur Utama

- **Transaksi Kasir** — proses penjualan spare part dan jasa servis dengan cepat dan mudah
- **Manajemen Produk** — kelola daftar barang, harga, dan stok secara terpusat
- **Dashboard & Laporan** — visualisasi data penjualan harian/bulanan dengan grafik interaktif
- **Autentikasi Aman** — sistem login berbasis Supabase Auth dengan proteksi route via middleware
- **Dark / Light Mode** — tampilan dapat disesuaikan dengan preferensi pengguna
- **Progressive Web App (PWA)** — dapat diinstal langsung di perangkat mobile maupun desktop tanpa *app store*
- **Notifikasi Real-time** — feedback instan untuk setiap aksi melalui toast notification

---

## Tech Stack

| Teknologi | Kegunaan |
|---|---|
| [Next.js 14](https://nextjs.org/) | Framework React dengan App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Supabase](https://supabase.com/) | Database PostgreSQL & Authentication |
| [TanStack React Query v5](https://tanstack.com/query) | Server state management & data caching |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client state management |
| [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | Komponen UI yang accessible |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS styling |
| [Recharts](https://recharts.org/) | Visualisasi grafik & data |
| [next-pwa](https://github.com/DucanH2912/next-pwa) | Progressive Web App support |
| [Sonner](https://sonner.emilkowal.ski/) | Toast notifications |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark / Light mode |

---

## Prasyarat & Instalasi

### Prasyarat

Pastikan hal berikut sudah terinstal sebelum memulai:

- [Node.js](https://nodejs.org/) versi **18.17+**
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), atau [pnpm](https://pnpm.io/)
- Akun [Supabase](https://supabase.com/) untuk database dan autentikasi

### Langkah Instalasi

**1. Clone repositori ini**

```bash
git clone https://github.com/elkanajnrmanullang/pos-glorya-motor.git
cd pos-glorya-motor
```

**2. Install semua dependensi**

```bash
npm install
```

**3. Konfigurasi variabel lingkungan**

```bash
cp .env.example .env.local
```

Isi nilai yang dibutuhkan — lihat bagian [Variabel Lingkungan](#variabel-lingkungan).

**4. Jalankan server pengembangan**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## Variabel Lingkungan

Buat file `.env.local` di root proyek dan isi dengan kredensial dari dashboard Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Perhatian:** Jangan pernah melakukan commit file `.env.local` ke repositori. File ini sudah tercantum di `.gitignore`.

Untuk mendapatkan nilai di atas: masuk ke [dashboard Supabase](https://app.supabase.com/) → pilih proyek Anda → **Project Settings** → **API**.

---

## Cara Penggunaan

Setelah aplikasi berjalan di `localhost:3000`, Anda akan diarahkan otomatis ke halaman login. Masuk menggunakan akun yang terdaftar di Supabase untuk mengakses sistem.

**Script yang tersedia:**

```bash
npm run dev      # Jalankan server development (http://localhost:3000)
npm run build    # Build aplikasi untuk produksi
npm run start    # Jalankan versi produksi setelah build
npm run lint     # Periksa kode dengan ESLint
```

---

## Struktur Direktori

```
pos-glorya-motor/
├── app/                    # Next.js App Router — halaman & layout
│   ├── (auth)/             # Grup rute autentikasi (login, dsb.)
│   ├── (dashboard)/        # Grup rute utama setelah login
│   └── layout.tsx          # Root layout aplikasi
├── components/
│   └── ui/                 # Komponen UI reusable (shadcn/ui)
├── lib/                    # Fungsi utilitas & konfigurasi
│   └── supabase/           # Supabase client, server, & middleware helper
├── middleware.ts            # Proteksi route — validasi sesi Supabase
├── tailwind.config.ts       # Konfigurasi Tailwind CSS
├── next.config.mjs          # Konfigurasi Next.js + PWA
├── components.json          # Konfigurasi shadcn/ui
└── package.json
```

---

## Kontribusi

Proyek ini dikembangkan sebagai solusi nyata sekaligus portofolio pribadi untuk kebutuhan operasional **Bengkel Glorya Motor**.

Saran dan masukan tetap terbuka. Jika Anda menemukan bug atau ingin mengusulkan fitur baru:

1. Silahkan E-Mail ke email pribadi saya.
2. Jika ingin berkontribusi langsung, silakan *fork* repositori ini dan buat *Pull Request*

---


## Kontak

**Elkana Juanro Manullang**

- GitHub: [@elkanajnrmanullang](https://github.com/elkanajnrmanullang)
- Gmail: elkanamanullang7@gmail.com
<!-- - Temukan bug? Silakan buka [Issue baru](https://github.com/elkanajnrmanullang/pos-glorya-motor/issues/new) -->