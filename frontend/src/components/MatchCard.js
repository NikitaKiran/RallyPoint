import React, { useState } from 'react';
import RescheduleRequest from './RescheduleRequest';

/**
 * MatchCard Component
 * Displays match details including players, scores, schedule, and status
 */
const MatchCard = ({ 
  match, 
  showCategory = false, 
  showRequestButtons = false,
  onRequestSubmit,
  requestStatus = null 
}) => {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showWalkoverModal, setShowWalkoverModal] = useState(false);
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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateSetsWon = () => {
    if (!match.scores || match.scores.length === 0) {
      return { player1Sets: 0, player2Sets: 0 };
    }

    let player1Sets = 0;
    let player2Sets = 0;

    match.scores.forEach(score => {
      if (score.player1Score > score.player2Score) {
        player1Sets++;
      } else if (score.player2Score > score.player1Score) {
        player2Sets++;
      }
    });

    return { player1Sets, player2Sets };
  };

  const { player1Sets, player2Sets } = calculateSetsWon();
  const player1 = match.players?.[0];
  const player2 = match.players?.[1];
  const isCompleted = match.status === 'completed' || match.status === 'walkover';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      {/* Header with status and round */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-700">
            {match.roundName || match.stageName}
          </div>
          {showCategory && match.categoryId?.name && (
            <div className="text-xs text-gray-500">{match.categoryId.name}</div>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(match.status)}`}>
          {match.status}
        </span>
      </div>

      {/* Players and Scores */}
      <div className="space-y-2 mb-4">
        {/* Player 1 */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className={`font-semibold ${
              isCompleted && match.winnerId?.toString() === player1?.playerId?.toString() 
                ? 'text-green-600' 
                : 'text-gray-900'
            }`}>
              {player1?.name || 'TBD'}
            </div>
          </div>
          {isCompleted && (
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{player1Sets}</span>
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="text-center text-sm text-gray-500">vs</div>

        {/* Player 2 */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className={`font-semibold ${
              isCompleted && match.winnerId?.toString() === player2?.playerId?.toString() 
                ? 'text-green-600' 
                : 'text-gray-900'
            }`}>
              {player2?.name || 'TBD'}
            </div>
          </div>
          {isCompleted && (
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{player2Sets}</span>
            </div>
          )}
        </div>
      </div>

      {/* Set Scores */}
      {match.scores && match.scores.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-xs font-semibold text-gray-600 mb-2">Set Scores</div>
          <div className="space-y-1">
            {match.scores.map((score, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">Set {score.setNumber}:</span>
                <span className="font-semibold">
                  {score.player1Score} - {score.player2Score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Information */}
      <div className="border-t pt-3 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(match.schedule?.date)}
            </div>
            {match.schedule?.time && (
              <div className="ml-5">{match.schedule.time}</div>
            )}
          </div>
          {match.schedule?.courtNumber && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Court {match.schedule.courtNumber}
            </div>
          )}
        </div>
      </div>

      {/* Walkover indicator */}
      {match.status === 'walkover' && (
        <div className="mt-3 text-center text-sm text-orange-600 font-semibold">
          Walkover
        </div>
      )}

      {/* Request Status */}
      {requestStatus && (
        <div className={`mt-3 p-2 rounded text-sm text-center ${
          requestStatus.status === 'pending' 
            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : requestStatus.status === 'accepted'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <strong>{requestStatus.type === 'reschedule' ? 'Reschedule' : 'Walkover'} Request:</strong> {requestStatus.status}
        </div>
      )}

      {/* Request Buttons */}
      {showRequestButtons && match.status !== 'completed' && match.status !== 'walkover' && (
        <div className="mt-4 pt-3 border-t flex space-x-2">
          <button
            onClick={() => setShowRescheduleModal(true)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Request Reschedule
          </button>
          <button
            onClick={() => setShowWalkoverModal(true)}
            className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            Declare Walkover
          </button>
        </div>
      )}

      {/* Modals */}
      {showRescheduleModal && (
        <RescheduleRequest
          match={match}
          type="reschedule"
          onClose={() => setShowRescheduleModal(false)}
          onSubmit={onRequestSubmit}
        />
      )}

      {showWalkoverModal && (
        <RescheduleRequest
          match={match}
          type="walkover"
          onClose={() => setShowWalkoverModal(false)}
          onSubmit={onRequestSubmit}
        />
      )}
    </div>
  );
};

export default MatchCard;
