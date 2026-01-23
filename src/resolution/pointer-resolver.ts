/**
 * JSON Pointer resolution utilities.
 * Handles resolving JSON Pointers (RFC 6901) within JSON Schema documents.
 */

import { JsonSchema } from '../types';

/**
 * Parameters for resolving a JSON Pointer.
 */
export interface ResolvePointerParams {
  /** The root schema document */
  root: JsonSchema;
  /** The JSON Pointer to resolve (e.g., "#/definitions/User") */
  pointer: string;
}

/**
 * Resolves a JSON Pointer to a schema fragment within a root schema.
 *
 * @param params - The resolution parameters
 * @returns The resolved schema fragment, or null if not found
 *
 * @example
 * const user = resolvePointer({
 *   root: schema,
 *   pointer: '#/definitions/User'
 * });
 */
export const resolvePointer = ({
  root,
  pointer,
}: ResolvePointerParams): JsonSchema | null => {
  if (pointer === '#') return root;

  // Remove #/ prefix and split into path segments
  const pathParts = pointer.replace(/^#\//, '').split('/');
  let current: unknown = root;

  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return current as JsonSchema;
};

/**
 * Parameters for resolving a $ref to its target schema.
 */
export interface ResolveRefParams {
  /** The $ref value (e.g., "#/definitions/User") */
  ref: string;
  /** The root schema document */
  rootSchema: JsonSchema;
}

/**
 * Resolves a $ref string to its target schema object.
 * Supports #/definitions/, #/$defs/, and arbitrary JSON Pointer paths.
 *
 * @param params - The resolution parameters
 * @returns The resolved schema object, or an empty object if not found
 *
 * @example
 * const userSchema = resolveRef({
 *   ref: '#/definitions/User',
 *   rootSchema: schema
 * });
 */
export const resolveRef = ({ ref, rootSchema }: ResolveRefParams): JsonSchema => {
  // Handle #/definitions/ shorthand
  if (ref.startsWith('#/definitions/')) {
    return rootSchema.definitions?.[ref.replace('#/definitions/', '')] || {};
  }

  // Handle #/$defs/ shorthand
  if (ref.startsWith('#/$defs/')) {
    return rootSchema.$defs?.[ref.replace('#/$defs/', '')] || {};
  }

  // Handle arbitrary JSON Pointer paths
  if (ref.startsWith('#/')) {
    const result = resolvePointer({ root: rootSchema, pointer: ref });
    return result || {};
  }

  return {};
};
