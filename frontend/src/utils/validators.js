// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  
  return null;
};

// Password confirmation validation
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return null;
};

// Name validation
export const validateName = (name) => {
  if (!name) {
    return 'Name is required';
  }
  
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }
  
  return null;
};

// Date validation
export const validateDate = (date) => {
  if (!date) {
    return 'Date is required';
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Please enter a valid date';
  }
  
  return null;
};

// Date range validation
export const validateDateRange = (startDate, endDate) => {
  const startError = validateDate(startDate);
  if (startError) {
    return startError;
  }
  
  const endError = validateDate(endDate);
  if (endError) {
    return endError;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'End date must be after start date';
  }
  
  return null;
};

// Future date validation
export const validateFutureDate = (date) => {
  const dateError = validateDate(date);
  if (dateError) {
    return dateError;
  }
  
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateObj < today) {
    return 'Date must be in the future';
  }
  
  return null;
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  
  return null;
};

// Number validation
export const validateNumber = (value, min = null, max = null) => {
  if (value === '' || value === null || value === undefined) {
    return 'Please enter a number';
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return 'Please enter a valid number';
  }
  
  if (min !== null && num < min) {
    return `Value must be at least ${min}`;
  }
  
  if (max !== null && num > max) {
    return `Value must be at most ${max}`;
  }
  
  return null;
};

// Positive number validation
export const validatePositiveNumber = (value) => {
  const error = validateNumber(value, 1);
  if (error) {
    return error;
  }
  
  return null;
};

// Tournament code validation
export const validateTournamentCode = (code) => {
  if (!code) {
    return 'Tournament code is required';
  }
  
  if (code.length !== 6) {
    return 'Tournament code must be 6 characters';
  }
  
  const codeRegex = /^[A-Z0-9]{6}$/;
  if (!codeRegex.test(code)) {
    return 'Tournament code must contain only uppercase letters and numbers';
  }
  
  return null;
};

// URL validation
export const validateUrl = (url) => {
  if (!url) {
    return null; // URL is optional
  }
  
  try {
    new URL(url);
    return null;
  } catch (e) {
    return 'Please enter a valid URL';
  }
};

// Phone number validation (basic)
export const validatePhone = (phone) => {
  if (!phone) {
    return null; // Phone is optional
  }
  
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  if (phone.replace(/\D/g, '').length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  
  return null;
};

// Generic form validation
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const validators = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    
    for (const validator of validators) {
      const error = validator(values[field], values);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return errors;
};

// Check if form has errors
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
