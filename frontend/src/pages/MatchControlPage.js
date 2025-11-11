import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MatchControl from '../components/MatchControl';
import { getTournamentMatches, updateLiveScore, enterResult } from '../services/matchService';
import { getTournamentById } from '../services/tournamentService';

/**
 * MatchControlPage
 * Page for organisers to control matches, update scores, and enter results
 */
const MatchControlPage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch tournament details
      const tournamentResponse = await getTournamentById(tournamentId);
      setTournament(tournamentResponse.data.tournament);

      // Fetch matches
      const matchesResponse = await getTournamentMatches(tournamentId);
      setMatches(matchesResponse.data.matches);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveScoreUpdate = async (matchId, scores) => {
    try {
      await updateLiveScore(matchId, scores);
      // Refresh matches after update
      await fetchData();
    } catch (err) {
      throw err;
    }
  };

  const handleResultEntry = async (matchId, resultData) => {
    try {
      await enterResult(matchId, resultData);
      // Refresh matches after update
      await fetchData();
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-md">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={() => navigate('/organiser/dashboard')}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/organiser/tournaments/${tournamentId}/manage`)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tournament
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tournament?.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Match Control Center</p>
        </div>

        {/* Match Control */}
        <MatchControl
          matches={matches}
          onLiveScoreUpdate={handleLiveScoreUpdate}
          onResultEntry={handleResultEntry}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
};

export default MatchControlPage;
