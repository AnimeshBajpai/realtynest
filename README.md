# 🏠 RealtyNest

**Real Estate Lead Management Platform**

RealtyNest is a multi-tenant, real estate lead management platform designed for agencies and their brokers. It provides end-to-end lead lifecycle management — from capture to close.

## Features

- 🔐 **Multi-tenant Auth** — Agency Admin → Broker hierarchy with role-based access
- 📋 **Lead Pipeline** — Kanban board with stages: New → Contacted → Qualified → Site Visit → Negotiation → Closed
- 🏗️ **Property Listings** — Associate leads with properties, track interest
- 👥 **Team Management** — Create broker accounts, assign leads, track performance
- 📞 **Communication Log** — Track calls, meetings, emails, and notes
- 📊 **Dashboard & Analytics** — Conversion funnels, broker performance, lead source breakdown
- 🔔 **Notifications** — In-app and email alerts for follow-ups
- 🔍 **Advanced Search** — Filter leads by status, source, broker, property, and more

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Azure Flexible Server) |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| State | Zustand |
| Charts | Recharts |
| Hosting | Azure App Service |
| CI/CD | GitHub Actions |

## Project Structure

```
realtynest/
├── client/          # React frontend
├── server/          # Express API backend
├── .github/         # GitHub Actions workflows
└── infrastructure/  # Azure setup scripts
```

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL (local or Azure)
- npm >= 9

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Run database migrations
cd server && npx prisma migrate dev

# Start development servers
npm run server   # API on http://localhost:3001
npm run client   # Web on http://localhost:5173
```

## Deployment

The app auto-deploys to Azure via GitHub Actions on push to `main`.

- **Frontend**: https://realtynest-client.azurewebsites.net
- **Backend API**: https://realtynest-server.azurewebsites.net

## License

MIT
