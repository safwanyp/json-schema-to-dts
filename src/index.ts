/**
 * JSON Schema to TypeScript Type Definitions Converter
 *
 * Converts JSON Schema files to TypeScript type definition (.d.ts) files
 * with JSDoc annotations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Re-export types
export { JsonSchema, TypeGenerationOptions, ToTypesConfig } from './types';

// Re-export generation utilities
export { generateTypeDefinition, GeneratedType } from './generation';

// Internal imports
import { JsonSchema, ToTypesConfig } from './types';
import { createTypeNameRegistry } from './registry';
import { scanSchema } from './scanning';
import { generateTypeDefinition } from './generation';
import { resolvePointer } from './resolution';

/**
 * Convert JSON Schema files to TypeScript type definition files.
 *
 * @param config - Configuration specifying input and output paths
 *
 * @example
 * await toTypes({
 *   pathToJsonSchemas: './schemas',
 *   pathToOutputDirectory: './types'
 * });
 */
export const toTypes = async (config: ToTypesConfig): Promise<void> => {
  const { pathToJsonSchemas, pathToOutputDirectory } = config;

  // Ensure output directory exists
  if (!fs.existsSync(pathToOutputDirectory)) {
    fs.mkdirSync(pathToOutputDirectory, { recursive: true });
  }

  // Find all JSON schema files
  const schemaFiles = await glob('**/*.json', {
    cwd: pathToJsonSchemas,
    absolute: false,
  });

  for (const relativeSchemaPath of schemaFiles) {
    try {
      await processSchemaFile({
        relativeSchemaPath,
        pathToJsonSchemas,
        pathToOutputDirectory,
      });
    } catch (error) {
      console.warn(
        `Failed to process schema file ${relativeSchemaPath}:`,
        error
      );
    }
  }
};

/**
 * Parameters for processing a single schema file.
 */
interface ProcessSchemaFileParams {
  relativeSchemaPath: string;
  pathToJsonSchemas: string;
  pathToOutputDirectory: string;
}

/**
 * Processes a single schema file and generates the output.
 */
const processSchemaFile = async ({
  relativeSchemaPath,
  pathToJsonSchemas,
  pathToOutputDirectory,
}: ProcessSchemaFileParams): Promise<void> => {
  const fullSchemaPath = path.join(pathToJsonSchemas, relativeSchemaPath);
  const schemaContent = fs.readFileSync(fullSchemaPath, 'utf-8');
  const schema: JsonSchema = JSON.parse(schemaContent);

  // Create a fresh registry for this schema
  const registry = createTypeNameRegistry();

  // Pass 1: Scan and register types
  scanSchema({ schema, registry });

  // Pass 2: Generate type definitions
  const typeDefinitions: string[] = [];
  const exportedTypes: string[] = [];

  const allRegistered = registry.getAll();
  const sortedPointers = Array.from(allRegistered.keys()).sort();

  for (const pointer of sortedPointers) {
    const typeName = allRegistered.get(pointer)!;
    const fragment = resolvePointer({ root: schema, pointer });

    if (fragment) {
      const result = generateTypeDefinition({
        name: typeName,
        schema: fragment,
        rootSchema: schema,
        registry,
        pointer,
      });
      typeDefinitions.push(result.definition);
      exportedTypes.push(result.typeName);
    }
  }

  // Generate output file
  if (typeDefinitions.length > 0) {
    writeOutputFile({
      relativeSchemaPath,
      pathToOutputDirectory,
      typeDefinitions,
      exportedTypes,
    });
  }
};

/**
 * Parameters for writing an output file.
 */
interface WriteOutputFileParams {
  relativeSchemaPath: string;
  pathToOutputDirectory: string;
  typeDefinitions: string[];
  exportedTypes: string[];
}

/**
 * Writes the generated type definitions to a .d.ts file.
 */
const writeOutputFile = ({
  relativeSchemaPath,
  pathToOutputDirectory,
  typeDefinitions,
  exportedTypes,
}: WriteOutputFileParams): void => {
  // Generate output file path
  const outputFileName =
    path.basename(relativeSchemaPath, '.json').replace('.schema', '') + '.d.ts';
  const outputDir = path.join(
    pathToOutputDirectory,
    path.dirname(relativeSchemaPath)
  );
  const outputFilePath = path.join(outputDir, outputFileName);

  // Ensure output subdirectory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the type definitions with exports
  const uniqueExports = [...new Set(exportedTypes)];
  const content =
    typeDefinitions.join('\n\n') +
    '\n\n' +
    uniqueExports.map((typeName) => `export { ${typeName} };`).join('\n') +
    '\n';

  fs.writeFileSync(outputFilePath, content, 'utf-8');
  console.log(`Generated: ${outputFilePath}`);
};
