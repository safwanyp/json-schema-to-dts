import { JsonSchema } from "./types";
import { TypeNameRegistry } from "./type-name-registry";

export interface ScanSchemaParams {
  schema: JsonSchema;
  registry: TypeNameRegistry;
  rootPointer?: string;
}

type ScanSchema = (params: ScanSchemaParams) => void;

/**
 * Scan the schema to identify and register all type definitions
 */
export const scanSchema: ScanSchema = ({ schema, registry, rootPointer = "#" }) => {
  const references = new Set<string>();

  // Pass 1: Traverse and register explicit definitions
  // Start with empty string so top level doesn't get double named if it has a title
  traverse({ schema, registry, references, pointer: rootPointer, suggestedName: "" });

  // Pass 2: Register missing references
  references.forEach((ref) => {
    // Only handle internal references for now
    if (!ref.startsWith("#")) return;

    // If not already registered
    if (!registry.get(ref)) {
      // derive name from the last part of the pointer
      const parts = ref.split("/");
      const lastPart = parts[parts.length - 1];
      const name = toPascalCase(lastPart);

      registry.register(ref, name);
    }
  });

  // Pass 3: Cleanup redundant aliases (Strict Naming)
  // If a registered type is just a proxy ($ref) to another registered type,
  // and they share the same base name request, we should drop the proxy
  // to allow the generator to use the target type directly.
  const allEntries = Array.from(registry.getAll().keys());

  for (const pointer of allEntries) {
    const fragment = resolvePointer(schema, pointer);
    if (fragment && fragment.$ref) {
      // Only handle internal references
      if (fragment.$ref.startsWith("#")) {
         const targetPointer = fragment.$ref;
         
         // Check if target is registered
         const targetName = registry.get(targetPointer);
         if (targetName) {
            const myBaseName = registry.getBaseName(pointer);
            const targetBaseName = registry.getBaseName(targetPointer);
            
            // If the requested base names are identical, this alias is redundant
            // because it would result in Name_1 = Name.
            // By deleting it, we force the generator to look up the property/ref directly,
            // which will resolve to the target type, using the target's name.
            if (myBaseName && targetBaseName && myBaseName === targetBaseName) {
               registry.delete(pointer);
            }
         }
      }
    }
  }
};

export interface TraverseParams {
  schema: JsonSchema;
  registry: TypeNameRegistry;
  references: Set<string>;
  pointer: string;
  suggestedName: string;
}

type Traverse = (params: TraverseParams) => void;

const traverse: Traverse = ({
  schema,
  registry,
  references,
  pointer,
  suggestedName,
}) => {
  if (!schema || typeof schema !== "object") {
    return;
  }

  // Collect reference
  if (schema.$ref) {
    references.add(schema.$ref);
  }

  // Determine the best name for this location
  // If explicitly titled, use that. Otherwise use the path-based suggested name.
  
  let name = suggestedName;

  const isRootOrDefinition =
    pointer === "#" ||
    pointer.includes("/definitions/") ||
    pointer.includes("/$defs/");

  if (schema.title && isRootOrDefinition) {
    name = toPascalCase(schema.title);
  } else if (!name && schema.title) {
    // Fallback if we somehow have no suggested name
    name = toPascalCase(schema.title);
  }

  // Rule 1 & Strictness: Extract everything that has a name.
  // This ensures properties, items, and definitions are all named.
  const isDefinition = !!name;

  if (isDefinition) {
    registry.register(pointer, name);
  }

  // Scan definitions
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

  // Scan properties
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      // Append key to parent name for path-based naming
      const propName = name + toPascalCase(key);
      traverse({
        schema: prop as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/properties/${key}`,
        suggestedName: propName,
      });
    }
  }

  // Scan array items
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items.forEach((item, index) => {
        traverse({
          schema: item as JsonSchema,
          registry,
          references,
          pointer: `${pointer}/items/${index}`,
          suggestedName: `${name}Item${index}`,
        });
      });
    } else {
      traverse({
        schema: schema.items as JsonSchema,
        registry,
        references,
        pointer: `${pointer}/items`,
        suggestedName: `${name}Item`,
      });
    }
  }

  // Scan nested definition containers
  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties === "object"
  ) {
    traverse({
      schema: schema.additionalProperties as JsonSchema,
      registry,
      references,
      pointer: `${pointer}/additionalProperties`,
      suggestedName: `${name}Value`,
    });
  }

  // Scan combinators
  // For combinators, we check if the member is a Ref.
  // If it is a Ref, we DO NOT suggest a name, so that no alias is registered.
  // This allows the generator to use the Ref's target type directly in the union.
  // If it is NOT a Ref (inline object), we suggest a name so it gets extracted.
  
  if (schema.oneOf) {
    schema.oneOf.forEach((sub, index) => {
      const isRef = !!sub.$ref;
      const subName = isRef ? "" : `${name}Option${index}`;
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
      const subName = isRef ? "" : `${name}Option${index}`;
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
      const subName = isRef ? "" : `${name}Part${index}`;
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

const resolvePointer = (root: JsonSchema, pointer: string): JsonSchema | null => {
  if (pointer === "#") return root;
  const pathParts = pointer.replace(/^#\//, "").split("/");
  let current: any = root;
  for (const part of pathParts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
};

type ToPascalCase = (str: string) => string;

const toPascalCase: ToPascalCase = (str) => {
  return str
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .replace(/(?:^|\s)(\w)/g, (_, char) => char.toUpperCase());
};
