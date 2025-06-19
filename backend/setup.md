Bantu saya setup backend untuk aplikasi Job Tracker menggunakan stack berikut:

📦 Tech Stack:
- Express.js + TypeScript
- Prisma untuk ORM
- Zod untuk validasi
- Jest + Supertest untuk testing
- Folder `backend/` sebagai root

🎯 Tujuan:
Siapkan struktur backend lengkap agar siap dikembangkan lebih lanjut berdasarkan ERD dan task-list.

🧱 Struktur yang saya inginkan:
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   ├── validators/
│   └── openapi/
├── prisma/
│   └── schema.prisma
├── tests/
│   └── job.test.ts
├── .env
├── tsconfig.json
├── jest.config.ts
└── package.json

📋 Langkah yang saya ingin dilakukan secara otomatis:
1. Inisialisasi project (`pnpm init`)
2. Install dependencies utama dan dev (`express`, `prisma`, `typescript`, dll.)
3. Inisialisasi Prisma (`npx prisma init`)
4. Buat `tsconfig.json` dan `nodemon` atau `ts-node-dev` config
5. Setup struktur folder
6. Buat route `/health` untuk test pertama
7. Sertakan file test awal menggunakan Jest + Supertest
8. Sertakan validasi `Zod` untuk contoh route
