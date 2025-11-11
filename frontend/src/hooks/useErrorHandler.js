import { useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { handleApiError, getErrorMessage } from '../utils/errorHandler';

/**
 * Custom hook for handling errors with toast notifications
 * @returns {Object} Error handling functions
 */
const useErrorHandler = () => {
  const { showToast } = useToast();

  /**
   * Handle API error and show toast
   * @param {Error} error - Error object
   * @param {string} context - Context where error occurred
   * @returns {string} Error message
   */
  const handleError = useCallback((error, context = '') => {
    return handleApiError(error, showToast, context);
  }, [showToast]);

  /**
   * Get error message without showing toast
   * @param {Error} error - Error object
   * @returns {string} Error message
   */
  const getError = useCallback((error) => {
    return getErrorMessage(error);
  }, []);

  /**
   * Show error toast with custom message
   * @param {string} message - Error message
   */
  const showError = useCallback((message) => {
    showToast(message, 'error');
  }, [showToast]);

  /**
   * Show success toast
   * @param {string} message - Success message
   */
  const showSuccess = useCallback((message) => {
    showToast(message, 'success');
  }, [showToast]);

  /**
   * Show info toast
   * @param {string} message - Info message
   */
  const showInfo = useCallback((message) => {
    showToast(message, 'info');
  }, [showToast]);

  return {
    handleError,
    getError,
    showError,
    showSuccess,
    showInfo
  };
};

export default useErrorHandler;
