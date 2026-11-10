# CHSB Backend (Express + Prisma + Neon PostgreSQL)

## 1. Neon database
1. Neon Console'da yangi project oching.
2. Connection Details'dan pooled connection string (`-pooler`) ni `DATABASE_URL` ga, direct connection string'ni `DIRECT_URL` ga qo'ying.
3. `backend/.env.example` nusxasini `backend/.env` qiling va qiymatlarni to'ldiring. `.env` ni GitHub'ga yubormang.

## 2. Install and initialize (Windows PowerShell)
```powershell
cd backend
npm install
Copy-Item .env.example .env
# .env ichidagi DATABASE_URL, DIRECT_URL va JWT_SECRET qiymatlarini tahrirlang
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```
API health: http://localhost:5000/api/health

Demo accounts (faqat dastlabki tekshiruv uchun):
- admin / ChangeMe123!
- teacher.demo / ChangeMe123!
- student.demo / ChangeMe123!

Birinchi kirishdan so'ng demo parollarni o'zgartiring. Haqiqiy o'quvchi hisoblarini admin yaratishi kerak.

## 3. Connect the existing React frontend
Root project `.env` faylida:
```env
VITE_API_URL=http://localhost:5000/api
VITE_USE_REAL_BACKEND=true
```
Frontendni root papkada `npm run dev` bilan ishga tushiring.

## Notes
- API `/api` prefiksi bilan ishlaydi.
- Student test endpointlari to'g'ri javob va izohlarni test vaqtida qaytarmaydi; baholash serverda bajariladi.
- JWT 12 soat amal qiladi. HTTPS va kuchli JWT_SECRET ishlating.
- Ishga chiqarishdan oldin backup, rate limiting, audit log, e-mail unikalligi siyosati va ma'lumotlarni validatsiya qilishni kuchaytirish kerak.
