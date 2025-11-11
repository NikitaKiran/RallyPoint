import React, { useState } from 'react';
import StageBuilder from './StageBuilder';

const CategoryManager = ({ tournamentId, onCategoryCreated, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    isTeamEvent: false,
    eligibilityCriteria: '',
    registrationLimit: '',
    cashPrize: 0,
    stages: []
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'registrationLimit') ? 
              (value === '' ? '' : parseInt(value) || '') :
              (name === 'cashPrize') ?
              (value === '' ? 0 : parseInt(value) || 0) : value
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStagesChange = (stages) => {
    setFormData(prev => ({
      ...prev,
      stages
    }));
  };

  const validate = () => {
    const errors = {};
    
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    }
    
    if (formData.registrationLimit && formData.registrationLimit < 1) {
      errors.registrationLimit = 'Registration limit must be at least 1';
    }
    
    if (formData.cashPrize < 0) {
      errors.cashPrize = 'Cash prize cannot be negative';
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Prepare data for submission
    const categoryData = {
      ...formData,
      registrationLimit: formData.registrationLimit || null
    };
    
    onCategoryCreated(categoryData);
    
    // Reset form
    setFormData({
      name: '',
      isTeamEvent: false,
      eligibilityCriteria: '',
      registrationLimit: '',
      cashPrize: 0,
      stages: []
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Category Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Men's Singles, Women's Doubles"
        />
        {validationErrors.name && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isTeamEvent"
          name="isTeamEvent"
          checked={formData.isTeamEvent}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isTeamEvent" className="ml-2 block text-sm text-gray-700">
          Team Event
        </label>
      </div>

      <div>
        <label htmlFor="eligibilityCriteria" className="block text-sm font-medium text-gray-700 mb-1">
          Eligibility Criteria
        </label>
        <input
          type="text"
          id="eligibilityCriteria"
          name="eligibilityCriteria"
          value={formData.eligibilityCriteria}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Open to all, Age 18+, Intermediate level"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="registrationLimit" className="block text-sm font-medium text-gray-700 mb-1">
            Registration Limit
          </label>
          <input
            type="number"
            id="registrationLimit"
            name="registrationLimit"
            value={formData.registrationLimit}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave empty for no limit"
          />
          {validationErrors.registrationLimit && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.registrationLimit}</p>
          )}
        </div>

        <div>
          <label htmlFor="cashPrize" className="block text-sm font-medium text-gray-700 mb-1">
            Cash Prize ($)
          </label>
          <input
            type="number"
            id="cashPrize"
            name="cashPrize"
            value={formData.cashPrize}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {validationErrors.cashPrize && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.cashPrize}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stages (Hybrid Format)
        </label>
        <StageBuilder stages={formData.stages} onStagesChange={handleStagesChange} />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add Category
      </button>
    </form>
  );
};

export default CategoryManager;
