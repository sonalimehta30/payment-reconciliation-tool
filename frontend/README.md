# Frontend - Payment Reconcile UI

Angular 21 application used as the user interface for the Payment Reconciliation Tool.

Prerequisites

- Node.js (recommend Node 18+) and npm (this repo uses npm v10+)
- Angular CLI (optional for local development)

Development server

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200/ in your browser. The app will reload on source changes.

Build

```bash
npm run build
```

Server-side rendering (SSR)

This project includes SSR support. To run a built SSR server:

```bash
npm run build
npm run serve:ssr:payment-reconcile-ui
```

Tests

```bash
npm test
```

Notes

- See `package.json` for available scripts. The SSR entrypoint is `dist/payment-reconcile-ui/server/server.mjs` after a proper server build.
