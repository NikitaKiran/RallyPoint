import React, { useState, useEffect } from 'react';
import { getCategoryRegistrations, deleteRegistration } from '../services/registrationService';
import CSVUploader from './CSVUploader';

const PlayerManagement = ({ tournamentId, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [registrationStats, setRegistrationStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCSVUploader, setShowCSVUploader] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      loadRegistrations(selectedCategory._id);
    }
  }, [selectedCategory]);

  const loadRegistrations = async (categoryId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getCategoryRegistrations(categoryId);
      setRegistrations(response.data.registrations);
      setRegistrationStats({
        count: response.data.count,
        limit: response.data.limit
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to remove this registration?')) {
      return;
    }

    try {
      await deleteRegistration(registrationId);
      // Reload registrations
      loadRegistrations(selectedCategory._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete registration');
    }
  };

  const handleUploadComplete = (summary) => {
    // Optionally reload registrations if a category is selected
    if (selectedCategory) {
      loadRegistrations(selectedCategory._id);
    }
  };

  return (
    <div className="space-y-6">
      {/* CSV Uploader Section */}
      <div>
        <button
          onClick={() => setShowCSVUploader(!showCSVUploader)}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          {showCSVUploader ? 'Hide CSV Uploader' : 'Import Players from CSV'}
        </button>

        {showCSVUploader && (
          <CSVUploader onUploadComplete={handleUploadComplete} />
        )}
      </div>

      {/* Player Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Player Management</h2>

      {!selectedCategory ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Select a Category</h3>
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category._id}
                className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{category.name}</h4>
                    {category.isTeamEvent && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mt-1">
                        Team Event
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {category.registrationLimit && (
                      <p className="text-sm text-gray-600">
                        Limit: {category.registrationLimit}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Back to categories
          </button>

          <div className="mb-4">
            <h3 className="text-xl font-semibold">{selectedCategory.name}</h3>
            <p className="text-gray-600">
              Registrations: {registrationStats.count}
              {registrationStats.limit && ` / ${registrationStats.limit}`}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No registrations yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    {selectedCategory.isTeamEvent && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team Members
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr key={registration._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {registration.playerId.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {registration.playerId.email}
                          </div>
                        </div>
                      </td>
                      {selectedCategory.isTeamEvent && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {registration.teamName || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {registration.teamMembers && registration.teamMembers.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {registration.teamMembers.map((member, idx) => (
                                    <li key={idx}>{member.name}</li>
                                  ))}
                                </ul>
                              ) : (
                                '-'
                              )}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(registration.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteRegistration(registration._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default PlayerManagement;
