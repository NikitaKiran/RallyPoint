import React, { useState, useEffect } from 'react';

/**
 * LiveScoreEntry Component
 * Provides set-by-set score input for live match scoring
 */
const LiveScoreEntry = ({ match, onScoreUpdate, onCancel }) => {
  const [scores, setScores] = useState([
    { setNumber: 1, player1Score: 0, player2Score: 0 },
    { setNumber: 2, player1Score: 0, player2Score: 0 },
    { setNumber: 3, player1Score: 0, player2Score: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize scores from match if available
  useEffect(() => {
    if (match && match.scores && match.scores.length > 0) {
      const existingScores = [...scores];
      match.scores.forEach(score => {
        const index = score.setNumber - 1;
        if (index >= 0 && index < existingScores.length) {
          existingScores[index] = {
            setNumber: score.setNumber,
            player1Score: score.player1Score,
            player2Score: score.player2Score
          };
        }
      });
      setScores(existingScores);
    }
  }, [match]);

  const handleScoreChange = (setIndex, player, value) => {
    const newScores = [...scores];
    const numValue = parseInt(value) || 0;
    
    // Validate score (0-30 for badminton)
    if (numValue < 0 || numValue > 30) {
      return;
    }
    
    if (player === 1) {
      newScores[setIndex].player1Score = numValue;
    } else {
      newScores[setIndex].player2Score = numValue;
    }
    
    setScores(newScores);
  };

  const calculateSetsWon = () => {
    let player1Sets = 0;
    let player2Sets = 0;
    
    scores.forEach(score => {
      if (score.player1Score > score.player2Score) {
        player1Sets++;
      } else if (score.player2Score > score.player1Score) {
        player2Sets++;
      }
    });
    
    return { player1Sets, player2Sets };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Filter out sets with no scores
    const nonEmptyScores = scores.filter(
      score => score.player1Score > 0 || score.player2Score > 0
    );
    
    if (nonEmptyScores.length === 0) {
      setError('Please enter at least one set score');
      return;
    }
    
    setLoading(true);
    
    try {
      await onScoreUpdate(nonEmptyScores);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  const { player1Sets, player2Sets } = calculateSetsWon();
  const player1 = match?.players?.[0];
  const player2 = match?.players?.[1];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Live Score Entry</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="font-semibold">Player</div>
          <div className="font-semibold text-center">Sets Won</div>
          <div></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="truncate">{player1?.name || 'Player 1'}</div>
          <div className="text-center text-2xl font-bold text-blue-600">{player1Sets}</div>
          <div></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="truncate">{player2?.name || 'Player 2'}</div>
          <div className="text-center text-2xl font-bold text-blue-600">{player2Sets}</div>
          <div></div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          {scores.map((score, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Set {score.setNumber}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {player1?.name || 'Player 1'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={score.player1Score}
                    onChange={(e) => handleScoreChange(index, 1, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {player2?.name || 'Player 2'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={score.player2Score}
                    onChange={(e) => handleScoreChange(index, 2, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Score'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LiveScoreEntry;
