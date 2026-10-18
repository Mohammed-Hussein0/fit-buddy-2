import React from 'react';

/**
 * Prevents typing negative signs ('-') or exponent ('e', 'E') in number/text inputs for weights, reps, measurements, etc.
 */
export const preventMinusKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (
    e.key === '-' ||
    e.key === 'Minus' ||
    e.code === 'Minus' ||
    e.code === 'NumpadSubtract' ||
    e.key === 'e' ||
    e.key === 'E' ||
    e.key === '+' ||
    e.key === 'Add' ||
    e.code === 'NumpadAdd'
  ) {
    e.preventDefault();
  }
};

/**
 * Strips any minus signs, negative indicators, and non-numeric characters.
 * Handles pasted inputs and edge cases.
 * 
 * @param value The raw input string
 * @param allowDecimals Whether to allow a decimal point (true for weights/measurements, false for reps/age/steps)
 * @returns Sanitized positive string
 */
export function sanitizePositiveNumber(value: string, allowDecimals = true): string {
  if (!value) return '';

  // Remove any minus signs and negative symbols
  let cleaned = value.replace(/[-+eE]/g, '');

  if (allowDecimals) {
    // Only allow numbers and decimal dots
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    // Ensure at most one decimal point exists
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
  } else {
    // Only integers
    cleaned = cleaned.replace(/[^0-9]/g, '');
  }

  return cleaned;
}
