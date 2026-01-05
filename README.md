# Property Owner & Management System

A production-grade, monolith-but-modular property management system built with Next.js (App Router), MongoDB, and Docker.

## Tech Stack

- **Frontend + Backend**: Next.js 16 (App Router)
- **Language**: JavaScript
- **Database**: MongoDB 7 (runs in Docker)
- **ODM**: Mongoose
- **Validation**: Zod
- **Auth**: Custom JWT (access + refresh tokens)
- **Styling**: TailwindCSS
- **Container**: Docker & Docker Compose

## Architecture

This system follows a modular monolith architecture:

- Each domain is an internal "module" in `/src/modules/*`
- No cross-module model imports
- Modules interact only via service interfaces
- API routes only authenticate, authorize, validate, and delegate to services
- Ledger entries are **IMMUTABLE** (append-only)
- Owner statements are **SNAPSHOTS** (never recalculated)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- npm or yarn

### 1. Clone and Setup Environment

```bash
# Copy environment template
cp env.example .env

# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Update .env with the generated secrets
```

### 2. Run with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f nextjs

# The app will be available at http://localhost:3000
```

### 3. Run Locally (Development)

```bash
# Start MongoDB only
docker-compose up -d mongodb

# Install dependencies
npm install

# Update .env to use localhost MongoDB
# MONGODB_URI=mongodb://localhost:27017/property_management

# Run development server
npm run dev
```

### 4. Seed Database

```bash
# With Docker
docker-compose exec nextjs node scripts/seed.js

# Or locally
node scripts/seed.js
```

## Default Login Credentials

After seeding, use these accounts (password: `Password123!`):

| Role | Email |
|------|-------|
| Super Admin | admin@propertymanagement.com |
| Property Manager | manager@propertymanagement.com |
| Leasing Agent | agent@propertymanagement.com |
| Accountant | accountant@propertymanagement.com |
| Maintenance Staff | maintenance@propertymanagement.com |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── health/        # Health check
│   │   └── ...
│   ├── admin/             # Admin dashboard
│   ├── owner/             # Owner dashboard
│   └── tenant/            # Tenant dashboard
├── modules/               # Business logic modules
│   ├── auth/              # Authentication & RBAC
│   ├── owners/            # Owner management
│   ├── properties/        # Properties & Units
│   ├── tenants/           # Tenant applications & profiles
│   ├── leases/            # Lease management
│   ├── billing/           # Invoices & billing
│   ├── ledger/            # IMMUTABLE financial ledger
│   ├── payouts/           # Owner payouts & statements
│   ├── maintenance/       # Maintenance requests
│   ├── communications/    # Tickets & announcements
│   └── documents/         # Document storage
├── lib/                   # Shared utilities
│   ├── config/            # Environment configuration
│   ├── db/                # Database connection
│   ├── crypto/            # Encryption utilities
│   ├── rbac/              # Role-based access control
│   └── audit/             # Audit logging
└── components/            # React components
```

## User Roles & Permissions

| Role | Description |
|------|-------------|
| Super Admin | Full system access |
| Admin | All features except user deletion |
| Property Manager | Property, tenant, lease management |
| Leasing Agent | Applications and lease creation |
| Maintenance Staff | Maintenance requests |
| Accountant | Financial operations |
| Owner | Read-only access to own properties |
| Tenant | Self-service access to own lease |

## API Endpoints

### Authentication

```
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login
POST /api/auth/logout      # Logout
POST /api/auth/refresh     # Refresh access token
GET  /api/auth/me          # Get current user
PATCH /api/auth/me         # Update profile
POST /api/auth/change-password
```

### Health Check

```
GET /api/health            # System health status
```

## Key Features

### Security

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Access (15m) + Refresh (7d) with rotation
- **Data Encryption**: AES-256-GCM for SSN and bank info
- **RBAC**: Role-based access control on all routes
- **Rate Limiting**: Auth endpoints protected
- **Audit Logging**: All sensitive operations logged

### Financial

- **Immutable Ledger**: Append-only, no updates or deletes
- **Statement Snapshots**: Calculated once, never recalculated
- **Ownership Splits**: Support for multi-owner properties
- **Management Fees**: Configurable per owner/property

### Business Flow

1. Owner onboarding → contract signing → property assignment
2. Tenant application → screening → approval → lease creation
3. Tenant pays rent → trust ledger entry
4. Security deposit → deposit trust ledger
5. Management fees + expenses deducted
6. Monthly payout run → owner statement snapshot
7. Owner views payouts & statements

## Environment Variables

See `env.example` for all available configuration options.

### Required Variables

| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | JWT signing secret (min 32 chars) |
| REFRESH_TOKEN_SECRET | Refresh token secret (min 32 chars) |
| ENCRYPTION_KEY | AES-256 key (64 hex chars) |

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# View logs
docker-compose logs -f

# Access MongoDB shell
docker-compose exec mongodb mongosh

# Run seed script
docker-compose exec nextjs node scripts/seed.js
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## License

Private - All rights reserved.
