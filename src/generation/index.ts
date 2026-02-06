/**
 * TypeScript type generation from JSON Schema.
 */

// Main generator
export {
  generateTypeDefinition,
  buildTypeFromSchema,
  GeneratedType,
  GenerateTypeDefinitionParams,
} from "./generator";

// JSDoc generation
export { generateJSDoc } from "./jsdoc";

// Type decision logic
export {
  shouldUseTypeAlias,
  getDeclarationParts,
  ShouldUseTypeAliasParams,
} from "./type-decider";

// Type builders (re-export for advanced usage)
export {
  TypeBuildContext,
  createChildContext,
  mapJsonTypeToTs,
  buildReferenceType,
  buildUnionType,
  buildEnumType,
  buildConstType,
  buildTypeArrayUnion,
  buildIntersectionType,
  buildObjectType,
  buildArrayType,
  hasObjectDefinition,
} from "./type-builders";
