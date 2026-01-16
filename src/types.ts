export interface JsonSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  enum?: any[];
  const?: any;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  definitions?: Record<string, JsonSchema>;
  $defs?: Record<string, JsonSchema>;
  $ref?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: any;
  examples?: any[];
}

/**
 * Options to customize the TypeScript type generation process.
 */
export interface TypeGenerationOptions {
  /**
   * If true, includes JSDoc comments from schema `description`, `title`, and `examples`.
   * @default true
   */
  includeJSDoc?: boolean;
  
  /**
   * If true, exports all generated types, not just the root ones.
   * @default true
   */
  exportAll?: boolean;
}

/**
 * Configuration for the `toTypes` function.
 */
export interface ToTypesConfig {
  /**
   * The absolute or relative path to the directory containing `.json` schema files.
   * The function will recursively find all JSON files in this directory.
   */
  pathToJsonSchemas: string;
  
  /**
   * The absolute or relative path to the directory where the generated `.d.ts` files will be written.
   * The directory structure of the input schemas will be mirrored here.
   */
  pathToOutputDirectory: string;
}
