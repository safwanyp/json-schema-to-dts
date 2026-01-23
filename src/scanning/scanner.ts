/**
 * Main schema scanner that orchestrates the scanning process.
 * Performs multi-pass scanning to register types and resolve references.
 */

import { JsonSchema } from '../types';
import { TypeNameRegistry } from '../registry';
import { resolvePointer } from '../resolution';
import { toPascalCase } from '../utils';
import { traverse } from './traverser';

/**
 * Parameters for scanning a schema.
 */
export interface ScanSchemaParams {
  /** The schema to scan */
  schema: JsonSchema;

  /** The type name registry to populate */
  registry: TypeNameRegistry;

  /** The root pointer (defaults to '#') */
  rootPointer?: string;
}

/**
 * Scans a JSON Schema to identify and register all type definitions.
 * Performs three passes:
 * 1. Traverse and register explicit definitions
 * 2. Register missing references
 * 3. Cleanup redundant aliases
 *
 * @param params - The scan parameters
 */
export const scanSchema = ({
  schema,
  registry,
  rootPointer = '#',
}: ScanSchemaParams): void => {
  const references = new Set<string>();

  // Pass 1: Traverse and register explicit definitions
  traverse({
    schema,
    registry,
    references,
    pointer: rootPointer,
    suggestedName: '',
  });

  // Pass 2: Register missing references
  registerMissingReferences({ references, registry });

  // Pass 3: Cleanup redundant aliases
  cleanupRedundantAliases({ schema, registry });
};

/**
 * Parameters for registering missing references.
 */
interface RegisterMissingReferencesParams {
  references: Set<string>;
  registry: TypeNameRegistry;
}

/**
 * Registers any $ref targets that weren't explicitly registered during traversal.
 */
const registerMissingReferences = ({
  references,
  registry,
}: RegisterMissingReferencesParams): void => {
  references.forEach((ref) => {
    // Only handle internal references
    if (!ref.startsWith('#')) return;

    // Skip if already registered
    if (registry.get(ref)) return;

    // Derive name from the last part of the pointer
    const parts = ref.split('/');
    const lastPart = parts[parts.length - 1];
    const name = toPascalCase(lastPart);

    registry.register(ref, name);
  });
};

/**
 * Parameters for cleanup.
 */
interface CleanupParams {
  schema: JsonSchema;
  registry: TypeNameRegistry;
}

/**
 * Removes redundant alias registrations.
 *
 * If a registered type is just a proxy ($ref) to another registered type,
 * and they share the same base name, the proxy is removed. This allows
 * the generator to use the target type directly.
 */
const cleanupRedundantAliases = ({ schema, registry }: CleanupParams): void => {
  const allEntries = Array.from(registry.getAll().keys());

  for (const pointer of allEntries) {
    const fragment = resolvePointer({ root: schema, pointer });

    if (fragment && fragment.$ref) {
      // Only handle internal references
      if (!fragment.$ref.startsWith('#')) continue;

      const targetPointer = fragment.$ref;
      const targetName = registry.get(targetPointer);

      if (targetName) {
        const myBaseName = registry.getBaseName(pointer);
        const targetBaseName = registry.getBaseName(targetPointer);

        // If base names match, this alias is redundant
        if (myBaseName && targetBaseName && myBaseName === targetBaseName) {
          registry.delete(pointer);
        }
      }
    }
  }
};
