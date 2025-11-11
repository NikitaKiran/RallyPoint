/**
 * Error handling utilities for frontend
 */

/**
 * Extract error message from API error response
 * @param {Error} error - Axios error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Network error (no response from server)
  if (!error.response) {
    if (error.request) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  const { status, data } = error.response;

  // Handle specific status codes
  switch (status) {
    case 400:
      // Bad Request - validation errors
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map(err => err.message).join(', ');
      }
      return data.error || data.message || 'Invalid request. Please check your input.';

    case 401:
      return 'Your session has expired. Please log in again.';

    case 403:
      return 'You do not have permission to perform this action.';

    case 404:
      return data.error || 'The requested resource was not found.';

    case 409:
      return data.error || 'This resource already exists.';

    case 422:
      // Validation error with detailed errors
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
      }
      return data.error || 'Validation failed. Please check your input.';

    case 500:
      return 'A server error occurred. Please try again later.';

    case 503:
      return 'The service is temporarily unavailable. Please try again later.';

    default:
      return data.error || data.message || 'An error occurred. Please try again.';
  }
};

/**
 * Log error for debugging
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 Error ${context ? `in ${context}` : ''}`);
    console.error('Error:', error);
    if (error.response) {
      console.error('Response:', error.response);
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.groupEnd();
  }

  // In production, you could send this to an error tracking service
  // Example: Sentry.captureException(error, { tags: { context } });
};

/**
 * Handle API error with toast notification
 * @param {Error} error - Axios error object
 * @param {Function} showToast - Toast notification function
 * @param {string} context - Context where error occurred
 */
export const handleApiError = (error, showToast, context = '') => {
  const message = getErrorMessage(error);
  logError(error, context);
  
  if (showToast) {
    showToast(message, 'error');
  }
  
  return message;
};

/**
 * Format validation errors for display
 * @param {Array} errors - Array of validation error objects
 * @returns {Object} Formatted errors by field
 */
export const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors)) return {};
  
  return errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
};

/**
 * Check if error is a network error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * Check if error is a validation error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  return error.response?.status === 422 || error.response?.status === 400;
};

/**
 * Retry function for failed requests
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise}
 */
export const retryRequest = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isNetworkError(error)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};
