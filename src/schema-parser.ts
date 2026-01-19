import { JsonSchema } from "./types";
import { SchemaRegistry } from "./schema-context";

export interface GeneratedType {
  definition: string;
  typeName: string;
}

export interface GenerateTypeDefinitionParams {
  name: string;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  registry?: SchemaRegistry;
}

type GenerateTypeDefinition = (
  params: GenerateTypeDefinitionParams,
) => GeneratedType;

export const generateTypeDefinition: GenerateTypeDefinition = ({
  name,
  schema,
  rootSchema,
  registry,
}) => {
  const jsDoc = generateJSDoc(schema);
  // Trust the provided name from the registry, do not re-normalize it
  const typeName = name;
  const typeDefinition = getTypeFromSchema({ schema, rootSchema, registry });

  // Determine if this should be a type alias or interface
  const isTypeAlias = shouldUseTypeAlias({ schema, typeDefinition });
  const keyword = isTypeAlias ? "type" : "interface";
  const separator = isTypeAlias ? " = " : " ";

  return {
    definition: `${jsDoc}${keyword} ${typeName}${separator}${typeDefinition}`,
    typeName,
  };
};

export interface GetTypeFromSchemaParams {
  schema: JsonSchema;
  rootSchema: JsonSchema;
  registry?: SchemaRegistry;
}

type GetTypeFromSchema = (params: GetTypeFromSchemaParams) => string;

const getTypeFromSchema: GetTypeFromSchema = ({ schema, rootSchema, registry }) => {
  // 1. Handle $ref using Registry if available
  if (schema.$ref) {
    if (registry) {
      const registeredName = registry.get(schema.$ref);
      if (registeredName) {
        return registeredName;
      }
    }

    // Fallback to legacy resolution if context fails or is missing
    return resolveLegacyRef({ ref: schema.$ref, rootSchema, registry });
  }

  // Capture parts if they exist
  let objectType: string | null = null;
  let combinatorType: string | null = null;

  // 2. Check for Combinators (oneOf, anyOf, allOf)
  if (schema.oneOf) {
    combinatorType = generateUnionType({ schemas: schema.oneOf, rootSchema, registry });
  } else if (schema.anyOf) {
    combinatorType = generateUnionType({ schemas: schema.anyOf, rootSchema, registry });
  } else if (schema.allOf) {
    combinatorType = generateIntersectionType({ schemas: schema.allOf, rootSchema, registry });
  }

  // 3. Check for Object Properties or explicit object type
  const hasObjectDefinition =
    schema.properties ||
    schema.additionalProperties ||
    schema.type === "object";

  if (hasObjectDefinition) {
    if (schema.properties || schema.additionalProperties) {
      objectType = generateObjectType({ schema, rootSchema, registry });
    } else if (schema.type === "object" && !combinatorType) {
      objectType = "Record<string, any>";
    }
  }

  // Combine them
  if (objectType && combinatorType) {
    return `${objectType} & (${combinatorType})`;
  }
  if (combinatorType) {
    return combinatorType;
  }
  if (objectType) {
    return objectType;
  }

  // 4. Handle const
  if (schema.const !== undefined) {
    return typeof schema.const === "string"
      ? `"${schema.const}"`
      : String(schema.const);
  }

  // 5. Handle enum
  if (schema.enum) {
    return schema.enum
      .map((val) => (typeof val === "string" ? `"${val}"` : String(val)))
      .join(" | ");
  }

  // 6. Handle type arrays (e.g. type: ["string", "null"])
  if (Array.isArray(schema.type)) {
    return schema.type.map((t) => mapJsonTypeToTs(t)).join(" | ");
  }

  // 7. Handle standard types
  const type = schema.type;

  switch (type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array":
      if (schema.items) {
        const itemType = getTypeFromSchema({ schema: schema.items, rootSchema, registry });
        if (itemType.includes(" | ") || itemType.includes(" & ")) {
          return `(${itemType})[]`;
        }
        return `${itemType}[]`;
      }
      return "any[]";
    default:
      return "any";
  }
};

export interface GenerateUnionTypeParams {
  schemas: JsonSchema[];
  rootSchema: JsonSchema;
  registry?: SchemaRegistry;
}

type GenerateUnionType = (params: GenerateUnionTypeParams) => string;

const generateUnionType: GenerateUnionType = ({
  schemas,
  rootSchema,
  registry,
}) => {
  const types = schemas.map((s) => getTypeFromSchema({ schema: s, rootSchema, registry }));
  return types.join(" | ");
};

export interface GenerateIntersectionTypeParams {
  schemas: JsonSchema[];
  rootSchema: JsonSchema;
  registry?: SchemaRegistry;
}

type GenerateIntersectionType = (params: GenerateIntersectionTypeParams) => string | null;

const generateIntersectionType: GenerateIntersectionType = ({
  schemas,
  rootSchema,
  registry,
}) => {
  const types = schemas.map((s) => getTypeFromSchema({ schema: s, rootSchema, registry }));
  // Filter out 'any' and 'unknown' to prevent them from poisoning the intersection
  const meaningfulTypes = types.filter((t) => t !== "any" && t !== "unknown");

  if (meaningfulTypes.length === 0) return null;
  return meaningfulTypes.join(" & ");
};

export interface ResolveLegacyRefParams {
  ref: string;
  rootSchema: JsonSchema;
  registry?: SchemaRegistry;
}

type ResolveLegacyRef = (params: ResolveLegacyRefParams) => string;

const resolveLegacyRef: ResolveLegacyRef = ({ ref, rootSchema, registry }) => {
  // Legacy Logic
  const resolved = resolveRefObject({ ref, rootSchema });
  if (resolved && Object.keys(resolved).length > 0) {
    if (
      resolved.type &&
      !resolved.properties &&
      !resolved.items &&
      !resolved.oneOf
    ) {
      // It's a simple alias, recurse
      return getTypeFromSchema({ schema: resolved, rootSchema, registry });
    }
    const parts = ref.split("/");
    return toPascalCase(parts[parts.length - 1]);
  }
  const parts = ref.split("/");
  return toPascalCase(parts[parts.length - 1]);
};

export interface ResolveRefObjectParams {
  ref: string;
  rootSchema: JsonSchema;
}

type ResolveRefObject = (params: ResolveRefObjectParams) => JsonSchema;

const resolveRefObject: ResolveRefObject = ({ ref, rootSchema }) => {
  if (ref.startsWith("#/definitions/")) {
    return rootSchema.definitions?.[ref.replace("#/definitions/", "")] || {};
  }
  if (ref.startsWith("#/$defs/")) {
    return rootSchema.$defs?.[ref.replace("#/$defs/", "")] || {};
  }
  // Deep lookup
  if (ref.startsWith("#/")) {
    const path = ref.substring(2).split("/");
    let current: any = rootSchema;
    for (const segment of path) {
      if (current && typeof current === "object" && segment in current) {
        current = current[segment];
      } else {
        return {};
      }
    }
    return current || {};
  }
  return {};
};

type MapJsonTypeToTs = (jsonType: string) => string;

const mapJsonTypeToTs: MapJsonTypeToTs = (jsonType) => {
  switch (jsonType) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array":
      return "any[]";
    case "object":
      return "object";
    default:
      return "any";
  }
};

export interface GenerateObjectTypeParams {
  schema: JsonSchema;
  rootSchema: JsonSchema;
  registry?: SchemaRegistry;
}

type GenerateObjectType = (params: GenerateObjectTypeParams) => string;

const generateObjectType: GenerateObjectType = ({
  schema,
  rootSchema,
  registry,
}) => {
  if (!schema.properties && !schema.additionalProperties) {
    return "Record<string, any>";
  }

  const lines: string[] = [];

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      const isRequired = schema.required?.includes(key) ?? false;
      const propType = getTypeFromSchema({ schema: propSchema, rootSchema, registry });
      const optional = isRequired ? "" : "?";
      lines.push(`  ${key}${optional}: ${propType};`);
    });
  }

  if (schema.additionalProperties) {
    if (typeof schema.additionalProperties === "object") {
      const valueType = getTypeFromSchema({
        schema: schema.additionalProperties,
        rootSchema,
        registry,
      });
      lines.push(`  [key: string]: ${valueType};`);
    } else if (schema.additionalProperties === true) {
      lines.push(`  [key: string]: any;`);
    }
  }

  return `{\n${lines.join("\n")}\n}`;
};

type ToPascalCase = (str: string) => string;

const toPascalCase: ToPascalCase = (str) => {
  return str
    .replace(/[^a-zA-Z0-9]/g, " ")
    .replace(/(?:^|\s)(\w)/g, (_, char) => char.toUpperCase())
    .replace(/\s/g, "");
};

type GenerateJSDoc = (schema: JsonSchema) => string;

const generateJSDoc: GenerateJSDoc = (schema) => {
  const lines: string[] = [];

  if (schema.title) lines.push(schema.title);
  if (schema.description) {
    if (lines.length > 0) lines.push("");
    lines.push(schema.description);
  }
  if (schema.examples && schema.examples.length > 0) {
    lines.push("");
    lines.push("@example");
    lines.push(JSON.stringify(schema.examples[0], null, 2));
  }

  if (lines.length === 0) return "";
  return "/**\n * " + lines.join("\n * ") + "\n */\n";
};

export interface ShouldUseTypeAliasParams {
  schema: JsonSchema;
  typeDefinition: string;
}

type ShouldUseTypeAlias = (params: ShouldUseTypeAliasParams) => boolean;

/**
 * Determines whether to use a `type` alias or an `interface` for the generated definition.
 *
 * The decision is made automatically based on TypeScript's capabilities and best practices:
 * - Forces `type` for:
 *   - Enums (`enum`) and Constants (`const`)
 *   - Primitives (string, number, boolean, null)
 *   - Arrays (`type[]`)
 *   - Unions (`|`), Intersections (`&`), and Combinators (oneOf, anyOf, allOf)
 *   - Mapped types (Record<string, any>) or types not starting with `{`
 *
 * - Uses `interface` for:
 *   - Standard objects with properties (unless they involve intersections)
 *
 * @param schema The JSON Schema being processed
 * @param typeDefinition The generated TypeScript type string (RHS of the assignment)
 * @returns True if `type` should be used, False if `interface` should be used.
 */
const shouldUseTypeAlias: ShouldUseTypeAlias = ({ schema, typeDefinition }) => {
  if (schema.enum || schema.const !== undefined) return true;
  if (["string", "number", "boolean", "array"].includes(schema.type as string))
    return true;
  if (Array.isArray(schema.type)) return true;
  if (schema.oneOf || schema.anyOf || schema.allOf) return true;

  // If we have an intersection ( & ) it must be a type alias
  if (typeDefinition.includes(" & ")) return true;

  if (schema.type !== "object" || !typeDefinition.startsWith("{")) return true;
  return false;
};
