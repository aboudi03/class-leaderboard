# Level Up Heroes

Gamified classroom behavior and achievement platform built with Next.js.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## MongoDB setup

1. Copy `.env.example` to `.env.local`.
2. Replace `<db_username>` and `<db_password>` in `MONGODB_URI` with your MongoDB Atlas database user credentials.
3. If needed, allow your IP address in MongoDB Atlas under **Network Access**.
4. Start the app. Mongoose creates the `students` and `pointtransactions` collections when the first documents are inserted.

The app uses the `class-leaderboard` database by default. You can change it with `MONGODB_DB_NAME`.

## Production build

```bash
npm run lint
npm run build
npm start
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Keep the detected framework as **Next.js** and click **Deploy**.

Add `MONGODB_URI` and, optionally, `MONGODB_DB_NAME` to the Vercel project's environment variables before deploying. Students, photos, point totals, and history are stored in MongoDB and shared across devices.
