# Map App - Full Stack Application

A modern full-stack application built with React, TypeScript, Vite on the frontend and Node.js with PostgreSQL on the backend.

## Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Google Maps API** - Interactive map with markers and polygons
- **@react-google-maps/api** - React wrapper for Google Maps

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM and database toolkit
- **pg** - PostgreSQL client

## Project Structure

```
map_app/
├── frontend/                      # React frontend application
│   ├── src/
│   │   ├── App.tsx               # Main App component
│   │   ├── main.tsx              # Entry point
│   │   ├── components/
│   │   │   ├── MapView.tsx       # Google Maps integration
│   │   │   └── IndexCard.tsx     # Example component
│   │   ├── config/
│   │   │   └── mapStyles.ts      # Map marker/polygon styles
│   │   ├── pages/
│   │   │   └── MapPage.tsx       # Map view page
│   │   └── types/
│   │       └── map.ts            # TypeScript types for maps
│   ├── index.html
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json
│
├── backend/                       # Node.js backend API
│   ├── src/
│   │   ├── index.ts              # Server entry point (Express routes)
│   │   └── db/
│   │       ├── prisma.ts         # Prisma Client instance
│   │       ├── connection.ts     # PostgreSQL connection (legacy)
│   │       └── migrate.ts        # Legacy migrations (deprecated)
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma schema definition
│   │   └── migrations/           # Database migrations
│   ├── prisma.config.ts          # Prisma configuration
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json
│
├── package.json                   # Root workspace configuration
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** - Comes with Node.js

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Set Up PostgreSQL Database

First, make sure PostgreSQL is running on your system.

**On Windows:**
- PostgreSQL should start automatically after installation
- Or use: `net start postgresql-x64-14` (adjust version as needed)

**Create the database:**

```bash
# Connect to PostgreSQL (use psql or pgAdmin)
psql -U postgres

# In psql, create the database:
CREATE DATABASE map_app;

# Exit psql
\q
```

### 3. Configure Environment Variables

**Backend Configuration:**

Create a `.env` file in the `backend` folder (copy from `.env.example`):

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your database credentials:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mapdata
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Prisma Database URL (required for migrations)
DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/mapdata"
```

**Frontend Configuration:**

Create a `.env` file in the `frontend` folder for Google Maps API key:

```bash
cd frontend
# Create .env file
```

Add your Google Maps API key:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> **Note**: Get your API key from the [Google Cloud Console](https://console.cloud.google.com/). Make sure to enable the Maps JavaScript API.

### 4. Run Database Migrations

Set up the database schema using Prisma:

```bash
cd backend
npx prisma migrate deploy
```

This will apply all pending migrations and create the necessary tables in your database.

Alternatively, you can use `npx prisma db push` for quick prototyping (skips migration history).

### 5. Start the Development Servers

You'll need two terminal windows:

**Terminal 1 - Backend Server:**

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

**Terminal 2 - Frontend Development Server:**

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### 6. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health

You should see a beautiful landing page with a status card showing the backend connection status!

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled JavaScript (production)
- `npm run db:migrate` - Run legacy database migrations (deprecated)

### Prisma Commands

- `npx prisma migrate dev --name <name>` - Create and apply a migration
- `npx prisma migrate deploy` - Apply pending migrations (production)
- `npx prisma generate` - Regenerate Prisma Client
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Push schema changes without migrations
- `npx prisma migrate status` - Check migration status

## Database Migrations with Prisma

Prisma provides a powerful migration system to manage your database schema changes over time. All migrations are stored in `backend/prisma/migrations/` as SQL files with timestamps.

### Understanding Prisma Migrations

- **Migration files** track changes to your database schema
- Each migration is a timestamped SQL file (e.g., `20251218134442_remove_items_table/migration.sql`)
- Prisma tracks applied migrations in a `_prisma_migrations` table
- Migrations can be applied, rolled back, and version controlled with Git

### Creating a New Migration

When you make changes to your Prisma schema (`backend/prisma/schema.prisma`):

**1. Edit the schema file:**

```prisma
// Example: Add a new field to a model
```

**2. Generate the migration (Development):**

```bash
cd backend
npx prisma migrate dev --name add_marker_color
```

This command will:
- Generate a new migration SQL file
- Apply the migration to your database
- Regenerate the Prisma Client with updated types

**3. For Production:**

```bash
cd backend
npx prisma migrate deploy
```

This applies all pending migrations without prompting (safe for CI/CD).

### Common Migration Commands

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev --name <name>` | Create and apply a new migration (dev) |
| `npx prisma migrate deploy` | Apply all pending migrations (production) |
| `npx prisma migrate status` | Check migration status |
| `npx prisma migrate resolve --applied <name>` | Mark a migration as applied |
| `npx prisma migrate reset` | Reset database and reapply all migrations |
| `npx prisma db push` | Push schema changes without migrations (prototyping) |
| `npx prisma generate` | Regenerate Prisma Client after schema changes |


### Migration Best Practices

1. **Always name migrations descriptively**: Use clear names like `add_user_email` or `remove_items_table`
2. **Review generated SQL**: Check `prisma/migrations/<timestamp>_<name>/migration.sql` before committing
3. **Commit migrations to Git**: Migration files should be version controlled
4. **Test migrations**: Run migrations on a staging environment before production
5. **Avoid manual edits**: Don't modify the database directly; always use migrations
6. **Use `migrate deploy` in production**: Never use `migrate dev` in production environments

### Troubleshooting Migrations

**Error: Migration failed to apply**
```bash
# View migration status
npx prisma migrate status

# If needed, reset the database (⚠️ deletes all data)
npx prisma migrate reset
```

**Database schema drift detected**
```bash
# Generate migration from current drift
npx prisma migrate diff \
  --from-schema prisma/schema.prisma \
  --to-config-datasource \
  --script > fix.sql

# Review fix.sql and apply manually if safe
```

**Need to roll back a migration?**

Prisma doesn't have built-in rollback, but you can:
1. Create a new migration that reverses the changes
2. Or manually execute SQL to undo changes
3. Or reset and reapply all migrations (`prisma migrate reset`)

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **TypeScript**: The project uses TypeScript for both frontend and backend
3. **Proxy**: Vite is configured to proxy `/api` requests to the backend
4. **CORS**: The backend is configured to accept requests from the frontend

## Troubleshooting

### Database Connection Issues

If you see "Failed to connect to backend":
1. Verify PostgreSQL is running
2. Check database credentials in `backend/.env`
3. Ensure the database exists: `CREATE DATABASE map_app;`
4. Check the backend logs for error messages

### Port Already in Use

If port 3000 or 5000 is already in use:
- Change `PORT` in `backend/.env`
- Change `port` in `frontend/vite.config.ts`

### TypeScript Errors

If you encounter TypeScript errors:
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

## Production Build

### Frontend

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist`

### Backend

```bash
cd backend
npm run build
```

The compiled JavaScript will be in `backend/dist`

To run the production backend:

```bash
cd backend
npm start
```

## License

MIT

## Contributing

Feel free to submit issues and pull requests!

