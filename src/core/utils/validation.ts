/**
 * Input validation utilities for user inputs
 * Provides sanitization and validation functions
 */

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string, maxLength?: number): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  let sanitized = input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();

  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a string contains only alphanumeric characters and common punctuation
 */
export function isValidTextContent(text: string, maxLength?: number): boolean {
  if (typeof text !== 'string') {
    return false;
  }

  if (maxLength && text.length > maxLength) {
    return false;
  }

  // Allow alphanumeric, spaces, and common punctuation
  const validPattern = /^[a-zA-Z0-9\s.,!?;:'"()-]+$/;
  return validPattern.test(text);
}

/**
 * Validate prompt input to prevent prompt injection
 */
export function sanitizePrompt(prompt: string, maxLength = 5000): string {
  if (typeof prompt !== 'string') {
    return '';
  }

  // Remove common prompt injection patterns
  let sanitized = prompt
    .replace(/ignore\s+(previous|above|all)\s+instructions/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/user\s*:/gi, '')
    .replace(/assistant\s*:/gi, '')
    .replace(/```/g, '')
    .trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate character name
 */
export function validateCharacterName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Character name is required' };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Character name cannot be empty' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Character name must be 50 characters or less' };
  }

  if (!/^[a-zA-Z0-9\s'-]+$/.test(trimmed)) {
    return { valid: false, error: 'Character name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Validate story location
 */
export function validateLocation(location: string): { valid: boolean; error?: string } {
  if (!location || typeof location !== 'string') {
    return { valid: false, error: 'Location is required' };
  }

  const trimmed = location.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Location cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Location must be 100 characters or less' };
  }

  return { valid: true };
}

/**
 * Validate and sanitize chapter content
 */
export function sanitizeChapterContent(content: string): string {
  if (typeof content !== 'string') {
    return '';
  }

  // Remove HTML tags but preserve newlines
  let sanitized = content
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();

  // Limit to reasonable length (50,000 characters max)
  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000);
  }

  return sanitized;
}

/**
 * Validate request payload structure
 */
export function validateRequestPayload(payload: unknown): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid payload format' };
  }

  // Check for prototype pollution
  if (payload.constructor !== Object) {
    return { valid: false, error: 'Invalid payload type' };
  }

  return { valid: true };
}
