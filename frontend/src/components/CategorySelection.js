import React, { useState } from 'react';
import { createRegistration } from '../services/registrationService';

const CategorySelection = ({ tournament, categories, onRegistrationComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ playerId: '', name: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setError('');
    setSuccess('');
    setTeamName('');
    setTeamMembers([{ playerId: '', name: '' }]);
  };

  const handleAddTeamMember = () => {
    setTeamMembers([...teamMembers, { playerId: '', name: '' }]);
  };

  const handleRemoveTeamMember = (index) => {
    const newMembers = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(newMembers);
  };

  const handleTeamMemberChange = (index, field, value) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const registrationData = {
        categoryId: selectedCategory._id
      };

      if (selectedCategory.isTeamEvent) {
        if (!teamName.trim()) {
          throw new Error('Team name is required');
        }
        if (teamMembers.some(m => !m.name.trim())) {
          throw new Error('All team member names are required');
        }

        registrationData.teamName = teamName;
        registrationData.teamMembers = teamMembers;
      }

      await createRegistration(registrationData);
      setSuccess('Registration successful!');
      
      setTimeout(() => {
        if (onRegistrationComplete) {
          onRegistrationComplete();
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{tournament.name}</h2>
        <p className="text-gray-600">Code: {tournament.code}</p>
        <p className="text-gray-600">
          {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
        </p>
      </div>

      {!selectedCategory ? (
        <div>
          <h3 className="text-xl font-semibold mb-4">Select a Category</h3>
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category._id}
                className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                onClick={() => handleCategorySelect(category)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{category.name}</h4>
                    {category.isTeamEvent && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mt-1">
                        Team Event
                      </span>
                    )}
                    {category.eligibilityCriteria && (
                      <p className="text-sm text-gray-600 mt-2">
                        Eligibility: {category.eligibilityCriteria}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {category.cashPrize > 0 && (
                      <p className="text-green-600 font-semibold">
                        ${category.cashPrize}
                      </p>
                    )}
                    {category.registrationLimit && (
                      <p className="text-sm text-gray-500 mt-1">
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

          <h3 className="text-xl font-semibold mb-4">Register for {selectedCategory.name}</h3>

          <form onSubmit={handleSubmit}>
            {selectedCategory.isTeamEvent && (
              <>
                <div className="mb-4">
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Members *
                  </label>
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Member name"
                        value={member.name}
                        onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      {teamMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Team Member
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategorySelection;
