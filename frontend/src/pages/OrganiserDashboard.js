import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BackupRestore from '../components/BackupRestore';
import { getAllTournaments } from '../services/tournamentService';
import { getTournamentRequests } from '../services/requestService';

const OrganiserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    totalRequests: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all tournaments
      const tournamentsResponse = await getAllTournaments();
      const allTournaments = tournamentsResponse.data.tournaments || [];

      // Filter tournaments created by this organiser
      const myTournaments = allTournaments.filter(
        t => t.organiserId && t.organiserId._id === user.id
      );

      setTournaments(myTournaments);

      // Calculate statistics
      const upcoming = myTournaments.filter(t => t.status === 'upcoming').length;
      const ongoing = myTournaments.filter(t => t.status === 'ongoing').length;
      const completed = myTournaments.filter(t => t.status === 'completed').length;

      // Fetch pending requests count
      let totalRequests = 0;
      for (const tournament of myTournaments) {
        try {
          const requestsResponse = await getTournamentRequests(tournament._id);
          const pendingRequests = requestsResponse.data.requests.filter(
            r => r.status === 'pending'
          );
          totalRequests += pendingRequests.length;
        } catch (err) {
          // Continue if requests fetch fails for a tournament
          console.error(`Failed to fetch requests for tournament ${tournament._id}:`, err);
        }
      }

      setStats({
        upcoming,
        ongoing,
        completed,
        totalRequests
      });

      // Generate recent activity feed
      const activity = [];
      
      // Add recent tournaments
      const sortedTournaments = [...myTournaments]
        .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
        .slice(0, 3);

      sortedTournaments.forEach(tournament => {
        activity.push({
          type: 'tournament',
          message: `Tournament "${tournament.name}" created`,
          date: tournament.createdAt || tournament.startDate,
          tournamentId: tournament._id
        });
      });

      // Sort activity by date
      activity.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivity(activity.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Organiser Dashboard
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Upcoming
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {stats.upcoming}
                </p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Ongoing
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats.ongoing}
                </p>
              </div>
              <div className="text-4xl">🏸</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Completed
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {stats.completed}
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Pending Requests
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {stats.totalRequests}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/organiser/create-tournament')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">➕</span>
              <span>Create Tournament</span>
            </button>

            <button
              onClick={() => {
                if (tournaments.length > 0) {
                  navigate(`/organiser/tournament/${tournaments[0]._id}/manage`);
                } else {
                  alert('No tournaments available. Create one first!');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">⚙️</span>
              <span>Manage Tournaments</span>
            </button>

            <button
              onClick={() => {
                if (tournaments.length > 0 && stats.totalRequests > 0) {
                  navigate(`/organiser/tournament/${tournaments[0]._id}/manage`);
                } else if (tournaments.length === 0) {
                  alert('No tournaments available.');
                } else {
                  alert('No pending requests at the moment.');
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">📬</span>
              <span>View Requests ({stats.totalRequests})</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Recent Activity
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                No recent activity. Create your first tournament to get started!
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => {
                      if (activity.tournamentId) {
                        navigate(`/organiser/tournament/${activity.tournamentId}/manage`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {activity.type === 'tournament' && '🏸'}
                          {activity.type === 'request' && '📋'}
                          {activity.type === 'match' && '🎯'}
                        </div>
                        <div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium">
                            {activity.message}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Tournaments List */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            My Tournaments
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {tournaments.length === 0 ? (
              <div className="p-6 text-center text-gray-600 dark:text-gray-400">
                You haven't created any tournaments yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tournaments.slice(0, 5).map((tournament) => (
                  <div
                    key={tournament._id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          {tournament.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Code: <span className="font-mono font-bold">{tournament.code}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          tournament.status === 'upcoming' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : tournament.status === 'ongoing'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {tournament.status}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/organiser/tournament/${tournament._id}/manage`);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            title="Manage Tournament"
                          >
                            Manage
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/organiser/tournament/${tournament._id}/schedule`);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            title="Schedule Matches"
                          >
                            Schedule
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/organiser/tournament/${tournament._id}/matches`);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                            title="View Matches"
                          >
                            Matches
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Backup & Restore */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            System Management
          </h3>
          <BackupRestore />
        </div>
      </div>
    </div>
  );
};

export default OrganiserDashboard;
