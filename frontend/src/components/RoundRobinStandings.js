import React from 'react';

/**
 * RoundRobinStandings Component
 * Displays standings table for round robin format
 */
const RoundRobinStandings = ({ matches }) => {
  // Calculate standings from matches
  const calculateStandings = () => {
    const playerStats = {};
    
    // Initialize stats for all players
    matches.forEach(match => {
      match.players.forEach(player => {
        const playerId = player.playerId?.toString();
        if (playerId && !playerStats[playerId]) {
          playerStats[playerId] = {
            playerId,
            name: player.name,
            played: 0,
            won: 0,
            lost: 0,
            setsWon: 0,
            setsLost: 0,
            pointsWon: 0,
            pointsLost: 0,
            groupId: match.groupId || 'A'
          };
        }
      });
    });
    
    // Calculate stats from completed matches
    matches.forEach(match => {
      if (match.status !== 'completed' && match.status !== 'walkover') {
        return;
      }
      
      const player1Id = match.players[0]?.playerId?.toString();
      const player2Id = match.players[1]?.playerId?.toString();
      
      if (!player1Id || !player2Id) return;
      
      // Update played count
      playerStats[player1Id].played++;
      playerStats[player2Id].played++;
      
      if (match.status === 'walkover') {
        // Handle walkover
        const winnerId = match.winnerId?.toString();
        if (winnerId === player1Id) {
          playerStats[player1Id].won++;
          playerStats[player2Id].lost++;
        } else if (winnerId === player2Id) {
          playerStats[player2Id].won++;
          playerStats[player1Id].lost++;
        }
      } else if (match.scores && match.scores.length > 0) {
        // Calculate from scores
        let player1Sets = 0;
        let player2Sets = 0;
        let player1Points = 0;
        let player2Points = 0;
        
        match.scores.forEach(score => {
          player1Points += score.player1Score;
          player2Points += score.player2Score;
          
          if (score.player1Score > score.player2Score) {
            player1Sets++;
          } else if (score.player2Score > score.player1Score) {
            player2Sets++;
          }
        });
        
        // Update sets
        playerStats[player1Id].setsWon += player1Sets;
        playerStats[player1Id].setsLost += player2Sets;
        playerStats[player2Id].setsWon += player2Sets;
        playerStats[player2Id].setsLost += player1Sets;
        
        // Update points
        playerStats[player1Id].pointsWon += player1Points;
        playerStats[player1Id].pointsLost += player2Points;
        playerStats[player2Id].pointsWon += player2Points;
        playerStats[player2Id].pointsLost += player1Points;
        
        // Update wins/losses
        if (player1Sets > player2Sets) {
          playerStats[player1Id].won++;
          playerStats[player2Id].lost++;
        } else if (player2Sets > player1Sets) {
          playerStats[player2Id].won++;
          playerStats[player1Id].lost++;
        }
      }
    });
    
    // Convert to array and sort
    const standings = Object.values(playerStats).sort((a, b) => {
      // Sort by wins (descending)
      if (b.won !== a.won) return b.won - a.won;
      // Then by sets difference
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      // Then by points difference
      const aPointDiff = a.pointsWon - a.pointsLost;
      const bPointDiff = b.pointsWon - b.pointsLost;
      return bPointDiff - aPointDiff;
    });
    
    return standings;
  };

  // Group standings by group
  const groupStandings = () => {
    const standings = calculateStandings();
    const groups = {};
    
    standings.forEach(player => {
      const groupId = player.groupId || 'A';
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(player);
    });
    
    return groups;
  };

  const groups = groupStandings();

  if (matches.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No matches available for standings
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-6">Round Robin Standings</h3>
      
      <div className="space-y-8">
        {Object.entries(groups).map(([groupId, standings]) => (
          <div key={groupId}>
            {Object.keys(groups).length > 1 && (
              <h4 className="text-lg font-semibold mb-4">Group {groupId}</h4>
            )}
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Played
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Won
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lost
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sets
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {standings.map((player, index) => (
                    <tr key={player.playerId} className={index === 0 ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {player.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {player.played}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                        {player.won}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-red-600">
                        {player.lost}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {player.setsWon}-{player.setsLost}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {player.pointsWon}-{player.pointsLost}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoundRobinStandings;
