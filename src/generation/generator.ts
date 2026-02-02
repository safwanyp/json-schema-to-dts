/**
 * Main TypeScript type generator.
 * Orchestrates the type building process for JSON Schema.
 */

import { JsonSchema } from '../types';
import { TypeNameRegistry } from '../registry';
import { generateJSDoc } from './jsdoc';
import { shouldUseTypeAlias, getDeclarationParts } from './type-decider';
import {
  TypeBuildContext,
  buildReferenceType,
  buildUnionType,
  buildEnumType,
  buildConstType,
  buildTypeArrayUnion,
  buildIntersectionType,
  buildObjectType,
  buildArrayType,
  hasObjectDefinition,
} from './type-builders';
/**
 * Result of generating a type definition.
 */
export interface GeneratedType {
  /** The complete type definition string (with JSDoc, keyword, etc.) */
  definition: string;

  /** The type name */
  typeName: string;
}

/**
 * Parameters for generating a type definition.
 */
export interface GenerateTypeDefinitionParams {
  /** The name for this type */
  name: string;

  /** The JSON Schema to generate from */
  schema: JsonSchema;

  /** The root schema document (for $ref resolution) */
  rootSchema: JsonSchema;

  /** Optional type name registry */
  registry?: TypeNameRegistry;

  /** The JSON pointer to this schema (defaults to '#') */
  pointer?: string;
}

/**
 * Generates a complete TypeScript type definition from a JSON Schema.
 *
 * @param params - The generation parameters
 * @returns The generated type with definition string and type name
 */
export const generateTypeDefinition = ({
  name,
  schema,
  rootSchema,
  registry,
  pointer = '#',
}: GenerateTypeDefinitionParams): GeneratedType => {
  const jsDoc = generateJSDoc(schema);
  const typeName = name;

  // Build the type definition (we don't look up the current pointer in registry
  // because we're generating the definition for it)
  const context: TypeBuildContext = {
    schema,
    rootSchema,
    registry,
    pointer,
    lookupInRegistry: false,
  };

  const typeDefinition = buildTypeFromSchema(context);

  // Determine if this should be a type alias or interface
  const isTypeAlias = shouldUseTypeAlias({ schema, typeDefinition });
  const { keyword, separator } = getDeclarationParts(isTypeAlias);

  return {
    definition: `${jsDoc}${keyword} ${typeName}${separator}${typeDefinition}`,
    typeName,
  };
};

/**
 * Builds a TypeScript type string from a schema context.
 * This is the main recursive function that delegates to specific builders.
 *
 * @param context - The type build context
 * @returns The TypeScript type string
 */
export const buildTypeFromSchema = (context: TypeBuildContext): string => {
  const { schema, rootSchema, registry, pointer, lookupInRegistry } = context;

  // 1. Registry Lookup (if enabled)
  if (lookupInRegistry && registry) {
    const registeredName = registry.get(pointer);
    if (registeredName) {
      return registeredName;
    }
  }

  // 2. Handle $ref
  if (schema.$ref) {
    return buildReferenceType({
      ref: schema.$ref,
      rootSchema,
      registry,
      buildType: buildTypeFromSchema,
    });
  }

  // Track parts for combining objects with combinators
  let objectType: string | null = null;
  let combinatorType: string | null = null;

  // 3. Handle combinators (oneOf, anyOf, allOf)
  if (schema.oneOf) {
    combinatorType = buildUnionType({
      schemas: schema.oneOf,
      parentContext: context,
      pointerSuffix: 'oneOf',
      buildType: buildTypeFromSchema,
    });
  } else if (schema.anyOf) {
    combinatorType = buildUnionType({
      schemas: schema.anyOf,
      parentContext: context,
      pointerSuffix: 'anyOf',
      buildType: buildTypeFromSchema,
    });
  } else if (schema.allOf) {
    combinatorType = buildIntersectionType({
      schemas: schema.allOf,
      parentContext: context,
      buildType: buildTypeFromSchema,
    });
  }

  // 4. Handle object types
  if (hasObjectDefinition(schema)) {
    if (schema.properties || schema.additionalProperties) {
      objectType = buildObjectType({
        schema,
        context,
        buildType: buildTypeFromSchema,
      });
    } else if (schema.type === 'object' && !combinatorType) {
      objectType = 'Record<string, any>';
    }
  }

  // 5. Combine object and combinator types
  if (objectType && combinatorType) {
    return `${objectType} & (${combinatorType})`;
  }
  if (combinatorType) {
    return combinatorType;
  }
  if (objectType) {
    return objectType;
  }

  // 6. Handle const
  if (schema.const !== undefined) {
    return buildConstType(schema.const);
  }

  // 7. Handle enum
  if (schema.enum) {
    return buildEnumType(schema.enum);
  }

  // 8. Handle type arrays (e.g., ["string", "null"])
  if (Array.isArray(schema.type)) {
    return buildTypeArrayUnion(schema.type);
  }

  // 9. Handle standard types
  const type = schema.type;

  switch (type) {
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
      return buildArrayType({
        schema,
        context,
        buildType: buildTypeFromSchema,
      });
    default:
      return 'any';
  }
};
