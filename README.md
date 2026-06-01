# Nepali Business Directory Australia 🇳🇵🇦🇺

A web application serving as a directory for Nepali businesses across Australia. Users can browse businesses by category and filter by Australian state/territory.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL

## Prerequisites

You need the following installed on your machine before getting started:

### 1. Node.js (v18 or higher)

Node.js is the JavaScript runtime for both the frontend and backend.

**macOS (using Homebrew):**
```bash
brew install node
```

**Windows (using installer):**
Download and install from https://nodejs.org/en/download (choose the LTS version).

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

### 2. PostgreSQL (v14 or higher)

PostgreSQL is the relational database used to store business and category data.

**macOS (using Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/. During installation, remember the password you set for the `postgres` user.

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Verify installation:
```bash
psql --version   # Should show psql (PostgreSQL) 14.x or higher
```

### 3. Git

Git is needed to clone the repository.

**macOS:**
```bash
# Usually pre-installed. If not:
brew install git
```

**Windows:**
Download from https://git-scm.com/download/win

**Ubuntu/Debian:**
```bash
sudo apt install git
```

### 4. (Optional) A code editor

We recommend [VS Code](https://code.visualstudio.com/) or any editor of your choice.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/kmrsimkhada/NepaliOriPari.git
cd NepaliOriPari
```

### 2. Create the database

```bash
# macOS / Linux
createdb nepali_business_directory

# Or via psql
psql -U postgres -c "CREATE DATABASE nepali_business_directory;"
```

**Windows (using pgAdmin or psql):**
```bash
psql -U postgres
CREATE DATABASE nepali_business_directory;
\q
```

### 3. Backend setup

```bash
cd backend

# Copy the example env file and update with your DB credentials
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nepali_business_directory
DB_USER=postgres
DB_PASSWORD=your_password_here
```

Then install dependencies and set up the database:
```bash
# Install dependencies
npm install

# Run database migrations (creates tables)
npm run db:migrate

# Seed sample data
npm run db:seed

# Start the backend development server (runs on port 5000)
npm run dev
```

### 4. Frontend setup

Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the frontend development server (runs on port 3000)
npm run dev
```

The frontend proxies API requests to the backend, so both servers need to be running simultaneously.

### 5. Open the app

Visit http://localhost:3000 in your browser.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` on backend start | Make sure PostgreSQL is running: `brew services start postgresql@16` (macOS) or `sudo systemctl start postgresql` (Linux) |
| Database does not exist error | Run `createdb nepali_business_directory` or create it via psql |
| Permission denied on database | Check your `.env` DB_USER and DB_PASSWORD match your PostgreSQL credentials |
| Port 5000 already in use | Change `PORT` in `backend/.env` or kill the process using that port |
| Frontend can't reach backend | Ensure the backend is running on port 5000 before starting the frontend |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:slug` | Get category by slug |
| GET | `/api/businesses` | List businesses (supports `state`, `category`, `search`, `page`, `limit` query params) |
| GET | `/api/businesses/:id` | Get single business |
| GET | `/api/businesses/state/:state/stats` | Get business count per category for a state |
| GET | `/api/health` | Health check |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/database.ts      # PostgreSQL connection pool
│   │   ├── database/migrate.ts     # Table creation script
│   │   ├── database/seed.ts        # Sample data seeder
│   │   ├── routes/businesses.ts    # Business API routes
│   │   ├── routes/categories.ts    # Category API routes
│   │   ├── routes/register.ts      # Business registration route
│   │   └── index.ts                # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/index.ts            # API client
│   │   ├── components/             # React components
│   │   ├── types/index.ts          # TypeScript interfaces
│   │   ├── App.tsx                 # Main app with routing
│   │   ├── main.tsx                # React entry point
│   │   └── styles.css              # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## Categories

35+ business categories including Real Estate, Mortgage & Finance, Restaurant, Beauty, Medical, Education, Migration Consultancy, Disability Support, Plumbing, Landscaping, Buying & Selling, Rental, and more.

## License

See [LICENSE](./LICENSE) file.
