# Optic Nerve Package (React + Vite)

A simple web app to run an optic nerve screen (Ishihara 16 plates, red dot, brightness/red desat, pupils, EOMs, CVF, disc exam).

## How to use (no coding required)

1. Put your Ishihara images in `public/plates/` named:
   - `plate01.jpg` ... `plate16.jpg`

2. Deploy with Netlify (GitHub → Netlify)
   - Commit this folder to your GitHub repo.
   - On Netlify: **New site from Git** → pick your repo.
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Deploy. You’ll get a public URL.

3. Local dev (optional)
   ```bash
   npm install
   npm run dev
   ```

> Plates are loaded from `/plates/plateNN.jpg`. Replace with your own licensed images.
