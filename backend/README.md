# Backend - PaymentsMatching.Api

This folder contains the `PaymentsMatching.Api` minimal Web API that performs CSV parsing and matching logic.

Prerequisites

- .NET 10 SDK

Running locally

```powershell
cd backend/PaymentsMatching.Api
dotnet restore
dotnet run
```

By default the API exposes the following endpoints (base path: `/api/match`):

- `POST /api/match` - multipart/form-data upload with `systemFile` and `providerFile` CSVs; returns match results.
- `GET /api/match` - returns existing matches; optional `filter` query string supported.
- `POST /api/match/resolve` - resolve a match by sending a JSON body with `recordId` and `resolutionSide`.

Notes

- The project uses `CsvHelper` for CSV parsing and EF Core (InMemory/Sqlite) for lightweight storage during development.
- See `PaymentsMatching.Api.csproj` for package references and target framework.
