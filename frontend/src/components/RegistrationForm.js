import React, { useState } from 'react';
import { getTournamentByCode } from '../services/registrationService';

const RegistrationForm = ({ onTournamentFound }) => {
  const [tournamentCode, setTournamentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await getTournamentByCode(tournamentCode);
      onTournamentFound(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to find tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Register for Tournament</h2>
      <p className="text-gray-600 mb-6">
        Enter the tournament code to view available categories and register
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="tournamentCode" className="block text-sm font-medium text-gray-700 mb-2">
            Tournament Code
          </label>
          <input
            type="text"
            id="tournamentCode"
            value={tournamentCode}
            onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            required
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || tournamentCode.length !== 6}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Find Tournament'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;
