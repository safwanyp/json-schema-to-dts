import { JsonSchema } from './types';
import { SchemaRegistry } from './schema-context';

type ScanSchema = (schema: JsonSchema, registry: SchemaRegistry, rootPointer?: string) => void;

/**
 * Scan the schema to identify and register all type definitions
 */
export const scanSchema: ScanSchema = (schema, registry, rootPointer = '#') => {
  const references = new Set<string>();
  
  // Pass 1: Traverse and register explicit definitions
  // Start with empty string so top level doesn't get double named if it has a title
  traverse(schema, registry, references, rootPointer, '');

  // Pass 2: Register missing references
  references.forEach(ref => {
    // Only handle internal references for now
    if (!ref.startsWith('#')) return;

    // If not already registered
    if (!registry.get(ref)) {
      // derive name from the last part of the pointer
      const parts = ref.split('/');
      const lastPart = parts[parts.length - 1];
      const name = toPascalCase(lastPart);
      
      registry.register(ref, name);
    }
  });
}

type Traverse = (
  schema: JsonSchema, 
  registry: SchemaRegistry, 
  references: Set<string>,
  pointer: string, 
  suggestedName: string
) => void;

const traverse: Traverse = (
  schema, 
  registry, 
  references, 
  pointer, 
  suggestedName
) => {
  if (!schema || typeof schema !== 'object') {
    return;
  }

  // Collect reference
  if (schema.$ref) {
    references.add(schema.$ref);
  }

  // Rule 2: Skip registering if it is a simple ref (just a pointer alias)
  // We check if keys are just $ref (or $ref + description/title? optional, but strict simple ref is safer)
  // If we don't register it, the generator will just use the target type directly.
  if (schema.$ref && Object.keys(schema).length === 1) {
    return;
  }

  // Determine the best name for this location
  // If explicitly titled, use that. Otherwise use the path-based suggested name.
  // Note: We prefer the suggestedName (path-based) for consistency unless title is distinct?
  // Actually, usually 'title' in definitions is the canonical name. 
  // But for nested properties, path based is better.
  
  // Logic: 
  // 1. If we are at root, definitions, or $defs, we MUST use the key/title provided there to be canonical.
  // 2. If we are deep in properties, we use suggestedName (path-based).
  
  let name = suggestedName;
  
  const isRootOrDefinition = pointer === '#' || 
                            pointer.includes('/definitions/') || 
                            pointer.includes('/$defs/');

  if (schema.title && isRootOrDefinition) {
    name = toPascalCase(schema.title);
  } else if (!name && schema.title) {
     // Fallback if we somehow have no suggested name
     name = toPascalCase(schema.title);
  }

  // Rule 1: Extract objects even if untitled
  // Register this location if it looks like a distinct type definition
  const isDefinition = isRootOrDefinition ||
                      (schema.type === 'object' && !schema.$ref) || // Extract inline objects
                      !!schema.enum; // Extract inline enums too? Let's stick to objects for now per request.

  if (isDefinition && name) {
    registry.register(pointer, name);
  }

  // Scan definitions - Reset naming context? 
  // Definitions are usually independent, so we shouldn't prefix them with the parent name.
  if (schema.definitions) {
    for (const [key, def] of Object.entries(schema.definitions)) {
      const subName = toPascalCase(key);
      traverse(def as JsonSchema, registry, references, `${pointer}/definitions/${key}`, subName);
    }
  }

  if (schema.$defs) {
    for (const [key, def] of Object.entries(schema.$defs)) {
      const subName = toPascalCase(key);
      traverse(def as JsonSchema, registry, references, `${pointer}/$defs/${key}`, subName);
    }
  }

  // Scan properties - Rule 3: Prefixing
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      // Append key to parent name for path-based naming
      const propName = name + toPascalCase(key);
      traverse(prop as JsonSchema, registry, references, `${pointer}/properties/${key}`, propName);
    }
  }

  // Scan array items
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items.forEach((item, index) => {
        traverse(item as JsonSchema, registry, references, `${pointer}/items/${index}`, `${name}Item${index}`);
      });
    } else {
      // Arrays often wrap a type. If it's a list of Users, we often want 'User'.
      // But if it's 'Items', we might want 'ParentItems'.
      // Let's keep prefixing but maybe simplistic.
      traverse(schema.items as JsonSchema, registry, references, `${pointer}/items`, `${name}Item`);
    }
  }

  // Scan nested definition containers
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      traverse(schema.additionalProperties as JsonSchema, registry, references, `${pointer}/additionalProperties`, `${name}Value`);
  }
  
  // Scan combinators
  // For combinators, we might NOT want to prefix with "Option0", "Option1" if they are simple refs.
  // But traverse will handle the "Simple Ref" check at the top of the recursive call.
  if (schema.oneOf) {
    schema.oneOf.forEach((sub, index) => traverse(sub as JsonSchema, registry, references, `${pointer}/oneOf/${index}`, `${name}Option${index}`));
  }
  if (schema.anyOf) {
    schema.anyOf.forEach((sub, index) => traverse(sub as JsonSchema, registry, references, `${pointer}/anyOf/${index}`, `${name}Option${index}`));
  }
  if (schema.allOf) {
    schema.allOf.forEach((sub, index) => traverse(sub as JsonSchema, registry, references, `${pointer}/allOf/${index}`, `${name}Part${index}`));
  }
}

type ToPascalCase = (str: string) => string;

const toPascalCase: ToPascalCase = (str) => {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .replace(/(?:^|\s)(\w)/g, (_, char) => char.toUpperCase());
}
