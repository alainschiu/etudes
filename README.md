# Études (v0.90.1)

Etudes is a React + Vite practice journal app for tracking daily sessions, timing focused work, organizing repertoire, and reviewing progress over week/month views.

## Features

- Multi-view workflow: `Today`, `Week`, `Month`, `Repertoire`, `Programs`, `Routines`, `Logs`, `Notes`
- Practice tracking with item timers, spot-level timing, warmup/rest tracking
- Routine/program management and quick "working on" pinning
- Data import/export support (`.json`) and log export (`.md` / `.txt`)
- Utility tools such as metronome, drone, quick notes, and PDF attachments per item
- Optional cloud sync via Supabase — sign in once, data follows you across devices

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS
- ESLint
- lucide-react
- Études Design System (colors, typography, spacing tokens)
- Supabase (optional — auth + PostgreSQL state sync)

## Development

```bash
npm install
npm run dev
```

Default local URL is usually `http://localhost:5173`.

### Sync setup (optional)

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run `supabase/migrations/001_user_state.sql` in the Supabase SQL editor, then enable Email auth in the Supabase dashboard under Authentication → Providers.

## Build and Preview

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Project Structure

- `src/`: app source code (views, state, shared components)
- `src/lib/`: storage, sync, auth utilities
- `supabase/migrations/`: SQL migration files
- `public/`: static assets
- `dist/`: production build output (ignored by `.gitignore`)

## License

No license file is included yet. Add a `LICENSE` file if you plan to publish this project publicly.
