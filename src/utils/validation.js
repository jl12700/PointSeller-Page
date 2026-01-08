import { VALIDATION_PATTERNS, ERROR_MESSAGES } from '../Constants';

// Generic validation functions
export const validateRequired = (value, fieldName) => {
  if (!value || !value.toString().trim()) {
    return `${fieldName} is required`;
  }
  return '';
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
  return '';
};

export const validateStudentId = (id, fieldName = 'ID number') => {
  if (!id || !id.trim()) {
    return `${fieldName} is required`;
  }
  if (!VALIDATION_PATTERNS.STUDENT_ID.test(id.trim())) {
    return ERROR_MESSAGES.INVALID_STUDENT_ID;
  }
  return '';
};

export const validatePassword = (password, confirmPassword = null) => {
  if (!password) {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }
  if (password.length < VALIDATION_PATTERNS.PASSWORD_MIN_LENGTH) {
    return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
  }
  if (confirmPassword !== null && password !== confirmPassword) {
    return ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
  }
  return '';
};

export const validateMessage = (message) => {
  if (!message || !message.trim()) {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }
  if (message.trim().length < VALIDATION_PATTERNS.MESSAGE_MIN_LENGTH) {
    return ERROR_MESSAGES.MESSAGE_TOO_SHORT;
  }
  return '';
};

export const validateCheckbox = (checked, fieldName) => {
  if (!checked) {
    return `${fieldName} is required`;
  }
  return '';
};

// Form-specific validation functions
export const validateRegistrationForm = (formData) => {
  const errors = {};

  // Basic fields
  errors.firstName = validateRequired(formData.firstName, 'First name');
  errors.lastName = validateRequired(formData.lastName, 'Last name');
  errors.email = validateEmail(formData.email);
  errors.password = validatePassword(formData.password, formData.confirmPassword);
  errors.confirmPassword = validatePassword(formData.confirmPassword);

  // Student fields
  errors.studentNumber = validateStudentId(formData.studentNumber, 'Student number');
  errors.idCardNumber = validateStudentId(formData.idCardNumber, 'ID card number');

  // Checkboxes
  errors.termsAccepted = validateCheckbox(formData.termsAccepted, 'Terms and conditions');
  errors.dataProcessingAccepted = validateCheckbox(formData.dataProcessingAccepted, 'Data processing authorization');

  // Remove empty errors
  return Object.fromEntries(
    Object.entries(errors).filter(([_, value]) => value !== '')
  );
};

export const validateLoginForm = (formData) => {
  const errors = {};

  errors.idNumber = validateStudentId(formData.idNumber, 'ID number');
  errors.password = validatePassword(formData.password);

  return Object.fromEntries(
    Object.entries(errors).filter(([_, value]) => value !== '')
  );
};

export const validatePaymentForm = (formData) => {
  const errors = {};

  errors.accountNumber = validateRequired(formData.accountNumber, 'Account number');
  errors.referenceNumber = validateRequired(formData.referenceNumber, 'Reference number');
  errors.proofOfPayment = formData.proofOfPayment ? '' : 'Proof of payment is required';

  return Object.fromEntries(
    Object.entries(errors).filter(([_, value]) => value !== '')
  );
};

export const validateSupportForm = (formData) => {
  const errors = {};

  errors.name = validateRequired(formData.name, 'Name');
  errors.studentId = validateStudentId(formData.studentId, 'Student ID');
  errors.message = validateMessage(formData.message);

  return Object.fromEntries(
    Object.entries(errors).filter(([_, value]) => value !== '')
  );
};

// Utility function to clear specific errors
export const clearFieldError = (errors, fieldName) => {
  if (errors[fieldName]) {
    const newErrors = { ...errors };
    delete newErrors[fieldName];
    return newErrors;
  }
  return errors;
};
