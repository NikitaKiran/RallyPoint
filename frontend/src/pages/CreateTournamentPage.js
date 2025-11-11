import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CreateTournamentForm from '../components/CreateTournamentForm';
import CategoryManager from '../components/CategoryManager';
import { createTournament, createCategory } from '../services/tournamentService';

const CreateTournamentPage = () => {
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTournamentSubmit = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await createTournament(formData);
      
      if (response.success) {
        setTournament(response.data.tournament);
      } else {
        setError(response.message || 'Failed to create tournament');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryCreated = async (categoryData) => {
    if (!tournament) return;
    
    setLoading(true);
    setCategoryError('');
    
    try {
      const response = await createCategory(tournament._id, categoryData);
      
      if (response.success) {
        setCategories([...categories, response.data.category]);
      } else {
        setCategoryError(response.message || 'Failed to create category');
      }
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/organiser/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/organiser/dashboard')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create Tournament</h1>

        {!tournament ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Tournament Details</h2>
            <CreateTournamentForm onSubmit={handleTournamentSubmit} error={error} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded">
              <p className="font-semibold">Tournament Created Successfully!</p>
              <p className="text-sm">Tournament Code: <span className="font-mono font-bold">{tournament.code}</span></p>
              <p className="text-sm mt-1">Share this code with players to register.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Add Categories</h2>
              <CategoryManager 
                tournamentId={tournament._id} 
                onCategoryCreated={handleCategoryCreated}
                error={categoryError}
              />
            </div>

            {categories.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Categories Added ({categories.length})</h2>
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{category.name}</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                        <p>Type: {category.isTeamEvent ? 'Team Event' : 'Singles Event'}</p>
                        {category.eligibilityCriteria && (
                          <p>Eligibility: {category.eligibilityCriteria}</p>
                        )}
                        {category.registrationLimit && (
                          <p>Registration Limit: {category.registrationLimit}</p>
                        )}
                        {category.cashPrize > 0 && (
                          <p>Cash Prize: ${category.cashPrize}</p>
                        )}
                        {category.stages.length > 0 && (
                          <p>Stages: {category.stages.map(s => s.name).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleFinish}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Finish
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6">
              <p className="text-gray-800">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTournamentPage;
