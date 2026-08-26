# refund-api

A REST API for managing financial refund requests with receipt (proof-of-purchase) file attachments.

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript (~5.8), ESM modules |
| Runtime | Node.js |
| Framework | [AdonisJS v6](https://adonisjs.com) |
| ORM | [Lucid](https://lucid.adonisjs.com) v21 |
| Database | SQLite via `better-sqlite3` |
| Validation | [VineJS](https://vinejs.dev) v3 |
| File Storage | [AdonisJS Drive](https://docs.adonisjs.com/guides/drive) (local filesystem) |
| Testing | [Japa](https://japa.dev) v4 |
| Linting | ESLint 9 + Prettier |

## Prerequisites

- Node.js >= 18
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Create environment file and generate an APP_KEY
cp .env.example .env
node ace generate:key          # paste the output into APP_KEY in .env

# Run database migrations
node ace migration:run

# Start the development server (with HMR)
npm run dev
```

The server will be available at `http://localhost:3333`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development`, `production`, or `test` |
| `PORT` | Yes | HTTP server port (default: `3333`) |
| `HOST` | Yes | Host address (default: `localhost`) |
| `APP_KEY` | Yes | Secret key for encryption and signed URLs |
| `LOG_LEVEL` | Yes | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` \| `silent` |
| `DRIVE_DISK` | Yes | File storage driver (`fs`) |
| `TZ` | No | Timezone (default: `UTC`) |

## API Endpoints

### Refunds

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/refunds` | List refunds (paginated). Query params: `page` (number), `q` (search by title). |
| `POST` | `/refunds` | Create a new refund. |
| `GET` | `/refunds/:id` | Get a single refund by UUID. |
| `DELETE` | `/refunds/:id` | Soft-delete a refund (cascades to receipt). |

**POST `/refunds` body:**

```json
{
  "title": "Hotel in São Paulo",
  "category": "hosting",
  "value": 150.50,
  "receipt": "uuid-of-an-uploaded-receipt"
}
```

**Categories:** `food` · `hosting` · `transport` · `services` · `other`

### Receipts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/receipts` | Upload a receipt file (multipart). Max 2 MB. Accepted: `jpg`, `jpeg`, `png`, `pdf`. |
| `GET` | `/receipts/:id` | Get receipt metadata by UUID. |
| `DELETE` | `/receipts/:id` | Hard-delete a receipt and its file. |
| `GET` | `/receipts/download/:id` | Redirect to a signed download URL (1-minute expiry). |

## Architecture

- **Service layer** — Controllers are thin; all business logic lives in `app/services/`.
- **Dependency injection** — Controllers use `@inject()` with constructor injection via AdonisJS IoC container.
- **Soft delete** — Refunds use a `deleted_at` timestamp column. Deleting a refund cascades: the associated receipt file is removed from disk and its DB record is hard-deleted.
- **Value in cents** — Monetary values are stored as integers (cents) in the database and returned as floats via a Lucid `consume` callback.
- **Two-phase receipt lifecycle** — Files are uploaded to a temp directory first, then moved to `storage/uploads/` when linked to a refund via a slugified filename.
- **Signed URL download** — Receipt files are served through time-limited signed URLs (AdonisJS Drive) rather than streamed through the application.

## Project Structure

```
refund-api/
├── app/
│   ├── controllers/        # HTTP controllers
│   ├── exceptions/         # Global exception handler
│   ├── middleware/          # Request middleware
│   ├── models/             # Lucid models (Refund, Receipt)
│   ├── services/           # Business logic
│   ├── utils/              # File utilities
│   └── validators/         # VineJS validation schemas
├── bin/                    # Server, console, and test entrypoints
├── config/                 # App, database, drive, CORS, bodyparser config
├── database/migrations/    # SQLite migration files
├── start/                  # Routes, middleware kernel, env schema
├── storage/uploads/        # Finalized receipt files
└── tests/                  # Japa test suite (infrastructure ready)
```

## Testing

```bash
npm test
```

The Japa test runner is fully configured with the AdonisJS plugin, API client, and assertions. Test specs can be added under `tests/`.

## Linting & Formatting

```bash
npm run lint       # check with ESLint
npm run format     # auto-format with Prettier
```
