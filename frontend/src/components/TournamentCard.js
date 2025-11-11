import React from 'react';
import { useNavigate } from 'react-router-dom';

const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClick = () => {
    navigate(`/tournaments/${tournament._id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{tournament.name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
        </span>
      </div>

      {tournament.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tournament.description}</p>
      )}

      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center">
          <span className="font-medium mr-2">Code:</span>
          <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tournament.code}</span>
        </div>
        
        <div className="flex items-center">
          <span className="font-medium mr-2">Dates:</span>
          <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
        </div>

        <div className="flex items-center">
          <span className="font-medium mr-2">Courts:</span>
          <span>{tournament.numberOfCourts}</span>
        </div>

        {tournament.organiserId && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Organiser:</span>
            <span>{tournament.organiserId.name || tournament.organiserId.email}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentCard;
