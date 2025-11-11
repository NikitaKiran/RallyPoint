import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById } from '../services/tournamentService';
import Navbar from '../components/Navbar';
import SchedulingPanel from '../components/SchedulingPanel';

const SchedulingPage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTournament();
  }, [tournamentId]);

  const loadTournament = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getTournamentById(tournamentId);
      setTournament(response.data.tournament);
      setCategories(response.data.categories);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading tournament...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/organiser/dashboard')}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/organiser/tournament/${tournamentId}/manage`)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
          >
            ← Back to Tournament Management
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Match Scheduling - {tournament?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Tournament Code: <span className="font-semibold">{tournament?.code}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date(tournament?.startDate).toLocaleDateString()} - {new Date(tournament?.endDate).toLocaleDateString()}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Available Courts: {tournament?.numberOfCourts}
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400">
              No categories found. Please create categories before scheduling matches.
            </p>
            <button
              onClick={() => navigate(`/organiser/tournament/${tournamentId}/manage`)}
              className="mt-4 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Go to Tournament Management
            </button>
          </div>
        ) : (
          <SchedulingPanel tournament={tournament} categories={categories} />
        )}
      </div>
    </div>
  );
};

export default SchedulingPage;
