/**
 * Type builder for object types.
 * Handles schemas with properties and additionalProperties.
 */

import { JsonSchema } from '../../types';
import { TypeBuildContext, createChildContext } from './context';

/**
 * Parameters for building an object type.
 */
export interface BuildObjectTypeParams {
  /** The schema to build */
  schema: JsonSchema;

  /** The build context */
  context: TypeBuildContext;

  /** Function to recursively build types */
  buildType: (context: TypeBuildContext) => string;
}

/**
 * Builds a TypeScript object type from a schema with properties.
 *
 * @param params - The build parameters
 * @returns The TypeScript object type string
 */
export const buildObjectType = ({
  schema,
  context,
  buildType,
}: BuildObjectTypeParams): string => {
  if (!schema.properties && !schema.additionalProperties) {
    return 'Record<string, any>';
  }

  const lines: string[] = [];

  // Build property types
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      const isRequired = schema.required?.includes(key) ?? false;
      const childContext = createChildContext(
        context,
        propSchema,
        `properties/${key}`
      );
      const propType = buildType(childContext);
      const optional = isRequired ? '' : '?';
      lines.push(`  ${key}${optional}: ${propType};`);
    });
  }

  // Build additional properties type (index signature)
  if (schema.additionalProperties) {
    if (typeof schema.additionalProperties === 'object') {
      const childContext = createChildContext(
        context,
        schema.additionalProperties,
        'additionalProperties'
      );
      const valueType = buildType(childContext);
      lines.push(`  [key: string]: ${valueType};`);
    } else if (schema.additionalProperties === true) {
      lines.push(`  [key: string]: any;`);
    }
  }

  return `{\n${lines.join('\n')}\n}`;
};

/**
 * Checks if a schema has object-like structure.
 *
 * @param schema - The JSON Schema to check
 * @returns True if the schema has object properties or is type: object
 */
export const hasObjectDefinition = (schema: JsonSchema): boolean => {
  return !!(
    schema.properties ||
    schema.additionalProperties ||
    schema.type === 'object'
  );
};
