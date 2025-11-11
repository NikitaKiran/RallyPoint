import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';
import CategorySelection from '../components/CategorySelection';

const RegisterTournamentPage = () => {
  const [tournamentData, setTournamentData] = useState(null);
  const navigate = useNavigate();

  const handleTournamentFound = (data) => {
    setTournamentData(data);
  };

  const handleRegistrationComplete = () => {
    // Navigate to player dashboard after successful registration
    navigate('/player/dashboard');
  };

  const handleReset = () => {
    setTournamentData(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {!tournamentData ? (
          <RegistrationForm onTournamentFound={handleTournamentFound} />
        ) : (
          <>
            <button
              onClick={handleReset}
              className="mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
            >
              ← Search for different tournament
            </button>
            <CategorySelection
              tournament={tournamentData.data.tournament}
              categories={tournamentData.data.categories}
              onRegistrationComplete={handleRegistrationComplete}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterTournamentPage;
