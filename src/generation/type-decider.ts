/**
 * Logic for deciding between `type` alias and `interface` declarations.
 */

import { JsonSchema } from '../types';

/**
 * Parameters for deciding the type declaration keyword.
 */
export interface ShouldUseTypeAliasParams {
  /** The JSON Schema being processed */
  schema: JsonSchema;

  /** The generated TypeScript type string (RHS of the assignment) */
  typeDefinition: string;
}

/**
 * Determines whether to use a `type` alias or an `interface` for the generated definition.
 *
 * The decision is made automatically based on TypeScript's capabilities and best practices:
 *
 * Forces `type` for:
 * - Enums (`enum`) and Constants (`const`)
 * - Primitives (string, number, boolean, null)
 * - Arrays (`type[]`)
 * - Unions (`|`), Intersections (`&`), and Combinators (oneOf, anyOf, allOf)
 * - Mapped types (Record<string, any>) or types not starting with `{`
 *
 * Uses `interface` for:
 * - Standard objects with properties (unless they involve intersections)
 *
 * @param params - The decision parameters
 * @returns True if `type` should be used, false if `interface` should be used
 */
export const shouldUseTypeAlias = ({
  schema,
  typeDefinition,
}: ShouldUseTypeAliasParams): boolean => {
  // Enum and const must be type aliases
  if (schema.enum || schema.const !== undefined) {
    return true;
  }

  // Primitives must be type aliases
  if (['string', 'number', 'boolean', 'array'].includes(schema.type as string)) {
    return true;
  }

  // Type arrays (e.g., ["string", "null"]) must be type aliases
  if (Array.isArray(schema.type)) {
    return true;
  }

  // Combinators must be type aliases
  if (schema.oneOf || schema.anyOf || schema.allOf) {
    return true;
  }

  // Intersections must be type aliases
  if (typeDefinition.includes(' & ')) {
    return true;
  }

  // Non-object types or types not starting with { must be type aliases
  if (schema.type !== 'object' || !typeDefinition.startsWith('{')) {
    return true;
  }

  // Default to interface for objects with properties
  return false;
};

/**
 * Gets the appropriate keyword and separator for a type declaration.
 *
 * @param isTypeAlias - Whether to use `type` or `interface`
 * @returns Object with keyword and separator
 */
export const getDeclarationParts = (
  isTypeAlias: boolean
): { keyword: string; separator: string } => {
  return {
    keyword: isTypeAlias ? 'type' : 'interface',
    separator: isTypeAlias ? ' = ' : ' ',
  };
};
