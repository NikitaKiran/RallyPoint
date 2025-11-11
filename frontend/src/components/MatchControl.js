import React, { useState } from 'react';
import LiveScoreEntry from './LiveScoreEntry';

/**
 * MatchControl Component
 * Provides match selection, status display, and control options
 */
const MatchControl = ({ matches, onLiveScoreUpdate, onResultEntry, onRefresh }) => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showLiveScore, setShowLiveScore] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultScores, setResultScores] = useState([
    { setNumber: 1, player1Score: 0, player2Score: 0 },
    { setNumber: 2, player1Score: 0, player2Score: 0 },
    { setNumber: 3, player1Score: 0, player2Score: 0 }
  ]);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    setShowLiveScore(false);
    setShowResultForm(false);
    setError('');
  };

  const handleLiveScoreClick = () => {
    setShowLiveScore(true);
    setShowResultForm(false);
    setError('');
  };

  const handleResultClick = () => {
    setShowResultForm(true);
    setShowLiveScore(false);
    setError('');
    
    // Initialize result scores from match if available
    if (selectedMatch?.scores && selectedMatch.scores.length > 0) {
      const newScores = [...resultScores];
      selectedMatch.scores.forEach(score => {
        const index = score.setNumber - 1;
        if (index >= 0 && index < newScores.length) {
          newScores[index] = {
            setNumber: score.setNumber,
            player1Score: score.player1Score,
            player2Score: score.player2Score
          };
        }
      });
      setResultScores(newScores);
    }
  };

  const handleWalkoverClick = async () => {
    if (!selectedWinner) {
      setError('Please select a winner for the walkover');
      return;
    }

    if (!window.confirm('Are you sure you want to record this as a walkover?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onResultEntry(selectedMatch._id, {
        isWalkover: true,
        winnerId: selectedWinner
      });
      setSelectedMatch(null);
      setShowResultForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record walkover');
    } finally {
      setLoading(false);
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Filter out sets with no scores
    const nonEmptyScores = resultScores.filter(
      score => score.player1Score > 0 || score.player2Score > 0
    );

    if (nonEmptyScores.length === 0) {
      setError('Please enter at least one set score');
      return;
    }

    setLoading(true);

    try {
      await onResultEntry(selectedMatch._id, {
        scores: nonEmptyScores,
        isWalkover: false
      });
      setSelectedMatch(null);
      setShowResultForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enter result');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (setIndex, player, value) => {
    const newScores = [...resultScores];
    const numValue = parseInt(value) || 0;
    
    if (numValue < 0 || numValue > 30) {
      return;
    }
    
    if (player === 1) {
      newScores[setIndex].player1Score = numValue;
    } else {
      newScores[setIndex].player2Score = numValue;
    }
    
    setResultScores(newScores);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-200 text-gray-800';
      case 'ongoing':
        return 'bg-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'walkover':
        return 'bg-orange-200 text-orange-800';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Match List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Select Match</h3>
        
        {matches.length === 0 ? (
          <p className="text-gray-500">No matches available</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {matches.map((match) => (
              <div
                key={match._id}
                onClick={() => handleMatchSelect(match)}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedMatch?._id === match._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-semibold">{match.players[0]?.name || 'TBD'}</div>
                    <div className="text-sm text-gray-600">vs</div>
                    <div className="font-semibold">{match.players[1]?.name || 'TBD'}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(match.status)}`}>
                    {match.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>{match.roundName || match.stageName}</div>
                  <div>Court {match.schedule?.courtNumber} - {formatDate(match.schedule?.date)} {match.schedule?.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Control Panel */}
      <div>
        {!selectedMatch ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Select a match to control</p>
          </div>
        ) : showLiveScore ? (
          <LiveScoreEntry
            match={selectedMatch}
            onScoreUpdate={async (scores) => {
              await onLiveScoreUpdate(selectedMatch._id, scores);
              setShowLiveScore(false);
              if (onRefresh) onRefresh();
            }}
            onCancel={() => setShowLiveScore(false)}
          />
        ) : showResultForm ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Enter Final Result</h3>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleResultSubmit}>
              <div className="space-y-4 mb-6">
                {resultScores.map((score, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Set {score.setNumber}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {selectedMatch.players[0]?.name || 'Player 1'}
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
                          {selectedMatch.players[1]?.name || 'Player 2'}
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

              <div className="border-t pt-4 mb-6">
                <h4 className="font-semibold mb-3">Or Record Walkover</h4>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Winner
                  </label>
                  <select
                    value={selectedWinner}
                    onChange={(e) => setSelectedWinner(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Winner --</option>
                    {selectedMatch.players.map((player, index) => (
                      <option key={index} value={player.playerId}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleWalkoverClick}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
                  disabled={loading || !selectedWinner}
                >
                  {loading ? 'Recording...' : 'Record Walkover'}
                </button>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResultForm(false)}
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
                  {loading ? 'Submitting...' : 'Submit Result'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Match Details</h3>
            
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Player 1</div>
                  <div className="font-semibold">{selectedMatch.players[0]?.name || 'TBD'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Player 2</div>
                  <div className="font-semibold">{selectedMatch.players[1]?.name || 'TBD'}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-600">Status</div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedMatch.status)}`}>
                  {selectedMatch.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600">Schedule</div>
                <div>Court {selectedMatch.schedule?.courtNumber}</div>
                <div>{formatDate(selectedMatch.schedule?.date)} {selectedMatch.schedule?.time}</div>
              </div>

              {selectedMatch.scores && selectedMatch.scores.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Current Scores</div>
                  {selectedMatch.scores.map((score, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <span>Set {score.setNumber}:</span>
                      <span className="font-semibold">
                        {score.player1Score} - {score.player2Score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {selectedMatch.status !== 'completed' && selectedMatch.status !== 'walkover' && (
                <>
                  <button
                    onClick={handleLiveScoreClick}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Live Score
                  </button>
                  <button
                    onClick={handleResultClick}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Enter Final Result
                  </button>
                </>
              )}
              {(selectedMatch.status === 'completed' || selectedMatch.status === 'walkover') && (
                <div className="text-center text-gray-600">
                  Match is already {selectedMatch.status}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchControl;
