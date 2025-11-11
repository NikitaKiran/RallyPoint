import React, { useState } from 'react';

const MatchHistoryTable = ({ matchHistory, onFilterChange }) => {
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  if (!matchHistory || matchHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Match History</h4>
        <div className="text-center py-8 text-gray-500">
          No match history available
        </div>
      </div>
    );
  }

  // Extract unique tournaments and categories for filters
  const tournaments = [...new Set(matchHistory.map(m => m.tournament?.id).filter(Boolean))];
  const categories = [...new Set(matchHistory.map(m => m.category?.id).filter(Boolean))];

  const handleTournamentFilter = (tournamentId) => {
    setSelectedTournament(tournamentId);
    if (onFilterChange) {
      onFilterChange({ tournamentId: tournamentId || null, categoryId: selectedCategory || null });
    }
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    if (onFilterChange) {
      onFilterChange({ tournamentId: selectedTournament || null, categoryId: categoryId || null });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getResultBadge = (result) => {
    if (result === 'win') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
          WIN
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
          LOSS
        </span>
      );
    }
  };

  const getScoreDisplay = (match) => {
    if (!match.scores || match.scores.length === 0) {
      return <span className="text-gray-400 text-sm">No score</span>;
    }

    return (
      <div className="flex gap-2 flex-wrap">
        {match.scores.map((score, idx) => {
          // Determine which score belongs to the player
          const playerScore = match.playerSets !== undefined 
            ? (idx === 0 ? match.scores[idx].player1Score : match.scores[idx].player2Score)
            : score.player1Score;
          const opponentScore = match.opponentSets !== undefined
            ? (idx === 0 ? match.scores[idx].player2Score : match.scores[idx].player1Score)
            : score.player2Score;

          return (
            <span key={idx} className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {score.player1Score}-{score.player2Score}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold text-gray-800">Match History</h4>
        <span className="text-sm text-gray-600">{matchHistory.length} matches</span>
      </div>

      {/* Filters */}
      {(tournaments.length > 1 || categories.length > 1) && (
        <div className="mb-4 flex gap-4">
          {tournaments.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Filter by Tournament
              </label>
              <select
                value={selectedTournament}
                onChange={(e) => handleTournamentFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Tournaments</option>
                {tournaments.map(tournamentId => {
                  const match = matchHistory.find(m => m.tournament?.id === tournamentId);
                  return (
                    <option key={tournamentId} value={tournamentId}>
                      {match?.tournament?.name || 'Unknown'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {categories.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(categoryId => {
                  const match = matchHistory.find(m => m.category?.id === categoryId);
                  return (
                    <option key={categoryId} value={categoryId}>
                      {match?.category?.name || 'Unknown'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tournament
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Opponent
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sets
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matchHistory.map((match) => (
              <tr key={match.matchId} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                  {formatDate(match.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  <div>
                    <div className="font-medium">{match.tournament?.name || 'N/A'}</div>
                    {match.tournament?.code && (
                      <div className="text-xs text-gray-500">{match.tournament.code}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {match.category?.name || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {match.opponent?.isTeam 
                    ? match.opponent.teamName 
                    : match.opponent?.name || 'TBD'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {getScoreDisplay(match)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                  <span className="font-mono">
                    {match.playerSets !== undefined && match.opponentSets !== undefined
                      ? `${match.playerSets}-${match.opponentSets}`
                      : 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {getResultBadge(match.result)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchHistoryTable;
