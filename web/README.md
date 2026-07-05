# Spotify Review Discovery Engine

Production-ready AI Product Intelligence dashboard for analyzing Spotify user feedback at scale.

This app is **not** for recommending music. It turns raw reviews/discussions into a **PM-ready report**.

## What it does

- Upload a JSON file containing reviews/discussions (fields can be incomplete).
- Click **Analyze Reviews** to run an AI workflow (OpenAI API).
- View a dashboard with sentiment, themes, opportunities, and a summary.
- Export the report as JSON or Markdown.
- **Refresh latest** (local mode): runs the existing Python scrapers and appends latest entries.

## Run locally

From `web/`:

```bash
npm install
cp .env.example .env.local
# set OPENAI_API_KEY in .env.local
npm run dev
```

Open `http://localhost:3000`.

## Input JSON formats supported

The uploader accepts:

- Your existing scraper output: `{ entries: [...] }`
- A raw array: `[{ ...review }, ...]`
- Alternative shapes like `{ reviews: [...] }`

The parser normalizes fields (`title`, `body`, `rating`, `date`, `url`, `source`) and tolerates missing fields.

## Refresh latest (local mode)

The **Refresh latest** button calls `POST /api/refresh`.

It runs:

- `python -m scraper.scrape_all` in the parent folder (outside `web/`)
- reads `../data/reviews_discussions.json`
- merges & dedupes with the uploaded dataset

### Vercel limitation

On Vercel, `POST /api/refresh` returns `501` because it requires running Python and writing to disk.

## Deployment (Vercel)

- Deploy with **Root Directory** = `web`
- Set `OPENAI_API_KEY` in Vercel environment variables
- Optional: `OPENAI_MODEL`

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
