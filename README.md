# Waste Management API & Dashboard

A comprehensive waste management solution built for the Hackathon Sampah. This project features a modern, interactive dashboard to monitor waste generation, manage fleet operations, and predict future waste volumes using AI integration.

## 🌟 Features

- **Autopilot Operations Dashboard:** Automated predictions based on AI-generated results, enabling proactive decision-making.
- **Interactive Maps:** Geospatial visualization of waste areas using React-Leaflet, enriched with Open-Meteo weather forecasts and glowing marker animations.
- **AI-Powered Predictions:** Integration with external AI APIs to forecast waste volumes, confidence scores, and risk status.
- **News Integration:** Fetches and displays the latest news regarding waste management operations.
- **Fleet & TPA Management:** Tracks garbage truck inventory and landfill (TPA) capacities.

## 💻 Tech Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** MySQL / TiDB
- **ORM:** Prisma Client with `@prisma/adapter-mariadb`
- **Maps:** Leaflet & React-Leaflet
- **Charts:** Recharts
- **Icons:** Lucide React

## 🗄️ Database Schema

The application is powered by Prisma and includes the following core models:
- **`MasterArea`**: Locations for waste tracking.
- **`PredictionLog`**: AI-generated waste volume predictions and risk status.
- **`TpaFacility`**: TPA (landfill) maximum capacity and current load monitoring.
- **`CrowdPermit`**: Event permits that might affect daily waste generation.
- **`FleetInventory`**: Garbage truck availability and capacity.
- **`OperationalParam`**: Dynamic system configuration parameters.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm / yarn / pnpm / bun
- A MySQL or TiDB Database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd waste-management-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   **Required Variables:**
   - `DATABASE_URL`: Full connection string for Prisma.
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Database credentials for runtime adapter.
   - `API_URL`, `API_KEY`: External AI service endpoint and authentication.

4. **Database Setup:**
   Generate the Prisma client and push the schema to your database.
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   *(Note: Prisma client is generated in `app/generated/prisma`)*

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📁 Project Structure

- `/app/api` - Next.js API Routes for backend logic.
- `/app/operations` - Autopilot Operations Dashboard.
- `/app/analysis` - AI Prediction and Data Analysis Dashboard.
- `/app/components` - Reusable UI React components.
- `/app/hooks` - Custom React hooks for business logic separation.
- `/prisma` - Database schema and connection configurations.
- `/services` - External API integration and business logic services.

