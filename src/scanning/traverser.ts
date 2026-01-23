/**
 * Schema traversal logic for identifying and registering type definitions.
 */

import { JsonSchema } from '../types';
import { TypeNameRegistry } from '../registry';
import { toPascalCase } from '../utils';

/**
 * Parameters for traversing a schema.
 */
export interface TraverseParams {
  /** The schema to traverse */
  schema: JsonSchema;

  /** The type name registry */
  registry: TypeNameRegistry;

  /** Set to collect $ref references */
  references: Set<string>;

  /** The JSON pointer to this schema */
  pointer: string;

  /** Suggested name for this schema (from parent context) */
  suggestedName: string;
}

/**
 * Recursively traverses a JSON Schema, registering type names and collecting references.
 *
 * @param params - The traversal parameters
 */
export const traverse = ({
  schema,
  registry,
  references,
  pointer,
  suggestedName,
}: TraverseParams): void => {
  if (!schema || typeof schema !== 'object') {
    return;
  }

  // Collect $ref references
  if (schema.$ref) {
    references.add(schema.$ref);
  }

  // Determine the best name for this location
  let name = suggestedName;

  const isRootOrDefinition =
    pointer === '#' ||
    pointer.includes('/definitions/') ||
    pointer.includes('/$defs/');

  // Use title for root and definitions, otherwise use suggested name
  if (schema.title && isRootOrDefinition) {
    name = toPascalCase(schema.title);
  } else if (!name && schema.title) {
    name = toPascalCase(schema.title);
  }

  // Register if we have a name
  if (name) {
    registry.register(pointer, name);
  }

  // Traverse definitions
  traverseDefinitions({ schema, registry, references, pointer, parentName: name });

  // Traverse properties
  traverseProperties({ schema, registry, references, pointer, parentName: name });

  // Traverse array items
  traverseItems({ schema, registry, references, pointer, parentName: name });

  // Traverse additional properties
  traverseAdditionalProperties({ schema, registry, references, pointer, parentName: name });

  // Traverse combinators
  traverseCombinators({ schema, registry, references, pointer, parentName: name });
};

/**
 * Parameters for sub-traversal functions.
 */
interface SubTraverseParams {
  schema: JsonSchema;
  registry: TypeNameRegistry;
  references: Set<string>;
  pointer: string;
  parentName: string;
}

/**
 * Traverses definitions and $defs.
 */
const traverseDefinitions = ({
  schema,
  registry,
  references,
  pointer,
  parentName,
}: SubTraverseParams): void => {
  if (schema.definitions) {
    for (const [key, def] of Object.entries(schema.definitions)) {
      const subName = toPascalCase(key);
      traverse({
        schema: def as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/definitions/${key}`,
        suggestedName: subName,
      });
    }
  }

  if (schema.$defs) {
    for (const [key, def] of Object.entries(schema.$defs)) {
      const subName = toPascalCase(key);
      traverse({
        schema: def as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/$defs/${key}`,
        suggestedName: subName,
      });
    }
  }
};

/**
 * Traverses object properties.
 */
const traverseProperties = ({
  schema,
  registry,
  references,
  pointer,
  parentName,
}: SubTraverseParams): void => {
  if (!schema.properties) return;

  for (const [key, prop] of Object.entries(schema.properties)) {
    const propName = parentName + toPascalCase(key);
    traverse({
      schema: prop as JsonSchema,
      registry,
      references,
      pointer: `${pointer}/properties/${key}`,
      suggestedName: propName,
    });
  }
};

/**
 * Traverses array items.
 */
const traverseItems = ({
  schema,
  registry,
  references,
  pointer,
  parentName,
}: SubTraverseParams): void => {
  if (!schema.items) return;

  if (Array.isArray(schema.items)) {
    schema.items.forEach((item, index) => {
      traverse({
        schema: item as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/items/${index}`,
        suggestedName: `${parentName}Item${index}`,
      });
    });
  } else {
    traverse({
      schema: schema.items as JsonSchema,
      registry,
      references,
      pointer: `${pointer}/items`,
      suggestedName: `${parentName}Item`,
    });
  }
};

/**
 * Traverses additional properties.
 */
const traverseAdditionalProperties = ({
  schema,
  registry,
  references,
  pointer,
  parentName,
}: SubTraverseParams): void => {
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    traverse({
      schema: schema.additionalProperties as JsonSchema,
      registry,
      references,
      pointer: `${pointer}/additionalProperties`,
      suggestedName: `${parentName}Value`,
    });
  }
};

/**
 * Traverses combinators (oneOf, anyOf, allOf).
 * For $ref members, no name is suggested to avoid creating aliases.
 * For inline members, a name is suggested so they get extracted.
 */
const traverseCombinators = ({
  schema,
  registry,
  references,
  pointer,
  parentName,
}: SubTraverseParams): void => {
  if (schema.oneOf) {
    schema.oneOf.forEach((sub, index) => {
      const isRef = !!sub.$ref;
      const subName = isRef ? '' : `${parentName}Option${index}`;
      traverse({
        schema: sub as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/oneOf/${index}`,
        suggestedName: subName,
      });
    });
  }

  if (schema.anyOf) {
    schema.anyOf.forEach((sub, index) => {
      const isRef = !!sub.$ref;
      const subName = isRef ? '' : `${parentName}Option${index}`;
      traverse({
        schema: sub as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/anyOf/${index}`,
        suggestedName: subName,
      });
    });
  }

  if (schema.allOf) {
    schema.allOf.forEach((sub, index) => {
      const isRef = !!sub.$ref;
      const subName = isRef ? '' : `${parentName}Part${index}`;
      traverse({
        schema: sub as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/allOf/${index}`,
        suggestedName: subName,
      });
    });
  }
};
