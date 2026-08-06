const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Invalid email or password',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password must be at least 6 characters',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/unauthorized-domain': 'This domain is not authorized for Firebase authentication.',
  'auth/internal-error': 'Something went wrong. Please try again.',
}

export function getAuthErrorMessage(error, fallback) {
  if (error && error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code]
  }
  return fallback || 'Something went wrong. Please try again.'
}
