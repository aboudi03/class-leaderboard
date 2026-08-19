# Level Up Heroes

Gamified classroom behavior and achievement platform built with Next.js.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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

No environment variables are required. Student records, photos, points, and history are stored in each browser's localStorage. This means data is local to that browser and device; it is not shared between devices.
