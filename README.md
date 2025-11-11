# RallyPoint - Tournament Management System

<div align="center">

**A comprehensive badminton tournament management system**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%3E%3D5.0-green)](https://www.mongodb.com/)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [User Guide](#user-guide)

## Overview

RallyPoint is a full-stack web application designed to streamline the organization and management of badminton tournaments. It supports hybrid tournament formats (knockout, round robin, and custom stages), provides real-time scoring, and offers comprehensive player statistics tracking.

### Key Capabilities

- **Role-Based Access**: Separate interfaces for tournament organisers and players
- **Flexible Tournament Formats**: Support for knockout, round robin, and hybrid stages
- **Smart Scheduling**: Automatic match scheduling with court allocation
- **Live Scoring**: Real-time score updates during matches
- **Player Management**: Bulk CSV import and individual registration
- **Public Access**: Tournament information accessible without authentication
- **Data Export**: Export tournament data in CSV and PDF formats
- **Responsive Design**: Mobile-friendly interface

## Features

### For Organisers

- Create and manage multiple tournaments
- Configure categories with eligibility criteria
- Define hybrid stage formats (knockout + round robin)
- Bulk import players via CSV
- Automatic match scheduling with court allocation
- Live score entry and result management
- Handle reschedule and walkover requests
- Send email notifications to players
- View comprehensive statistics and leaderboards
- Export tournament data (CSV/PDF)
- Backup and restore database

### For Players

- Register for tournaments using unique codes
- View personal match schedule
- Track match results and statistics
- Request match reschedules
- Declare walkovers when necessary
- View tournament brackets and standings

### For Public Viewers

- Browse all tournaments
- View tournament details and categories
- Follow live scores and results
- Access tournament brackets and standings

## Tech Stack

### Backend

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **File Processing**: PapaParse (CSV), PDFKit (PDF)
- **Security**: bcrypt for password hashing

### Frontend

- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: TailwindCSS
- **Charts**: Recharts

## Project Structure

```
rallypoint/
├── backend/                    # Express.js API server
│   ├── config/                # Database and app configuration
│   │   └── database.js        # MongoDB connection setup
│   ├── controllers/           # Route controllers (business logic)
│   │   ├── authController.js
│   │   ├── tournamentController.js
│   │   ├── matchController.js
│   │   └── ...
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── roleCheck.js      # Role-based authorization
│   │   ├── errorHandler.js   # Centralized error handling
│   │   └── validation.js     # Request validation
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Tournament.js
│   │   ├── Match.js
│   │   └── ...
│   ├── routes/               # API route definitions
│   │   ├── authRoutes.js
│   │   ├── tournamentRoutes.js
│   │   └── ...
│   ├── services/             # Business logic services
│   │   ├── bracketService.js
│   │   ├── emailService.js
│   │   ├── csvService.js
│   │   └── ...
│   ├── utils/                # Utility functions
│   │   ├── jwt.js
│   │   ├── errors.js
│   │   └── asyncHandler.js
│   ├── .env.example          # Environment variables template
│   ├── package.json
│   └── server.js             # Application entry point
│
├── frontend/                  # React application
│   ├── public/               # Static files
│   │   └── index.html
│   └── src/
│       ├── components/       # Reusable React components
│       │   ├── Navbar.js
│       │   ├── TournamentCard.js
│       │   ├── MatchCard.js
│       │   └── ...
│       ├── context/          # React Context providers
│       │   ├── AuthContext.js
│       │   ├── ThemeContext.js
│       │   └── ToastContext.js
│       ├── hooks/            # Custom React hooks
│       │   └── useErrorHandler.js
│       ├── pages/            # Page components
│       │   ├── HomePage.js
│       │   ├── LoginPage.js
│       │   ├── OrganiserDashboard.js
│       │   └── ...
│       ├── services/         # API service layer
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── tournamentService.js
│       │   └── ...
│       ├── utils/            # Utility functions
│       │   ├── errorHandler.js
│       │   └── validators.js
│       ├── App.js            # Main app component
│       ├── index.js          # React entry point
│       └── index.css         # Global styles
│
├── .gitignore
├── package.json              # Root package file
└── README.md                 # This file
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.0.0 or higher ([Download](https://nodejs.org/))
- **MongoDB**: v5.0 or higher ([Download](https://www.mongodb.com/try/download/community))
- **npm**: v7.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 500MB free space

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rallypoint.git
cd rallypoint
```

### 2. Install Dependencies

#### Option A: Install All at Once (Recommended)

```bash
npm run install-all
```

#### Option B: Install Separately

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 3. Verify Installation

Check that all dependencies are installed correctly:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MongoDB is running
mongosh --eval "db.version()"
```

## Configuration

### Backend Configuration

1. **Create Environment File**

```bash
cd backend
cp .env.example .env
```

2. **Configure Environment Variables**

Edit `backend/.env` with your settings:

```env
# Server Configuration
PORT=5000                                    # Backend server port
NODE_ENV=development                         # Environment (development/production)

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rallypoint  # MongoDB connection string

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here    # Generate a secure random string
JWT_EXPIRE=7d                                # Token expiration time

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com                    # SMTP server
EMAIL_PORT=587                               # SMTP port
EMAIL_USER=your_email@gmail.com              # Email account
EMAIL_PASSWORD=your_app_password             # App-specific password
EMAIL_FROM=noreply@rallypoint.com            # From address

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000           # Frontend URL
```

**Important Notes:**

- **JWT_SECRET**: Generate a secure random string (at least 32 characters). You can use:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- **Email Configuration**: 
  - For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833)
  - Email features are optional; the app works without them

- **MongoDB URI**: 
  - Local: `mongodb://localhost:27017/rallypoint`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/rallypoint`

### Frontend Configuration

1. **Create Environment File**

```bash
cd frontend
cp .env.example .env
```

2. **Configure Environment Variables**

Edit `frontend/.env`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api  # Backend API URL
```

**Note**: If you change the backend port, update this URL accordingly.

### Database Setup

1. **Start MongoDB**

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
# MongoDB runs as a service by default after installation
```

2. **Verify MongoDB Connection**

```bash
mongosh
# Should connect successfully
```

3. **Create Database** (Optional - created automatically)

```bash
use rallypoint
```

## Running the Application


### Option 1: Run from Root Directory

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - Frontend:**
```bash
npm run frontend
```

### Option 2: Run Separately

**Backend:**
```bash
cd backend
npm run dev
# Server will run on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm start
# App will open at http://localhost:3000
```

## User Guide

### For Organisers

#### 1. Creating a Tournament

1. **Register/Login** as an organiser
2. Navigate to **Create Tournament** from the dashboard
3. Fill in tournament details:
   - Name
   - Description
   - Start and end dates
   - Number of courts available
4. Click **Create Tournament**
5. Note the unique **tournament code** generated

#### 2. Adding Categories

1. After creating a tournament, add categories:
   - Category name (e.g., "Men's Singles")
   - Team event (yes/no)
   - Eligibility criteria
   - Registration limit
   - Cash prize (optional)
2. Define stages for each category:
   - **Knockout**: Single elimination
   - **Round Robin**: All play all
   - **Custom**: Define your own format
3. Save the category

#### 3. Managing Players

**Option A: CSV Import**
1. Prepare a CSV file with columns: `name,email,role`
2. Navigate to **Player Management**
3. Click **Upload CSV**
4. Select your file and upload
5. Review the import summary

**Option B: Manual Registration**
- Share the tournament code with players
- Players register themselves using the code

#### 4. Scheduling Matches

1. Navigate to **Scheduling** for your tournament
2. Select a category and stage
3. Click **Auto Schedule** or create matches manually
4. For auto-scheduling:
   - Confirm court count
   - Set date range
   - System generates optimal schedule

#### 5. Managing Live Scores

1. Navigate to **Match Control**
2. Select an ongoing match
3. Update scores set by set
4. System automatically determines winner
5. Winner advances in knockout stages

#### 6. Handling Requests

1. View pending requests in tournament management
2. Review reschedule or walkover requests
3. Accept or reject with optional notes
4. Players receive email notifications (if configured)

### For Players

#### 1. Registering for a Tournament

1. **Register/Login** as a player
2. Navigate to **Register for Tournament**
3. Enter the tournament code provided by organiser
4. View tournament details and available categories
5. Select your category
6. For team events, enter team name and members
7. Submit registration

#### 2. Viewing Your Matches

1. Navigate to **My Matches**
2. View upcoming matches with:
   - Opponent name
   - Court number
   - Date and time
   - Match format
3. View completed matches with results

#### 3. Requesting Changes

**Reschedule Request:**
1. Find your match in **My Matches**
2. Click **Request Reschedule**
3. Add a note explaining the reason
4. Submit request
5. Wait for organiser approval

**Walkover Declaration:**
1. Find your match
2. Click **Declare Walkover**
3. Confirm the action
4. Organiser will review and approve

#### 4. Viewing Statistics

1. Navigate to **Player Statistics**
2. View your performance metrics:
   - Total matches played
   - Win/loss record
   - Sets won/lost
   - Match history
3. Filter by tournament or category

### For Public Viewers

1. Visit the homepage (no login required)
2. Browse all available tournaments
3. Click on a tournament to view:
   - Tournament details
   - Categories and stages
   - Match schedules
   - Live scores
   - Brackets and standings
4. Use search and filters to find specific tournaments

