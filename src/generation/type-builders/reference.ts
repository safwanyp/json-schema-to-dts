/**
 * Type builder for JSON Schema $ref references.
 * Handles resolving references to other schema definitions.
 */

import { JsonSchema } from "../../types";
import { TypeNameRegistry } from "../../registry";
import { resolveRef } from "../../resolution";
import { toPascalCase } from "../../utils";
import { TypeBuildContext } from "./context";

/**
 * Parameters for building a reference type.
 */
export interface BuildReferenceTypeParams {
  /** The $ref value (e.g., "#/definitions/User") */
  ref: string;

  /** The root schema for resolution */
  rootSchema: JsonSchema;

  /** The type name registry */
  registry?: TypeNameRegistry;

  /** Function to recursively build types */
  buildType: (context: TypeBuildContext) => string;
}

/**
 * Builds a TypeScript type for a $ref reference.
 * First checks the registry, then falls back to legacy resolution.
 *
 * @param params - The build parameters
 * @returns The TypeScript type string
 */
export const buildReferenceType = ({
  ref,
  rootSchema,
  registry,
  buildType,
}: BuildReferenceTypeParams): string => {
  // First, try to get the registered name
  if (registry) {
    const registeredName = registry.get(ref);
    if (registeredName) {
      return registeredName;
    }
  }

  // Fallback to legacy resolution
  return resolveLegacyRef({ ref, rootSchema, registry, buildType });
};

/**
 * Parameters for legacy reference resolution.
 */
interface ResolveLegacyRefParams {
  ref: string;
  rootSchema: JsonSchema;
  registry?: TypeNameRegistry;
  buildType: (context: TypeBuildContext) => string;
}

/**
 * Legacy fallback for resolving $ref when not found in registry.
 * Attempts to resolve the reference and either:
 * 1. Recursively build the type if it's a simple type
 * 2. Return a PascalCase name derived from the ref path
 */
const resolveLegacyRef = ({
  ref,
  rootSchema,
  registry,
  buildType,
}: ResolveLegacyRefParams): string => {
  const resolved = resolveRef({ ref, rootSchema });

  if (resolved && Object.keys(resolved).length > 0) {
    // If it's a simple type (no complex structure), recurse to get the base type
    if (
      resolved.type &&
      !resolved.properties &&
      !resolved.items &&
      !resolved.oneOf
    ) {
      return buildType({
        schema: resolved,
        rootSchema,
        registry,
        pointer: "#/legacy-fallback",
        lookupInRegistry: false,
      });
    }

    // Complex type - derive name from ref path
    const parts = ref.split("/");
    return toPascalCase(parts[parts.length - 1]);
  }

  // Last resort - derive name from ref path
  const parts = ref.split("/");
  return toPascalCase(parts[parts.length - 1]);
};
