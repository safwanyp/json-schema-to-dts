/**
 * Configuration types for the JSON Schema to TypeScript converter.
 */

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

export type GeneratedTypesExportFormat = "UNIQUE_EXPORTS" | "ROOT_ONLY";

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

  /**
   * Determines how generated types are exported in the output `.d.ts` files.
   * - 'UNIQUE_EXPORTS': Exports all generated types, including nested ones, with unique names.
   * - 'ROOT_ONLY': Only exports the root type corresponding to each input schema file.
   */
  generatedTypesExportsFormat: GeneratedTypesExportFormat;
}
