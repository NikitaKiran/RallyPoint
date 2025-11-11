import React, { useState } from 'react';

/**
 * RescheduleRequest Component
 * Modal for submitting reschedule or walkover requests
 */
const RescheduleRequest = ({ match, type, onClose, onSubmit }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(match._id, note, type);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {type === 'reschedule' ? 'Request Reschedule' : 'Declare Walkover'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Match Details */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm font-semibold text-gray-700 mb-2">Match Details</div>
          <div className="text-sm text-gray-600">
            <div>{match.players?.[0]?.name} vs {match.players?.[1]?.name}</div>
            <div className="mt-1">
              {new Date(match.schedule?.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
              {match.schedule?.time && ` at ${match.schedule.time}`}
            </div>
            {match.schedule?.courtNumber && (
              <div>Court {match.schedule.courtNumber}</div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              {type === 'reschedule' ? 'Reason for reschedule (optional)' : 'Reason for walkover (optional)'}
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={type === 'reschedule' 
                ? 'Please explain why you need to reschedule...' 
                : 'Please explain why you need to declare a walkover...'}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Warning for walkover */}
          {type === 'walkover' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Warning:</strong> Declaring a walkover means you forfeit this match. 
              Your opponent will be declared the winner.
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white transition-colors ${
                type === 'reschedule'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleRequest;
