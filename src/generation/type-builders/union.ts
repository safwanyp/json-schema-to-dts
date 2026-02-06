/**
 * Type builder for union types.
 * Handles oneOf, anyOf, enum, const, and type arrays.
 */

import { JsonSchema } from "../../types";
import { TypeBuildContext, createChildContext } from "./context";
import { mapJsonTypeToTs } from "./primitive";

/**
 * Parameters for building a union type.
 */
export interface BuildUnionTypeParams {
  /** Array of schemas to union */
  schemas: JsonSchema[];

  /** Parent context for building */
  parentContext: TypeBuildContext;

  /** Pointer suffix for the union (e.g., "oneOf", "anyOf") */
  pointerSuffix: string;

  /** Function to recursively build types */
  buildType: (context: TypeBuildContext) => string;
}

/**
 * Builds a TypeScript union type from an array of schemas.
 *
 * @param params - The build parameters
 * @returns The TypeScript union type string (e.g., "A | B | C")
 */
export const buildUnionType = ({
  schemas,
  parentContext,
  pointerSuffix,
  buildType,
}: BuildUnionTypeParams): string => {
  const types = schemas.map((schema, index) => {
    const childContext = createChildContext(
      parentContext,
      schema,
      `${pointerSuffix}/${index}`,
    );
    return buildType(childContext);
  });

  return types.join(" | ");
};

/**
 * Builds a TypeScript type for an enum schema.
 *
 * @param enumValues - The array of enum values
 * @returns The TypeScript union type string (e.g., '"a" | "b" | 1')
 */
export const buildEnumType = (enumValues: unknown[]): string => {
  return enumValues
    .map((val) => (typeof val === "string" ? `"${val}"` : String(val)))
    .join(" | ");
};

/**
 * Builds a TypeScript type for a const schema.
 *
 * @param constValue - The constant value
 * @returns The TypeScript literal type string
 */
export const buildConstType = (constValue: unknown): string => {
  return typeof constValue === "string"
    ? `"${constValue}"`
    : String(constValue);
};

/**
 * Builds a TypeScript union type from a type array.
 *
 * @param types - Array of JSON Schema type strings
 * @returns The TypeScript union type string
 *
 * @example
 * buildTypeArrayUnion(['string', 'null']) // => 'string | null'
 */
export const buildTypeArrayUnion = (types: string[]): string => {
  return types.map((t) => mapJsonTypeToTs(t)).join(" | ");
};
