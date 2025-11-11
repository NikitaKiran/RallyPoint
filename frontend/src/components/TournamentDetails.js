import React, { useState, useEffect } from 'react';
import MatchCard from './MatchCard';
import DrawBracket from './DrawBracket';
import RoundRobinStandings from './RoundRobinStandings';
import Leaderboard from './Leaderboard';
import { getCategoryMatches } from '../services/matchService';
import { getTournamentLeaderboard } from '../services/statsService';

const TournamentDetails = ({ tournament, categories }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Fetch matches when active category changes
  useEffect(() => {
    if (categories[activeTab]) {
      fetchCategoryMatches(categories[activeTab]._id);
      // Set first stage as selected by default
      if (categories[activeTab].stages && categories[activeTab].stages.length > 0) {
        setSelectedStage(categories[activeTab].stages[0].name);
      }
    }
  }, [activeTab, categories]);

  // Fetch leaderboard when tournament changes
  useEffect(() => {
    if (tournament && tournament._id) {
      fetchLeaderboard();
    }
  }, [tournament]);

  const fetchCategoryMatches = async (categoryId) => {
    setLoadingMatches(true);
    try {
      const response = await getCategoryMatches(categoryId);
      setMatches(response.data.matches || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchLeaderboard = async (categoryId = null) => {
    setLoadingLeaderboard(true);
    try {
      const response = await getTournamentLeaderboard(tournament._id, categoryId);
      setLeaderboard(response.data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleCategoryLeaderboard = () => {
    if (categories[activeTab]) {
      fetchLeaderboard(categories[activeTab]._id);
      setShowLeaderboard(true);
    }
  };

  const getStageMatches = (stageName) => {
    return matches.filter(match => match.stageName === stageName);
  };

  const getStageFormat = (stageName) => {
    const category = categories[activeTab];
    if (!category || !category.stages) return null;
    
    const stage = category.stages.find(s => s.name === stageName);
    return stage?.format || null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
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

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Tournament Code</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{tournament.code}</p>
          </div>
        </div>

        {tournament.description && (
          <p className="text-gray-700 mb-4">{tournament.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 font-medium">Start Date</p>
            <p className="text-gray-900">{formatDate(tournament.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">End Date</p>
            <p className="text-gray-900">{formatDate(tournament.endDate)}</p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Number of Courts</p>
            <p className="text-gray-900">{tournament.numberOfCourts}</p>
          </div>
        </div>

        {tournament.organiserId && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Organised by: <span className="font-medium text-gray-900">
                {tournament.organiserId.name || tournament.organiserId.email}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>

        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No categories have been added yet.</p>
        ) : (
          <>
            {/* Category Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((category, index) => (
                  <button
                    key={category._id}
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                      activeTab === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Category Details */}
            {categories[activeTab] && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Event Type</p>
                    <p className="text-gray-900">
                      {categories[activeTab].isTeamEvent ? 'Team Event' : 'Singles Event'}
                    </p>
                  </div>

                  {categories[activeTab].eligibilityCriteria && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Eligibility</p>
                      <p className="text-gray-900">{categories[activeTab].eligibilityCriteria}</p>
                    </div>
                  )}

                  {categories[activeTab].registrationLimit && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Registration Limit</p>
                      <p className="text-gray-900">{categories[activeTab].registrationLimit}</p>
                    </div>
                  )}

                  {categories[activeTab].cashPrize > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Cash Prize</p>
                      <p className="text-gray-900">${categories[activeTab].cashPrize}</p>
                    </div>
                  )}
                </div>

                {/* Stages */}
                {categories[activeTab].stages && categories[activeTab].stages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-2">Stages</p>
                    <div className="space-y-2">
                      {categories[activeTab].stages.map((stage, stageIndex) => (
                        <div key={stageIndex} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                          <p className="font-medium text-gray-900">{stage.name}</p>
                          <p className="text-sm text-gray-600">
                            Format: {stage.format.replace('_', ' ').charAt(0).toUpperCase() + stage.format.replace('_', ' ').slice(1)}
                            {stage.format === 'round_robin' && stage.groupCount && ` (${stage.groupCount} groups)`}
                          </p>
                          {stage.advancementRules && (
                            <p className="text-sm text-gray-600 mt-1">{stage.advancementRules}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          {categories[activeTab] && (
            <button
              onClick={handleCategoryLeaderboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Show Category Leaderboard
            </button>
          )}
        </div>

        {loadingLeaderboard ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No leaderboard data available yet</p>
          </div>
        ) : (
          <Leaderboard 
            leaderboard={leaderboard} 
            title={showLeaderboard && categories[activeTab] 
              ? `${categories[activeTab].name} Leaderboard` 
              : 'Tournament Leaderboard'}
          />
        )}
      </div>

      {/* Matches and Results Section */}
      {categories[activeTab] && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Matches & Results</h2>

          {loadingMatches ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No matches scheduled yet</p>
            </div>
          ) : (
            <>
              {/* Stage Selector */}
              {categories[activeTab].stages && categories[activeTab].stages.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Stage
                  </label>
                  <select
                    value={selectedStage || ''}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories[activeTab].stages.map((stage, index) => (
                      <option key={index} value={stage.name}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedStage && (
                <>
                  {/* Show bracket for knockout format */}
                  {getStageFormat(selectedStage) === 'knockout' && (
                    <div className="mb-6">
                      <DrawBracket matches={getStageMatches(selectedStage)} />
                    </div>
                  )}

                  {/* Show standings for round robin format */}
                  {getStageFormat(selectedStage) === 'round_robin' && (
                    <div className="mb-6">
                      <RoundRobinStandings matches={getStageMatches(selectedStage)} />
                    </div>
                  )}

                  {/* Match List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">All Matches</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getStageMatches(selectedStage).map((match) => (
                        <MatchCard key={match._id} match={match} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;
