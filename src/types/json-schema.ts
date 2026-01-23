/**
 * TypeScript interface representing a JSON Schema document.
 * Supports JSON Schema Draft-07 properties.
 */
export interface JsonSchema {
  /** JSON Schema version identifier */
  $schema?: string;

  /** Unique identifier for this schema */
  $id?: string;

  /** Human-readable title */
  title?: string;

  /** Human-readable description */
  description?: string;

  /** The type(s) of the schema (can be a single type or array of types) */
  type?: string | string[];

  /** Object property definitions */
  properties?: Record<string, JsonSchema>;

  /** List of required property names */
  required?: string[];

  /** Schema for array items */
  items?: JsonSchema | JsonSchema[];

  /** Schema for additional properties (or boolean to allow/disallow) */
  additionalProperties?: boolean | JsonSchema;

  /** Enumeration of allowed values */
  enum?: unknown[];

  /** Constant value */
  const?: unknown;

  /** All schemas must match (intersection) */
  allOf?: JsonSchema[];

  /** Any schema may match (union) */
  anyOf?: JsonSchema[];

  /** Exactly one schema must match (discriminated union) */
  oneOf?: JsonSchema[];

  /** Schema must not match */
  not?: JsonSchema;

  /** Reusable schema definitions (Draft-04/Draft-06 style) */
  definitions?: Record<string, JsonSchema>;

  /** Reusable schema definitions (Draft 2019-09+ style) */
  $defs?: Record<string, JsonSchema>;

  /** Reference to another schema */
  $ref?: string;

  /** Format hint (e.g., "email", "date-time") */
  format?: string;

  /** Minimum numeric value */
  minimum?: number;

  /** Maximum numeric value */
  maximum?: number;

  /** Minimum string length */
  minLength?: number;

  /** Maximum string length */
  maxLength?: number;

  /** Regex pattern for string validation */
  pattern?: string;

  /** Default value */
  default?: unknown;

  /** Example values */
  examples?: unknown[];
}
