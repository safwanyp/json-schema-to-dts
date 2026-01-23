/**
 * Utility functions for naming conventions and string transformations.
 */

/**
 * Converts a string to PascalCase.
 * Handles kebab-case, snake_case, spaces, and other non-alphanumeric separators.
 *
 * @param str - The input string to convert
 * @returns The string converted to PascalCase
 *
 * @example
 * toPascalCase('user-profile') // => 'UserProfile'
 * toPascalCase('user_name') // => 'UserName'
 * toPascalCase('API response') // => 'ApiResponse'
 */
export const toPascalCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .replace(/(?:^|\s)(\w)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, '');
};
