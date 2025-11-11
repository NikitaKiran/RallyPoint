import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayerStats } from '../services/statsService';
import Navbar from '../components/Navbar';
import PlayerStats from '../components/PlayerStats';
import MatchHistoryTable from '../components/MatchHistoryTable';

const PlayerStatsPage = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsData, setStatsData] = useState(null);
  const [filters, setFilters] = useState({
    tournamentId: null,
    categoryId: null
  });

  useEffect(() => {
    fetchPlayerStats();
  }, [playerId, filters]);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getPlayerStats(playerId, filters);
      setStatsData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch player statistics');
      console.error('Error fetching player stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Player Statistics</h1>
        </div>

        {/* Statistics Display */}
        {statsData && (
          <div className="space-y-6">
            <PlayerStats 
              statistics={statsData.statistics} 
              player={statsData.player}
            />

            {/* Match History */}
            {statsData.statistics.matchHistory && statsData.statistics.matchHistory.length > 0 && (
              <MatchHistoryTable 
                matchHistory={statsData.statistics.matchHistory}
                onFilterChange={handleFilterChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerStatsPage;
