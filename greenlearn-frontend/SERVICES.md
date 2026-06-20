# Separate App Services

The project now runs as two separate frontend services that use the same Django API.

## Ports

- Backend API: `http://localhost:8000/api`
- Parent app, Find My Kids: `http://127.0.0.1:5173`
- Child app, Pingo: `http://127.0.0.1:5174`

## Development

Run each app in its own terminal:

```bash
npm run dev:parent
npm run dev:child
```

## Production Builds

```bash
npm run build:parent
npm run build:child
```

Build outputs:

- `dist-parent` for Find My Kids
- `dist-child` for Pingo

## App Roles

- `Find My Kids` accepts only `parent` accounts.
- `Pingo` accepts only `child` accounts.
- Parent creates a child invite code in `Find My Kids`.
- Child enters that code in `Pingo`.
