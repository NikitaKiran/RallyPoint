import React, { useState, useEffect } from 'react';
import { scheduleMatches, getCategoryMatches, createMatch, updateMatch, deleteMatch } from '../services/matchService';

const SchedulingPanel = ({ tournament, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [stages, setStages] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  // Manual match form state
  const [manualMatchData, setManualMatchData] = useState({
    roundName: '',
    player1Id: '',
    player1Name: '',
    player2Id: '',
    player2Name: '',
    date: '',
    time: '',
    courtNumber: '',
    matchFormat: 'Best of 3'
  });

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c._id === selectedCategory);
      if (category) {
        setStages(category.stages || []);
        loadCategoryMatches(selectedCategory);
      }
    } else {
      setStages([]);
      setMatches([]);
    }
  }, [selectedCategory, categories]);

  const loadCategoryMatches = async (categoryId) => {
    try {
      const response = await getCategoryMatches(categoryId);
      setMatches(response.data.matches || []);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  };

  const handleAutoSchedule = async () => {
    if (!selectedCategory || !selectedStage) {
      setError('Please select a category and stage');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await scheduleMatches({
        categoryId: selectedCategory,
        stageName: selectedStage
      });

      setSuccess(`Successfully generated ${response.data.count} matches for ${response.data.format} format`);
      await loadCategoryMatches(selectedCategory);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const matchData = {
        tournamentId: tournament._id,
        categoryId: selectedCategory,
        stageName: selectedStage,
        roundName: manualMatchData.roundName,
        players: [
          {
            playerId: manualMatchData.player1Id,
            name: manualMatchData.player1Name,
            isTeam: false,
            teamName: null
          },
          {
            playerId: manualMatchData.player2Id,
            name: manualMatchData.player2Name,
            isTeam: false,
            teamName: null
          }
        ],
        schedule: {
          date: manualMatchData.date,
          time: manualMatchData.time,
          courtNumber: parseInt(manualMatchData.courtNumber)
        },
        matchFormat: manualMatchData.matchFormat
      };

      if (editingMatch) {
        await updateMatch(editingMatch._id, {
          schedule: matchData.schedule,
          matchFormat: matchData.matchFormat,
          roundName: matchData.roundName
        });
        setSuccess('Match updated successfully');
      } else {
        await createMatch(matchData);
        setSuccess('Match created successfully');
      }

      setShowManualForm(false);
      setEditingMatch(null);
      resetManualForm();
      await loadCategoryMatches(selectedCategory);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setManualMatchData({
      roundName: match.roundName || '',
      player1Id: match.players[0]?.playerId || '',
      player1Name: match.players[0]?.name || '',
      player2Id: match.players[1]?.playerId || '',
      player2Name: match.players[1]?.name || '',
      date: match.schedule?.date ? new Date(match.schedule.date).toISOString().split('T')[0] : '',
      time: match.schedule?.time || '',
      courtNumber: match.schedule?.courtNumber || '',
      matchFormat: match.matchFormat || 'Best of 3'
    });
    setShowManualForm(true);
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deleteMatch(matchId);
      setSuccess('Match deleted successfully');
      await loadCategoryMatches(selectedCategory);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete match');
    } finally {
      setLoading(false);
    }
  };

  const resetManualForm = () => {
    setManualMatchData({
      roundName: '',
      player1Id: '',
      player1Name: '',
      player2Id: '',
      player2Name: '',
      date: '',
      time: '',
      courtNumber: '',
      matchFormat: 'Best of 3'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Match Scheduling</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Category and Stage Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedStage('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Category --</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Stage
          </label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            disabled={!selectedCategory}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">-- Select Stage --</option>
            {stages.map((stage, index) => (
              <option key={index} value={stage.name}>
                {stage.name} ({stage.format})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleAutoSchedule}
          disabled={!selectedCategory || !selectedStage || loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Automatic Schedule'}
        </button>

        <button
          onClick={() => {
            setShowManualForm(!showManualForm);
            setEditingMatch(null);
            resetManualForm();
          }}
          disabled={!selectedCategory || !selectedStage}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {showManualForm ? 'Cancel' : 'Create Manual Match'}
        </button>
      </div>

      {/* Manual Match Form */}
      {showManualForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingMatch ? 'Edit Match' : 'Create Manual Match'}
          </h3>
          <form onSubmit={handleManualMatchSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Round Name
                </label>
                <input
                  type="text"
                  value={manualMatchData.roundName}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, roundName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Quarter-Final"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Format
                </label>
                <select
                  value={manualMatchData.matchFormat}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, matchFormat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Best of 3">Best of 3</option>
                  <option value="Best of 5">Best of 5</option>
                  <option value="Single Game">Single Game</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Player 1 ID
                </label>
                <input
                  type="text"
                  value={manualMatchData.player1Id}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, player1Id: e.target.value })}
                  required
                  disabled={editingMatch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Player 1 Name
                </label>
                <input
                  type="text"
                  value={manualMatchData.player1Name}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, player1Name: e.target.value })}
                  required
                  disabled={editingMatch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Player 2 ID
                </label>
                <input
                  type="text"
                  value={manualMatchData.player2Id}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, player2Id: e.target.value })}
                  required
                  disabled={editingMatch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Player 2 Name
                </label>
                <input
                  type="text"
                  value={manualMatchData.player2Name}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, player2Name: e.target.value })}
                  required
                  disabled={editingMatch}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={manualMatchData.date}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={manualMatchData.time}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={manualMatchData.courtNumber}
                  onChange={(e) => setManualMatchData({ ...manualMatchData, courtNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : editingMatch ? 'Update Match' : 'Create Match'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualForm(false);
                  setEditingMatch(null);
                  resetManualForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Matches List */}
      {matches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Generated Matches ({matches.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b text-left">Match #</th>
                  <th className="px-4 py-2 border-b text-left">Round</th>
                  <th className="px-4 py-2 border-b text-left">Players</th>
                  <th className="px-4 py-2 border-b text-left">Date</th>
                  <th className="px-4 py-2 border-b text-left">Time</th>
                  <th className="px-4 py-2 border-b text-left">Court</th>
                  <th className="px-4 py-2 border-b text-left">Status</th>
                  <th className="px-4 py-2 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{match.matchNumber}</td>
                    <td className="px-4 py-2 border-b">{match.roundName || '-'}</td>
                    <td className="px-4 py-2 border-b">
                      {match.players.map(p => p.name).join(' vs ')}
                    </td>
                    <td className="px-4 py-2 border-b">{formatDate(match.schedule?.date)}</td>
                    <td className="px-4 py-2 border-b">{match.schedule?.time || '-'}</td>
                    <td className="px-4 py-2 border-b">{match.schedule?.courtNumber || '-'}</td>
                    <td className="px-4 py-2 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        match.status === 'completed' ? 'bg-green-100 text-green-800' :
                        match.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b">
                      <button
                        onClick={() => handleEditMatch(match)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingPanel;
