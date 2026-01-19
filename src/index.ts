import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { JsonSchema, ToTypesConfig } from "./types";
import { generateTypeDefinition } from "./schema-parser";
import { createTypeNameRegistry } from "./type-name-registry";
import { scanSchema } from "./schema-scanner";

type ToTypes = (config: ToTypesConfig) => Promise<void>;

/**
 * Convert JSON Schema files to TypeScript type definition files
 * @param config - Configuration object with input and output paths
 */
export const toTypes: ToTypes = async (config) => {
  const { pathToJsonSchemas, pathToOutputDirectory } = config;

  // Ensure output directory exists
  if (!fs.existsSync(pathToOutputDirectory)) {
    fs.mkdirSync(pathToOutputDirectory, { recursive: true });
  }

  // Find all JSON schema files
  const schemaFiles = await glob("**/*.json", {
    cwd: pathToJsonSchemas,
    absolute: false,
  });

  for (const relativeSchemaPath of schemaFiles) {
    try {
      const fullSchemaPath = path.join(pathToJsonSchemas, relativeSchemaPath);
      const schemaContent = fs.readFileSync(fullSchemaPath, "utf-8");
      const schema: JsonSchema = JSON.parse(schemaContent);

      const registry = createTypeNameRegistry();

      // Pass 1: Scan and Register Types
      scanSchema({ schema, registry });

      // Pass 2: Generate Code
      const typeDefinitions: string[] = [];
      const exportedTypes: string[] = [];

      const allRegistered = registry.getAll();
      const sortedPointers = Array.from(allRegistered.keys()).sort();

      for (const pointer of sortedPointers) {
        const typeName = allRegistered.get(pointer)!;

        // Resolve the schema fragment for this pointer
        const fragment = resolvePointer({ root: schema, pointer });
        if (fragment) {
          const result = generateTypeDefinition({
            name: typeName,
            schema: fragment,
            rootSchema: schema,
            registry,
          });
          typeDefinitions.push(result.definition);
          exportedTypes.push(result.typeName);
        }
      }

      // Generate output file path
      const outputFileName =
        path.basename(relativeSchemaPath, ".json").replace(".schema", "") +
        ".d.ts";
      const outputDir = path.join(
        pathToOutputDirectory,
        path.dirname(relativeSchemaPath),
      );
      const outputFilePath = path.join(outputDir, outputFileName);

      // Ensure output subdirectory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the type definitions to file with exports at the end
      if (typeDefinitions.length > 0) {
        const uniqueExports = [...new Set(exportedTypes)];
        const content =
          typeDefinitions.join("\n\n") +
          "\n\n" +
          uniqueExports
            .map((typeName) => `export { ${typeName} };`)
            .join("\n") +
          "\n";
        fs.writeFileSync(outputFilePath, content, "utf-8");
        console.log(`Generated: ${outputFilePath}`);
      }
    } catch (error) {
      console.warn(
        `Failed to process schema file ${relativeSchemaPath}:`,
        error,
      );
    }
  }
};

export interface ResolvePointerParams {
  root: JsonSchema;
  pointer: string;
}

type ResolvePointer = (params: ResolvePointerParams) => JsonSchema | null;

const resolvePointer: ResolvePointer = ({ root, pointer }) => {
  if (pointer === "#") return root;

  // Remove #/ prefix
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

export { JsonSchema, TypeGenerationOptions, ToTypesConfig } from "./types";
export { generateTypeDefinition } from "./schema-parser";
