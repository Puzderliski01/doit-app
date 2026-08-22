/**
 * Validation utilities for forms
 */

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 simplified regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  if (!isValidEmail(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  return { valid: true };
}

export function validateTaskTitle(title: string): { valid: boolean; error?: string } {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Task title is required' };
  }

  if (title.trim().length < 3) {
    return { valid: false, error: 'Task title must be at least 3 characters' };
  }

  return { valid: true };
}
