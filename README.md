# Website Prodi Magister Manajemen ITB HAS

Website Program Studi Magister Manajemen Institut Teknologi dan Bisnis Haji Agus Salim (ITB HAS).

Project ini mencakup website publik dan Admin Panel untuk pengelolaan konten Program Studi.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Argon2
- XLSX

## Fitur

### Website Publik

- Profil Program Studi
- Informasi akademik
- Data dosen
- Detail dosen
- Berita
- Detail berita
- Informasi pendaftaran

### Admin Panel

- Login admin
- Session-based authentication
- Manajemen data dosen
- Tambah, ubah, dan hapus data dosen
- Import data dosen melalui Excel
- Validasi NIDN
- Validasi pendidikan S1/S2/S3
- Audit log perubahan data

### API & Security

- Admin authentication untuk operasi perubahan data
- Validasi input pada API
- Pencegahan duplicate NIDN
- Atomic transaction untuk operasi data dan audit log
- Session menggunakan HTTP-only cookie
- Password menggunakan Argon2

## Development

### Prerequisites

Pastikan sudah terinstall:

- Node.js
- npm
- PostgreSQL

### Install Dependencies

```bash
npm install