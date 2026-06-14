# frontend-react

React + TypeScript frontend for the payment reconciliation tool. Scaffolded with Vite.

## Run locally

```bash
cd frontend-react
npm install
npm run dev
```

The app is configured to use `VITE_API_BASE` for backend requests. If your backend runs on `http://localhost:5146`, set the environment variable before starting:

```bash
export VITE_API_BASE=http://localhost:5146
npm run dev
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — build production bundle
- `npm run preview` — preview production build

## Notes

- Uses Bootstrap and FontAwesome via CDN for matching Angular styling.
- `src/components/payment-matching/PaymentMatching.tsx` implements the same upload, summary, and filter UI as the Angular version.
- `src/components/reusable-table/ReusableTable.tsx` uses a `columns` + `actions` data model similar to the Angular reusable table component.
