// Application constants and configuration

// Navigation sections
export const DASHBOARD_SECTIONS = [
  { key: 'topup', label: 'Points Top-up', icon: '💰' },
  { key: 'expense', label: 'Expense Tracking', icon: '📊' },
  { key: 'balance', label: 'Points Balance', icon: '💳' },
  { key: 'support', label: 'Support Request', icon: '❓' },
  { key: 'password', label: 'Change Password', icon: '🔒' },
];

// Payment methods configuration
export const PAYMENT_METHODS = {
  GCash: {
    name: 'GCash',
    accountNumber: '0917 123 4567',
    logo: '/src/design/Gcash.png'
  },
  UnionBank: {
    name: 'UnionBank',
    accountNumber: '1234-5678-9012',
    logo: '/src/design/unionbank.png'
  }
};

// Support categories
export const SUPPORT_CATEGORIES = [
  'Account',
  'Payments',
  'Technical',
  'Other'
];

// Time filters for expense tracking
export const TIME_FILTERS = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Daily', label: 'Daily' }
];

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  STUDENT_ID: /^\d{6,12}$/,
  PASSWORD_MIN_LENGTH: 6,
  MESSAGE_MIN_LENGTH: 10
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_STUDENT_ID: 'Enter a valid 6-12 digit ID number',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  MESSAGE_TOO_SHORT: 'Please provide a brief description (min 10 characters)',
  TERMS_REQUIRED: 'You must agree to the terms and conditions',
  DATA_PROCESSING_REQUIRED: 'You must authorize data processing',
  LOGIN_FAILED: 'Login failed. Please try again.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  PAYMENT_SUBMISSION_FAILED: 'Payment submission failed. Please try again.',
  SUPPORT_SUBMISSION_FAILED: 'Support request submission failed. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Account created successfully!',
  LOGIN_SUCCESS: 'Login successful!',
  PAYMENT_SUBMITTED: 'Payment submitted successfully!',
  SUPPORT_SUBMITTED: 'Support request submitted successfully!',
  PASSWORD_RESET_SENT: 'Password reset email sent!'
};

// Default values
export const DEFAULT_VALUES = {
  USER_ROLE: 'student',
  ADMIN_ROLE: 'admin',
  DEFAULT_BALANCE: '100.00',
  DEFAULT_PAYMENT_AMOUNT: '500.00'
};

// Direct exports for commonly used values
export const DEFAULT_BALANCE = DEFAULT_VALUES.DEFAULT_BALANCE;
export const USER_ROLE = DEFAULT_VALUES.USER_ROLE;
export const ADMIN_ROLE = DEFAULT_VALUES.ADMIN_ROLE;

// API endpoints (for future backend integration)
export const API_ENDPOINTS = {
  USERS: '/api/users',
  PAYMENTS: '/api/payments',
  TRANSACTIONS: '/api/transactions',
  SUPPORT: '/api/support'
};
