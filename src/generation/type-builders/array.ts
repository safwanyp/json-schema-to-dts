/**
 * Type builder for array types.
 * Handles arrays with items (single schema or tuple).
 */

import { JsonSchema } from '../../types';
import { TypeBuildContext, createChildContext } from './context';

/**
 * Parameters for building an array type.
 */
export interface BuildArrayTypeParams {
  /** The array schema */
  schema: JsonSchema;

  /** The build context */
  context: TypeBuildContext;

  /** Function to recursively build types */
  buildType: (context: TypeBuildContext) => string;
}

/**
 * Builds a TypeScript array type from a schema.
 * Handles both regular arrays and tuples.
 *
 * @param params - The build parameters
 * @returns The TypeScript array type string
 */
export const buildArrayType = ({
  schema,
  context,
  buildType,
}: BuildArrayTypeParams): string => {
  if (!schema.items) {
    return 'any[]';
  }

  // Tuple type (items is an array of schemas)
  if (Array.isArray(schema.items)) {
    const tupleTypes = schema.items.map((item, index) => {
      const childContext = createChildContext(
        context,
        item,
        `items/${index}`
      );
      return buildType(childContext);
    });
    return `[${tupleTypes.join(', ')}]`;
  }

  // Regular array (items is a single schema)
  const childContext = createChildContext(context, schema.items, 'items');
  const itemType = buildType(childContext);

  // Wrap complex types in parentheses
  if (itemType.includes(' | ') || itemType.includes(' & ')) {
    return `(${itemType})[]`;
  }

  return `${itemType}[]`;
};
