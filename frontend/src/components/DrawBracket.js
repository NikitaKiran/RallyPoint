import React from 'react';

/**
 * DrawBracket Component
 * Visualizes knockout tournament brackets
 */
const DrawBracket = ({ matches }) => {
  // Group matches by round
  const groupMatchesByRound = () => {
    const rounds = {};
    
    matches.forEach(match => {
      const roundName = match.roundName || 'Unknown';
      if (!rounds[roundName]) {
        rounds[roundName] = [];
      }
      rounds[roundName].push(match);
    });
    
    // Sort rounds by number of matches (descending)
    const sortedRounds = Object.entries(rounds).sort((a, b) => {
      return b[1].length - a[1].length;
    });
    
    return sortedRounds;
  };

  const getWinnerName = (match) => {
    if (!match.winnerId) return null;
    
    const winner = match.players.find(
      p => p.playerId?.toString() === match.winnerId?.toString()
    );
    
    return winner?.name || null;
  };

  const getMatchScore = (match) => {
    if (!match.scores || match.scores.length === 0) return null;
    
    let player1Sets = 0;
    let player2Sets = 0;
    
    match.scores.forEach(score => {
      if (score.player1Score > score.player2Score) {
        player1Sets++;
      } else if (score.player2Score > score.player1Score) {
        player2Sets++;
      }
    });
    
    return `${player1Sets}-${player2Sets}`;
  };

  const rounds = groupMatchesByRound();

  if (matches.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No matches in bracket yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-6">Knockout Bracket</h3>
      
      <div className="overflow-x-auto">
        <div className="flex space-x-8 min-w-max">
          {rounds.map(([roundName, roundMatches], roundIndex) => (
            <div key={roundIndex} className="flex flex-col justify-around min-w-[250px]">
              {/* Round Header */}
              <div className="text-center font-semibold text-gray-700 mb-4 sticky top-0 bg-white py-2">
                {roundName}
              </div>
              
              {/* Matches in Round */}
              <div className="space-y-8">
                {roundMatches.map((match, matchIndex) => (
                  <div key={match._id} className="relative">
                    <div className="border-2 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                      {/* Match Number */}
                      {match.matchNumber && (
                        <div className="text-xs text-gray-500 mb-2">
                          Match {match.matchNumber}
                        </div>
                      )}
                      
                      {/* Player 1 */}
                      <div className={`flex justify-between items-center py-2 px-2 rounded ${
                        match.winnerId?.toString() === match.players[0]?.playerId?.toString()
                          ? 'bg-green-50 font-semibold'
                          : ''
                      }`}>
                        <span className="truncate">
                          {match.players[0]?.name || 'TBD'}
                        </span>
                        {match.status === 'completed' && getMatchScore(match) && (
                          <span className="ml-2 text-sm">
                            {getMatchScore(match).split('-')[0]}
                          </span>
                        )}
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t my-1"></div>
                      
                      {/* Player 2 */}
                      <div className={`flex justify-between items-center py-2 px-2 rounded ${
                        match.winnerId?.toString() === match.players[1]?.playerId?.toString()
                          ? 'bg-green-50 font-semibold'
                          : ''
                      }`}>
                        <span className="truncate">
                          {match.players[1]?.name || 'TBD'}
                        </span>
                        {match.status === 'completed' && getMatchScore(match) && (
                          <span className="ml-2 text-sm">
                            {getMatchScore(match).split('-')[1]}
                          </span>
                        )}
                      </div>
                      
                      {/* Match Status */}
                      <div className="mt-2 text-xs text-center">
                        {match.status === 'completed' && (
                          <span className="text-green-600">Completed</span>
                        )}
                        {match.status === 'ongoing' && (
                          <span className="text-yellow-600">Ongoing</span>
                        )}
                        {match.status === 'scheduled' && (
                          <span className="text-gray-600">Scheduled</span>
                        )}
                        {match.status === 'walkover' && (
                          <span className="text-orange-600">Walkover</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Connector line to next round (visual only) */}
                    {roundIndex < rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
            <span className="text-gray-600">Winner</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded mr-2"></div>
            <span className="text-gray-600">Match</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawBracket;
