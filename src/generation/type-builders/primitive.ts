/**
 * Type builder for primitive JSON Schema types.
 * Handles string, number, integer, boolean, null, and unknown types.
 */

import { JsonSchema } from '../../types';

/**
 * Maps a JSON Schema type string to its TypeScript equivalent.
 *
 * @param jsonType - The JSON Schema type string
 * @returns The corresponding TypeScript type string
 *
 * @example
 * mapJsonTypeToTs('string')  // => 'string'
 * mapJsonTypeToTs('integer') // => 'number'
 * mapJsonTypeToTs('unknown') // => 'any'
 */
export const mapJsonTypeToTs = (jsonType: string): string => {
  switch (jsonType) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      return 'any[]';
    case 'object':
      return 'object';
    default:
      return 'any';
  }
};

/**
 * Checks if a schema represents a primitive type.
 *
 * @param schema - The JSON Schema to check
 * @returns True if the schema is a primitive type
 */
export const isPrimitiveType = (schema: JsonSchema): boolean => {
  const primitiveTypes = ['string', 'number', 'integer', 'boolean', 'null'];
  return typeof schema.type === 'string' && primitiveTypes.includes(schema.type);
};

/**
 * Builds a TypeScript type string for a primitive schema.
 *
 * @param schema - The JSON Schema with a primitive type
 * @returns The TypeScript type string
 */
export const buildPrimitiveType = (schema: JsonSchema): string => {
  if (typeof schema.type === 'string') {
    return mapJsonTypeToTs(schema.type);
  }
  return 'any';
};
