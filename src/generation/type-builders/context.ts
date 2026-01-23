/**
 * Shared context for type building operations.
 */

import { JsonSchema } from '../../types';
import { TypeNameRegistry } from '../../registry';

/**
 * Context passed to type builders containing all necessary information
 * for generating TypeScript types from JSON Schema.
 */
export interface TypeBuildContext {
  /** The current schema fragment being processed */
  schema: JsonSchema;

  /** The root schema document (for resolving $ref) */
  rootSchema: JsonSchema;

  /** Registry for looking up and registering type names */
  registry?: TypeNameRegistry;

  /** The JSON pointer path to this schema fragment */
  pointer: string;

  /** Whether to look up this pointer in the registry */
  lookupInRegistry: boolean;
}

/**
 * Creates a new context for a child schema.
 *
 * @param parent - The parent context
 * @param schema - The child schema
 * @param pointerSuffix - The suffix to append to the parent's pointer
 * @returns A new context for the child schema
 */
export const createChildContext = (
  parent: TypeBuildContext,
  schema: JsonSchema,
  pointerSuffix: string
): TypeBuildContext => ({
  schema,
  rootSchema: parent.rootSchema,
  registry: parent.registry,
  pointer: `${parent.pointer}/${pointerSuffix}`,
  lookupInRegistry: true,
});
