# StudyNook Server

Express REST API for **StudyNook** — rooms, bookings, and JWT-protected routes used by the Next.js client.

**Live frontend:** [https://studynook-client-seven.vercel.app/](https://studynook-client-seven.vercel.app/)

**Production API:** `https://studynook-server-2vsi.onrender.com`

## Features

- CRUD for study rooms (with search and filters)
- Booking creation, conflict checks, and cancellation rules
- JWT authentication (shared secret with the client)
- MongoDB via Mongoose; user profiles aligned with Better Auth

## Tech stack

- Node.js, Express 5
- MongoDB, Mongoose
- JWT (jsonwebtoken / jose on client)
- Zod validation (env + request helpers)

## Prerequisites

- Node.js 20+
- MongoDB database (same cluster as the client / Better Auth)

## Environment variables

Create `.env` in this folder:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name |
| `JWT_SECRET` | Must match client `JWT_SECRET` or `BETTER_AUTH_SECRET` |
| `JWT_EXPIRES_IN` | Optional token expiry (e.g. `7d`) |
| `CLIENT_URL` | Next.js origin for CORS + credentials (e.g. `http://localhost:3000`) |

## Getting started

```bash
npm install
npm run dev
```

API base: `http://localhost:5000/api`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm test` | Run Vitest unit tests |

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/rooms | - | List rooms |
| GET | /api/rooms/latest | - | Latest rooms |
| GET | /api/rooms/:id | - | Room by id |
| POST | /api/rooms | JWT | Create room |
| PUT | /api/rooms/:id | JWT | Update room |
| DELETE | /api/rooms/:id | JWT | Delete room |
| GET | /api/rooms/mine | JWT | Current user listings |
| GET | /api/bookings/mine | JWT | Current user bookings |
| POST | /api/bookings | JWT | Create booking |
| PATCH | /api/bookings/:id/cancel | JWT | Cancel booking |

## Deployment

Hosted on Render. Set `CLIENT_URL` to `https://studynook-client-seven.vercel.app`.

Booking create/cancel use MongoDB transactions when the deployment supports them (Atlas / replica set). On standalone local MongoDB, the API falls back to non-transactional writes.

## Related

- Frontend: studynook-client — https://studynook-client-seven.vercel.app/
