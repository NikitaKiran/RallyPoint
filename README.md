# RallyPoint - Tournament Management System

A full-stack web application for organizing and tracking badminton tournaments with hybrid formats.

## Project Structure

```
rallypoint/
├── backend/           # Express.js API server
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Express middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── utils/        # Utility functions
│   └── server.js     # Entry point
├── frontend/         # React application
│   ├── public/       # Static files
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context
│       ├── hooks/       # Custom hooks
│       ├── pages/       # Page components
│       ├── services/    # API services
│       └── utils/       # Utility functions
└── package.json      # Root package file
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies for both backend and frontend:

```bash
npm run install-all
```

Or install separately:

```bash
npm run install-backend
npm run install-frontend
```

## Configuration

### Backend

1. Copy `.env.example` to `.env` in the backend directory:

```bash
cd backend
cp .env.example .env
```

2. Update the environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `EMAIL_*`: Email service configuration for notifications

### Frontend

1. Copy `.env.example` to `.env` in the frontend directory:

```bash
cd frontend
cp .env.example .env
```

2. Update `REACT_APP_API_URL` if your backend runs on a different port

## Running the Application

### Development Mode

Run backend (from root directory):
```bash
npm run backend
```

Run frontend (from root directory):
```bash
npm run frontend
```

Or run them separately:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

### Production Mode

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

## API Endpoints

The backend API runs on `http://localhost:5000` by default.

## Features

- User authentication (Organiser/Player roles)
- Tournament creation and management
- Player registration with tournament codes
- Match scheduling (automatic and manual)
- Live scoring and results
- Email notifications
- Statistics and leaderboards
- Data export (CSV/PDF)
- Dark/Light theme support

## Tech Stack

### Backend
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for emails
- PapaParse for CSV processing

### Frontend
- React
- React Router
- Axios
- TailwindCSS
- Recharts for visualizations
