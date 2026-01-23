/**
 * JSDoc comment generation for TypeScript types.
 */

import { JsonSchema } from '../types';

/**
 * Generates a JSDoc comment block from schema metadata.
 * Includes title, description, and examples.
 *
 * @param schema - The JSON Schema containing metadata
 * @returns The JSDoc comment string (empty string if no metadata)
 *
 * @example
 * generateJSDoc({
 *   title: 'User',
 *   description: 'A user object',
 *   examples: [{ id: '123' }]
 * })
 * // Returns:
 * // /**
 * //  * User
 * //  *
 * //  * A user object
 * //  *
 * //  * @example
 * //  * { "id": "123" }
 * //  *\/
 */
export const generateJSDoc = (schema: JsonSchema): string => {
  const lines: string[] = [];

  if (schema.title) {
    lines.push(schema.title);
  }

  if (schema.description) {
    if (lines.length > 0) {
      lines.push('');
    }
    lines.push(schema.description);
  }

  if (schema.examples && schema.examples.length > 0) {
    lines.push('');
    lines.push('@example');
    lines.push(JSON.stringify(schema.examples[0], null, 2));
  }

  if (lines.length === 0) {
    return '';
  }

  return '/**\n * ' + lines.join('\n * ') + '\n */\n';
};
