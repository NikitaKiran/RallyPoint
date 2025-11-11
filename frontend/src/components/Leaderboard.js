import React from 'react';

const Leaderboard = ({ leaderboard, title = 'Leaderboard' }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">{title}</h4>
        <div className="text-center py-8 text-gray-500">
          No leaderboard data available
        </div>
      </div>
    );
  }

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-10 h-10 bg-yellow-400 text-white rounded-full font-bold text-lg">
          🥇
        </span>
      );
    } else if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-300 text-white rounded-full font-bold text-lg">
          🥈
        </span>
      );
    } else if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-10 h-10 bg-orange-400 text-white rounded-full font-bold text-lg">
          🥉
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-200 text-gray-700 rounded-full font-bold">
          {rank}
        </span>
      );
    }
  };

  const getWinRateColor = (winRate) => {
    const rate = parseFloat(winRate);
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-blue-600';
    if (rate >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h4 className="text-lg font-bold text-gray-800 mb-4">{title}</h4>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Player
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Matches
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Wins
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Losses
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sets +/-
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Points +/-
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((entry) => (
              <tr 
                key={entry.playerId} 
                className={`hover:bg-gray-50 ${entry.rank <= 3 ? 'bg-yellow-50' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  {getRankBadge(entry.rank)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-gray-800">
                    {entry.isTeam ? entry.teamName : entry.playerName}
                  </div>
                  {entry.isTeam && (
                    <div className="text-xs text-gray-500">Team</div>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-800">
                  {entry.matchesPlayed}
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className="font-semibold text-green-600">{entry.wins}</span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className="font-semibold text-red-600">{entry.losses}</span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className={`font-semibold ${getWinRateColor(entry.winRate)}`}>
                    {entry.winRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className={`font-semibold ${entry.setDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.setDifference >= 0 ? '+' : ''}{entry.setDifference}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className={`font-semibold ${entry.pointDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.pointDifference >= 0 ? '+' : ''}{entry.pointDifference}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{leaderboard.length}</span> players ranked
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
