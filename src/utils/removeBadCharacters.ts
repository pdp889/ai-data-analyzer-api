/**
 * Removes markdown formatting and special characters from text
 * @param text The text to clean
 * @returns The cleaned text with markdown and special characters removed
 */
export function removeMarkdown(text: string): string {
    if (!text) return '';
  
    return text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove headers
      .replace(/^#+\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*|\*|__|_/g, '')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim();
  }
  
  /**
   * Removes all non-printable characters and other problematic characters
   * @param text The text to clean
   * @returns The cleaned text with only printable characters
   */
  export function removeNonPrintableCharacters(text: string): string {
    if (!text) return '';
  
    return text
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      // Remove zero-width spaces and other invisible characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Remove emojis and other special characters
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim();
  }
  
  /**
   * Combines both markdown and non-printable character removal
   * @param text The text to clean
   * @returns The cleaned text with markdown and non-printable characters removed
   */
  export function cleanText(text: string): string {
    if (!text) return '';
    
    return removeNonPrintableCharacters(removeMarkdown(text));
  }