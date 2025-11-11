import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TournamentDetails from '../components/TournamentDetails';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTournamentById } from '../services/tournamentService';

const TournamentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  const fetchTournamentDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getTournamentById(id);
      
      if (response.success) {
        setTournament(response.data.tournament);
        setCategories(response.data.categories || []);
      } else {
        setError(response.message || 'Failed to fetch tournament details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tournament details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center font-medium transition-colors group"
          >
            <svg className="w-5 h-5 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Content */}
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
              <LoadingSpinner size="lg" text="Loading tournament details..." />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg transition-colors">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Error loading tournament</span>
              </div>
              <p className="mb-4">{error}</p>
              <button
                onClick={fetchTournamentDetails}
                className="text-sm underline hover:no-underline font-medium"
              >
                Try again
              </button>
            </div>
          ) : tournament ? (
            <TournamentDetails tournament={tournament} categories={categories} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center transition-colors">
              <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Tournament not found</p>
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Browse all tournaments
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TournamentDetailsPage;
