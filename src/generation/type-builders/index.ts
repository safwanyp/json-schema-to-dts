/**
 * Type builders for generating TypeScript types from JSON Schema.
 * Each builder handles a specific category of JSON Schema constructs.
 */

// Context
export { TypeBuildContext, createChildContext } from './context';

// Primitive types (string, number, boolean, null)
export { mapJsonTypeToTs, isPrimitiveType, buildPrimitiveType } from './primitive';

// Reference types ($ref)
export { buildReferenceType, BuildReferenceTypeParams } from './reference';

// Union types (oneOf, anyOf, enum, const)
export {
  buildUnionType,
  buildEnumType,
  buildConstType,
  buildTypeArrayUnion,
  BuildUnionTypeParams,
} from './union';

// Intersection types (allOf)
export { buildIntersectionType, BuildIntersectionTypeParams } from './intersection';

// Object types (properties, additionalProperties)
export { buildObjectType, hasObjectDefinition, BuildObjectTypeParams } from './object';

// Array types (items)
export { buildArrayType, BuildArrayTypeParams } from './array';
