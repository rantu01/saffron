# SaffronEdge — Marketing Agency Website

A modern marketing agency website built with Next.js and Tailwind CSS. This repo contains the landing pages and UI components used by Saffron Edge for case studies, services, and client testimonials.

## Features

- Next.js App Router (app/)
- Tailwind CSS for utility-first styling
- Framer Motion for subtle UI animations
- Responsive components for hero, testimonials, case studies, and blog grids

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open the site in your browser:

```text
http://localhost:3000
```

## Scripts

- `npm run dev` — start Next.js in development mode
- `npm run build` — create an optimized production build
- `npm run start` — run the production build locally

## Project Structure

- `app/` — Next.js App Router pages and layout
- `app/Component/` — reusable UI components (Hero, TestimonialsSlider, Footer, etc.)
- `public/` — static assets (images, logos)
- `tailwind.config.js` — Tailwind configuration

## Notes & Tips

- If you see port conflicts when starting the dev server, stop the running process or change the port.
- On Windows, if `npm` scripts are blocked by policy, run `npm.cmd` instead.
- Images in the repo may reference external URLs; for offline work, replace them with local files in `public/`.

## Deployment

The app is deployable to Vercel (recommended) or any platform that supports Next.js. For Vercel, connect the repository and use the default build command `npm run build`.

## Contact

For questions about this repository, contact the project owner or your internal team.

---

_Generated: tidy README for local development and deployment._
