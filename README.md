# Etudes (v0.88.0)

Etudes is a React + Vite practice journal app for tracking daily sessions, timing focused work, organizing repertoire, and reviewing progress over week/month views.

## Features

- Multi-view workflow: `Today`, `Week`, `Month`, `Repertoire`, `Programs`, `Routines`, `Logs`, `Notes`
- Practice tracking with item timers, spot-level timing, warmup/rest tracking
- Routine/program management and quick "working on" pinning
- Data import/export support (`.json`) and log export (`.md` / `.txt`)
- Utility tools such as metronome, drone, quick notes, and PDF attachments per item

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS
- ESLint
- lucide-react

## Development

```bash
npm install
npm run dev
```

Default local URL is usually `http://localhost:5173`.

## Build and Preview

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Git Upload Notes

If your Git repo root is above this folder (for example at `/Users/alainchiu`), you can commit only this project with:

```bash
git -C "/Users/alainchiu" add "Projects/etudes V087"
git -C "/Users/alainchiu" commit -m "Add Etudes project documentation"
git -C "/Users/alainchiu" push
```

If you later keep this as a standalone repo, use the normal flow:

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Project Structure

- `src/`: app source code (views, state, shared components)
- `public/`: static assets
- `dist/`: production build output (ignored by `.gitignore`)

## License

No license file is included yet. Add a `LICENSE` file if you plan to publish this project publicly.
