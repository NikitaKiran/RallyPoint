import React, { useState, useEffect } from 'react';
import { getTournamentRequests, acceptRequest, rejectRequest } from '../services/requestService';
import { sendEmailNotification, sendMatchReminder } from '../services/notificationService';

/**
 * RequestsPanel Component
 * Displays and manages player requests for a tournament (organiser only)
 */
const RequestsPanel = ({ tournamentId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, accepted, rejected, all
  const [processingId, setProcessingId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { requestId, action, type }
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    subject: '',
    message: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  useEffect(() => {
    if (tournamentId) {
      fetchRequests();
    }
  }, [tournamentId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTournamentRequests(tournamentId);
      setRequests(response.data.requests);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setProcessingId(requestId);
      await acceptRequest(requestId);
      await fetchRequests(); // Refresh the list
      setConfirmAction(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept request');
      console.error('Error accepting request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessingId(requestId);
      await rejectRequest(requestId);
      await fetchRequests(); // Refresh the list
      setConfirmAction(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
      console.error('Error rejecting request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      setSendingEmail(true);
      setError('');
      setEmailSuccess('');
      
      // Parse recipients (comma-separated emails)
      const recipientList = emailForm.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      
      await sendEmailNotification({
        recipients: recipientList,
        subject: emailForm.subject,
        message: emailForm.message,
        tournamentId
      });
      
      setEmailSuccess('Emails sent successfully!');
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailForm({ recipients: '', subject: '', message: '' });
        setEmailSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send emails');
      console.error('Error sending emails:', err);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendMatchReminder = async (matchId) => {
    try {
      setProcessingId(matchId);
      setError('');
      await sendMatchReminder(matchId);
      setEmailSuccess('Match reminder sent successfully!');
      setTimeout(() => setEmailSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send match reminder');
      console.error('Error sending match reminder:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') {
      return requests;
    }
    return requests.filter(req => req.status === filter);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      reschedule: 'bg-blue-100 text-blue-800',
      walkover: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${typeColors[type]}`}>
        {type === 'reschedule' ? 'Reschedule' : 'Walkover'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredRequests = getFilteredRequests();
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Player Requests</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Send Email
          </button>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {emailSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {emailSuccess}
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('accepted')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'accepted'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Accepted ({acceptedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({requests.length})
        </button>
      </div>

      {/* Requests list */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No {filter !== 'all' ? filter : ''} requests found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'pending' 
              ? 'All requests have been processed'
              : 'No requests to display'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              {/* Request header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {getTypeBadge(request.type)}
                  {getStatusBadge(request.status)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(request.createdAt)}
                </div>
              </div>

              {/* Player information */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-600 mb-1">Requested by</div>
                <div className="text-gray-900">
                  {request.playerId?.name}
                  <span className="text-gray-500 text-sm ml-2">({request.playerId?.email})</span>
                </div>
              </div>

              {/* Match information */}
              {request.matchId && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Match Details</div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>
                      <strong>Category:</strong> {request.matchId.categoryId?.name}
                    </div>
                    <div>
                      <strong>Stage:</strong> {request.matchId.stageName}
                      {request.matchId.roundName && ` - ${request.matchId.roundName}`}
                    </div>
                    <div>
                      <strong>Players:</strong> {request.matchId.players?.[0]?.name} vs {request.matchId.players?.[1]?.name}
                    </div>
                    <div>
                      <strong>Scheduled:</strong> {formatDate(request.matchId.schedule?.date)}
                      {request.matchId.schedule?.time && ` at ${request.matchId.schedule.time}`}
                    </div>
                    {request.matchId.schedule?.courtNumber && (
                      <div>
                        <strong>Court:</strong> {request.matchId.schedule.courtNumber}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Request note */}
              {request.note && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Note</div>
                  <div className="text-gray-700 italic bg-blue-50 p-3 rounded border border-blue-100">
                    "{request.note}"
                  </div>
                </div>
              )}

              {/* Action buttons for pending requests */}
              {request.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => setConfirmAction({ 
                      requestId: request._id, 
                      action: 'accept',
                      type: request.type 
                    })}
                    disabled={processingId === request._id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === request._id ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => setConfirmAction({ 
                      requestId: request._id, 
                      action: 'reject',
                      type: request.type 
                    })}
                    disabled={processingId === request._id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === request._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}

              {/* Send match reminder button */}
              {request.matchId && request.matchId.status === 'scheduled' && (
                <div className="pt-4 border-t mt-4">
                  <button
                    onClick={() => handleSendMatchReminder(request.matchId._id)}
                    disabled={processingId === request.matchId._id}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {processingId === request.matchId._id ? 'Sending...' : '📧 Send Match Reminder'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm {confirmAction.action === 'accept' ? 'Accept' : 'Reject'}
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to {confirmAction.action} this {confirmAction.type} request?
              {confirmAction.action === 'accept' && confirmAction.type === 'walkover' && (
                <span className="block mt-2 text-orange-600 font-semibold">
                  This will mark the match as a walkover and declare the opponent as the winner.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.action === 'accept') {
                    handleAccept(confirmAction.requestId);
                  } else {
                    handleReject(confirmAction.requestId);
                  }
                }}
                className={`flex-1 px-4 py-2 rounded-md text-white transition-colors ${
                  confirmAction.action === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email notification modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Send Email Notification
            </h3>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients (comma-separated emails)
                </label>
                <input
                  type="text"
                  value={emailForm.recipients}
                  onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                  placeholder="player1@example.com, player2@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter email addresses separated by commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Tournament Update"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Enter your message here..."
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              {emailSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                  {emailSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailForm({ recipients: '', subject: '', message: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? 'Sending...' : 'Send Emails'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPanel;
