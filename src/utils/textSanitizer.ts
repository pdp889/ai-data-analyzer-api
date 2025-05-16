/**
 * Sanitizes text by removing markdown characters, normalizing whitespace,
 * and cleaning up formatting.
 *
 * @param text - The text to sanitize
 * @returns The sanitized text
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[#*_`]/g, '') // Remove markdown characters
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to max 2
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\n\s*\n/g, '\n\n'); // Normalize empty lines
};
