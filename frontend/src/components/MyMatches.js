import React, { useState, useEffect } from 'react';
import { getMyMatches } from '../services/matchService';
import { createRescheduleRequest, createWalkoverRequest } from '../services/requestService';
import MatchCard from './MatchCard';

const MyMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMyMatches();
      setMatches(response.data.matches);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch matches');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (matchId, note, type) => {
    try {
      if (type === 'reschedule') {
        await createRescheduleRequest(matchId, note);
      } else {
        await createWalkoverRequest(matchId, note);
      }
      
      // Refresh matches to show updated status
      await fetchMatches();
      
      // Show success message (you could add a toast notification here)
      alert(`${type === 'reschedule' ? 'Reschedule' : 'Walkover'} request submitted successfully`);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  // Filter matches based on status
  const getFilteredMatches = () => {
    if (filter === 'upcoming') {
      return matches.filter(m => m.status === 'scheduled' || m.status === 'ongoing');
    } else if (filter === 'completed') {
      return matches.filter(m => m.status === 'completed' || m.status === 'walkover');
    }
    return matches;
  };

  // Group matches by tournament
  const groupMatchesByTournament = () => {
    const filtered = getFilteredMatches();
    const grouped = {};
    
    filtered.forEach(match => {
      const tournamentId = match.tournamentId._id;
      if (!grouped[tournamentId]) {
        grouped[tournamentId] = {
          tournament: match.tournamentId,
          matches: []
        };
      }
      grouped[tournamentId].matches.push(match);
    });
    
    return Object.values(grouped);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      walkover: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getScoreDisplay = (match) => {
    if (match.scores.length === 0) {
      return <span className="text-gray-400">No score yet</span>;
    }
    
    return (
      <div className="flex gap-2">
        {match.scores.map((score, idx) => (
          <span key={idx} className="text-sm font-mono">
            {score.player1Score}-{score.player2Score}
          </span>
        ))}
      </div>
    );
  };

  const getResultIndicator = (match) => {
    if (match.didWin === null) {
      return null;
    }
    
    return match.didWin ? (
      <span className="text-green-600 font-semibold">WIN</span>
    ) : (
      <span className="text-red-600 font-semibold">LOSS</span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const groupedMatches = groupMatchesByTournament();

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Matches ({matches.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-md ${
            filter === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upcoming ({matches.filter(m => m.status === 'scheduled' || m.status === 'ongoing').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-md ${
            filter === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed ({matches.filter(m => m.status === 'completed' || m.status === 'walkover').length})
        </button>
      </div>

      {/* Matches grouped by tournament */}
      {groupedMatches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No matches found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'all' 
              ? 'You have not been scheduled for any matches yet'
              : `No ${filter} matches`}
          </p>
        </div>
      ) : (
        groupedMatches.map(({ tournament, matches: tournamentMatches }) => (
          <div key={tournament._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tournament header */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <h3 className="text-xl font-bold">{tournament.name}</h3>
              <p className="text-blue-100 text-sm">Code: {tournament.code}</p>
            </div>

            {/* Matches list */}
            <div className="divide-y divide-gray-200">
              {tournamentMatches.map((match) => (
                <div key={match._id} className="p-6">
                  <MatchCard
                    match={match}
                    showCategory={true}
                    showRequestButtons={true}
                    onRequestSubmit={handleRequestSubmit}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Match detail modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Match Details</h2>
                  <p className="text-gray-600">{selectedMatch.tournamentId.name}</p>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Match information */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Category</label>
                  <p className="text-gray-800">{selectedMatch.categoryId.name}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Stage</label>
                  <p className="text-gray-800">
                    {selectedMatch.stageName}
                    {selectedMatch.roundName && ` - ${selectedMatch.roundName}`}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Players</label>
                  <div className="space-y-2 mt-1">
                    <p className="text-gray-800">
                      {selectedMatch.currentPlayer?.isTeam 
                        ? selectedMatch.currentPlayer.teamName 
                        : selectedMatch.currentPlayer?.playerId?.name} (You)
                    </p>
                    <p className="text-gray-800">
                      {selectedMatch.opponent?.isTeam 
                        ? selectedMatch.opponent.teamName 
                        : selectedMatch.opponent?.playerId?.name || 'TBD'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Schedule</label>
                  <p className="text-gray-800">
                    {formatDate(selectedMatch.schedule.date)}
                    {selectedMatch.schedule.time && ` at ${selectedMatch.schedule.time}`}
                  </p>
                  {selectedMatch.schedule.courtNumber && (
                    <p className="text-gray-600 text-sm">Court {selectedMatch.schedule.courtNumber}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Format</label>
                  <p className="text-gray-800">{selectedMatch.matchFormat}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedMatch.status)}</div>
                </div>

                {selectedMatch.scores.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Score</label>
                    <div className="mt-2 space-y-2">
                      {selectedMatch.scores.map((score, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">Set {score.setNumber}:</span>
                          <span className="font-mono font-semibold">
                            {score.player1Score} - {score.player2Score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMatch.didWin !== null && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Result</label>
                    <div className="mt-1">
                      {getResultIndicator(selectedMatch)}
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMatches;
