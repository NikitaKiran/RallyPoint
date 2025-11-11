import React, { useState } from 'react';

const StageBuilder = ({ stages, onStagesChange }) => {
  const [currentStage, setCurrentStage] = useState({
    name: '',
    format: 'knockout',
    groupCount: 1,
    advancementRules: ''
  });

  const handleStageChange = (e) => {
    const { name, value } = e.target;
    setCurrentStage(prev => ({
      ...prev,
      [name]: name === 'groupCount' ? parseInt(value) || 1 : value
    }));
  };

  const addStage = () => {
    if (!currentStage.name.trim()) {
      alert('Stage name is required');
      return;
    }

    onStagesChange([...stages, { ...currentStage }]);
    setCurrentStage({
      name: '',
      format: 'knockout',
      groupCount: 1,
      advancementRules: ''
    });
  };

  const removeStage = (index) => {
    onStagesChange(stages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Add Stage</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Stage Name</label>
            <input
              type="text"
              name="name"
              value={currentStage.name}
              onChange={handleStageChange}
              placeholder="e.g., Quarterfinals, Group Stage"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Format</label>
            <select
              name="format"
              value={currentStage.format}
              onChange={handleStageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="knockout">Knockout</option>
              <option value="round_robin">Round Robin</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {currentStage.format === 'round_robin' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Number of Groups</label>
              <input
                type="number"
                name="groupCount"
                value={currentStage.groupCount}
                onChange={handleStageChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Advancement Rules (optional)</label>
            <input
              type="text"
              name="advancementRules"
              value={currentStage.advancementRules}
              onChange={handleStageChange}
              placeholder="e.g., Top 2 from each group advance"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={addStage}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Add Stage
          </button>
        </div>
      </div>

      {stages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Stages ({stages.length})</h4>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-center justify-between bg-white border border-gray-300 rounded-md p-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{stage.name}</p>
                  <p className="text-sm text-gray-600">
                    Format: {stage.format.replace('_', ' ')}
                    {stage.format === 'round_robin' && ` (${stage.groupCount} groups)`}
                  </p>
                  {stage.advancementRules && (
                    <p className="text-sm text-gray-500">{stage.advancementRules}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeStage(index)}
                  className="ml-4 text-red-600 hover:text-red-800 focus:outline-none"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StageBuilder;
