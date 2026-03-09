# FinTrack

Aplikasi web untuk mencatat pemasukan, pengeluaran, dan progres tabungan.

## Perubahan Penting

Project ini sekarang mendukung penyimpanan persisten via Supabase, jadi data transaksi tidak hilang saat deploy di Vercel.

## Teknologi

- Next.js 14
- React 18
- Tailwind CSS
- Recharts
- Supabase (database persistence)

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Setup Supabase (Wajib untuk Data Persisten)

1. Buat project di Supabase.
2. Buka SQL Editor, jalankan isi file [supabase/schema.sql](supabase/schema.sql).
3. Ambil value:
   - `Project URL` (untuk `NEXT_PUBLIC_SUPABASE_URL`)
   - `service_role key` (untuk `SUPABASE_SERVICE_ROLE_KEY`)
4. Buat `.env.local` dari [.env.example](.env.example):

```bash
cp .env.example .env.local
```

Lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Restart dev server setelah env diisi.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project ke Vercel.
3. Di Vercel Project Settings -> Environment Variables, isi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy.

## Cara Kerja Penyimpanan

- Browser punya `client_id` otomatis (disimpan di localStorage).
- State transaksi disimpan ke:
  - localStorage (cache lokal)
  - Supabase table `finance_states` (sumber data utama)
- Saat web dibuka, app akan:
  - coba ambil data dari Supabase
  - fallback ke localStorage jika Supabase belum tersedia

## Catatan Keamanan

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh disimpan di server env (Vercel/`.env.local`), jangan dibagikan.
