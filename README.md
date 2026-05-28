# Payment Reconciliation Tool

A small tool to help reconcile and resolve payment records between a system export and provider files. This repository contains a .NET Web API backend and an Angular frontend UI.

Quick links

- Backend: `backend/PaymentsMatching.Api`
- Frontend: `frontend`

Prerequisites

- .NET 10 SDK (for the API)
- Node.js (recommend Node 18+) and npm (this project uses npm v10+)

Quick start (development)

1. Start the backend API

```powershell
cd backend/PaymentsMatching.Api
dotnet restore
dotnet run
```

2. Start the frontend

```bash
cd frontend
npm install
npm start
```

Project layout

- `backend/PaymentsMatching.Api` - .NET minimal API project that exposes matching endpoints.
- `frontend` - Angular application (with SSR support).

See `backend/README.md` and `frontend/README.md` for more details about each component.

License & Contributing

If you plan to contribute, please open an issue or pull request with a clear description of your change.
