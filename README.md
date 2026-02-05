# Will You Be My Valentine?

A tiny, playful Valentine website built with Next.js (App Router) + TypeScript.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **New Project** → import the repo.
3. Keep defaults (no config needed) and deploy.

## Replace the image

Swap the file at `public/valentine.jpg` with your own image.  
The page uses `next/image`, so any JPG/PNG with a similar aspect ratio looks best.

## Customize text

Edit the text in `app/page.tsx`:
- The main question and subtitle in the `"ask"` section.
- The celebration message and subtitle in the `"celebrate"` section.
