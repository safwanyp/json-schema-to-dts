/**
 * Type builder for intersection types.
 * Handles allOf schemas.
 */

import { JsonSchema } from "../../types";
import { TypeBuildContext, createChildContext } from "./context";

/**
 * Parameters for building an intersection type.
 */
export interface BuildIntersectionTypeParams {
  /** Array of schemas to intersect */
  schemas: JsonSchema[];

  /** Parent context for building */
  parentContext: TypeBuildContext;

  /** Function to recursively build types */
  buildType: (context: TypeBuildContext) => string;
}

/**
 * Builds a TypeScript intersection type from an array of schemas.
 * Filters out 'any' and 'unknown' types to prevent them from poisoning the intersection.
 *
 * @param params - The build parameters
 * @returns The TypeScript intersection type string, or null if no meaningful types
 */
export const buildIntersectionType = ({
  schemas,
  parentContext,
  buildType,
}: BuildIntersectionTypeParams): string | null => {
  const types = schemas.map((schema, index) => {
    const childContext = createChildContext(
      parentContext,
      schema,
      `allOf/${index}`,
    );
    return buildType(childContext);
  });

  // Filter out 'any' and 'unknown' to prevent them from poisoning the intersection
  const meaningfulTypes = types.filter((t) => t !== "any" && t !== "unknown");

  if (meaningfulTypes.length === 0) {
    return null;
  }

  return meaningfulTypes.join(" & ");
};
