import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getMyMatches } from '../services/matchService';
import { getMyTournaments } from '../services/registrationService';
import { getMyStats } from '../services/statsService';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch player's matches
      const matchesResponse = await getMyMatches();
      const allMatches = matchesResponse.data.matches || [];
      setMatches(allMatches);

      // Fetch registered tournaments
      const tournamentsResponse = await getMyTournaments();
      const registrations = tournamentsResponse.data.registrations || [];
      setTournaments(registrations);

      // Fetch player statistics
      try {
        const statsResponse = await getMyStats();
        setStats(statsResponse.data.stats);
      } catch (err) {
        console.error('Error fetching stats:', err);
        // Stats are optional, continue without them
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingMatches = () => {
    return matches
      .filter(m => m.status === 'scheduled' || m.status === 'ongoing')
      .sort((a, b) => new Date(a.schedule?.date) - new Date(b.schedule?.date))
      .slice(0, 3);
  };

  const getRecentResults = () => {
    return matches
      .filter(m => m.status === 'completed')
      .sort((a, b) => new Date(b.schedule?.date) - new Date(a.schedule?.date))
      .slice(0, 3);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOpponentName = (match) => {
    if (!match.players || match.players.length < 2) return 'TBD';
    const opponent = match.players.find(p => p._id !== user.id);
    return opponent ? opponent.name : 'TBD';
  };

  const didPlayerWin = (match) => {
    if (!match.winnerId) return null;
    return match.winnerId._id === user.id || match.winnerId === user.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  };

  const upcomingMatches = getUpcomingMatches();
  const recentResults = getRecentResults();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Player Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user?.name}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Total Matches
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {stats.totalMatches || 0}
                  </p>
                </div>
                <div className="text-4xl">🏸</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Wins
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {stats.wins || 0}
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Losses
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {stats.losses || 0}
                  </p>
                </div>
                <div className="text-4xl">❌</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Win Rate
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {stats.totalMatches > 0 
                      ? Math.round((stats.wins / stats.totalMatches) * 100) 
                      : 0}%
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/player/my-matches')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">🏸</span>
              <span>My Matches</span>
            </button>

            <button
              onClick={() => navigate('/player/register-tournament')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">📝</span>
              <span>Register</span>
            </button>

            <button
              onClick={() => navigate('/player/stats')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">📊</span>
              <span>View Stats</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">🏆</span>
              <span>Browse Tournaments</span>
            </button>
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Upcoming Matches
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {upcomingMatches.length === 0 ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                No upcoming matches. Register for a tournament to get started!
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingMatches.map((match) => (
                  <div
                    key={match._id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => navigate('/player/my-matches')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            vs {getOpponentName(match)}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            match.status === 'ongoing'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {match.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {match.tournamentId?.name} - {match.categoryId?.name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {formatDate(match.schedule?.date)} • Court {match.schedule?.court || 'TBD'}
                        </p>
                      </div>
                      <div className="text-2xl">
                        {match.status === 'ongoing' ? '🔴' : '📅'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Recent Results
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {recentResults.length === 0 ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                No completed matches yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentResults.map((match) => {
                  const won = didPlayerWin(match);
                  return (
                    <div
                      key={match._id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => navigate('/player/my-matches')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              vs {getOpponentName(match)}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              won
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {won ? 'Won' : 'Lost'}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {match.tournamentId?.name} - {match.categoryId?.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {formatDate(match.schedule?.date)}
                          </p>
                        </div>
                        <div className="text-2xl">
                          {won ? '🏆' : '😔'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Registered Tournaments */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Registered Tournaments
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {tournaments.length === 0 ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                You haven't registered for any tournaments yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tournaments.map((registration) => (
                  <div
                    key={registration._id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => {
                      if (registration.categoryId?.tournamentId?._id) {
                        navigate(`/tournament/${registration.categoryId.tournamentId._id}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {registration.categoryId?.tournamentId?.name || 'Tournament'}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          Category: {registration.categoryId?.name}
                        </p>
                        {registration.teamName && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Team: {registration.teamName}
                          </p>
                        )}
                      </div>
                      <div className="text-2xl">🏸</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
