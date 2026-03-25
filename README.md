This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



cp .env.example .env   # แล้วแก้ค่าให้ครบ
npm install
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev

ทำอะไร	คำสั่ง
รันโหมด dev (watch)	npm run pm2:dev
รันโหมด production	npm run build ก่อน แล้ว npm run pm2:prod
หยุด	npm run pm2:stop
รีสตาร์ท dev	npm run pm2:restart
ดู log	npm run pm2:logs
ลบ process ออกจาก PM2	npm run pm2:delete

Admin

อีเมล: admin@mawell.local
รหัสผ่าน: Admin123!

User ทดสอบ
อีเมล: user@mawell.local
รหัสผ่าน: User123!

npx prisma migrate deploy
npx prisma generate

cd /d "D:\Buffe App\web"
npm run pm2:stop
npm run pm2:dev
npm run pm2:restart