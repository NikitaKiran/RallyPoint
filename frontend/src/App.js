import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import TournamentDetailsPage from './pages/TournamentDetailsPage';
import CreateTournamentPage from './pages/CreateTournamentPage';
import OrganiserDashboard from './pages/OrganiserDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import RegisterTournamentPage from './pages/RegisterTournamentPage';
import ManageTournamentPage from './pages/ManageTournamentPage';
import SchedulingPage from './pages/SchedulingPage';
import MatchControlPage from './pages/MatchControlPage';
import MyMatchesPage from './pages/MyMatchesPage';
import PlayerStatsPage from './pages/PlayerStatsPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Toast />
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
          
          {/* Protected routes - Organiser only */}
          <Route
            path="/organiser/create-tournament"
            element={
              <RoleRoute allowedRoles={['organiser']}>
                <CreateTournamentPage />
              </RoleRoute>
            }
          />
          <Route
            path="/organiser/dashboard"
            element={
              <RoleRoute allowedRoles={['organiser']}>
                <OrganiserDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/organiser/tournament/:tournamentId/manage"
            element={
              <RoleRoute allowedRoles={['organiser']}>
                <ManageTournamentPage />
              </RoleRoute>
            }
          />
          <Route
            path="/organiser/tournament/:tournamentId/schedule"
            element={
              <RoleRoute allowedRoles={['organiser']}>
                <SchedulingPage />
              </RoleRoute>
            }
          />
          <Route
            path="/organiser/tournament/:tournamentId/matches"
            element={
              <RoleRoute allowedRoles={['organiser']}>
                <MatchControlPage />
              </RoleRoute>
            }
          />
          
          {/* Protected routes - Player only */}
          <Route
            path="/player/dashboard"
            element={
              <RoleRoute allowedRoles={['player']}>
                <PlayerDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/player/my-matches"
            element={
              <RoleRoute allowedRoles={['player']}>
                <MyMatchesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/player/register-tournament"
            element={
              <RoleRoute allowedRoles={['player']}>
                <RegisterTournamentPage />
              </RoleRoute>
            }
          />
          
          {/* Protected routes - Any authenticated user */}
          <Route
            path="/stats/player/:playerId"
            element={
              <PrivateRoute>
                <PlayerStatsPage />
              </PrivateRoute>
            }
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
