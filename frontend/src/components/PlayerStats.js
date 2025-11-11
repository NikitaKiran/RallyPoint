import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PlayerStats = ({ statistics, player }) => {
  if (!statistics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No statistics available
      </div>
    );
  }

  // Prepare data for win/loss pie chart
  const winLossData = [
    { name: 'Wins', value: statistics.wins, color: '#10b981' },
    { name: 'Losses', value: statistics.losses, color: '#ef4444' }
  ];

  // Prepare data for sets bar chart
  const setsData = [
    { name: 'Sets Won', value: statistics.setsWon, color: '#3b82f6' },
    { name: 'Sets Lost', value: statistics.setsLost, color: '#f59e0b' }
  ];

  // Prepare data for points bar chart
  const pointsData = [
    { name: 'Points Won', value: statistics.pointsWon, color: '#8b5cf6' },
    { name: 'Points Lost', value: statistics.pointsLost, color: '#ec4899' }
  ];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Player Info */}
      {player && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{player.name}</h3>
          <p className="text-gray-600">{player.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {player.role}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-semibold text-gray-600 mb-1">Total Matches</div>
          <div className="text-3xl font-bold text-gray-800">{statistics.totalMatches}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-semibold text-gray-600 mb-1">Win Rate</div>
          <div className="text-3xl font-bold text-green-600">{statistics.winRate}%</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-semibold text-gray-600 mb-1">Wins / Losses</div>
          <div className="text-3xl font-bold text-gray-800">
            <span className="text-green-600">{statistics.wins}</span>
            {' / '}
            <span className="text-red-600">{statistics.losses}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-semibold text-gray-600 mb-1">Sets Won / Lost</div>
          <div className="text-3xl font-bold text-gray-800">
            <span className="text-blue-600">{statistics.setsWon}</span>
            {' / '}
            <span className="text-orange-600">{statistics.setsLost}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {statistics.totalMatches > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win/Loss Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Win/Loss Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Sets Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Sets Performance</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={setsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6">
                  {setsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Points Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Points Performance</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6">
                  {pointsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Detailed Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Total Points Won</span>
            <span className="font-semibold text-gray-800">{statistics.pointsWon}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Total Points Lost</span>
            <span className="font-semibold text-gray-800">{statistics.pointsLost}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Point Difference</span>
            <span className={`font-semibold ${statistics.pointsWon - statistics.pointsLost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statistics.pointsWon - statistics.pointsLost >= 0 ? '+' : ''}
              {statistics.pointsWon - statistics.pointsLost}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Set Difference</span>
            <span className={`font-semibold ${statistics.setsWon - statistics.setsLost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statistics.setsWon - statistics.setsLost >= 0 ? '+' : ''}
              {statistics.setsWon - statistics.setsLost}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
