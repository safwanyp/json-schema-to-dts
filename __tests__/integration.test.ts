import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { toTypes } from "../src/index";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const expectExportBlockToContain = (
  content: string,
  typeName: string,
): void => {
  const pattern = new RegExp(
    `export \\{[\\s\\S]*\\b${escapeRegExp(typeName)}\\b[\\s\\S]*\\};`,
    "m",
  );
  expect(pattern.test(content)).toBe(true);
};

describe("Integration Tests", () => {
  let tempDir: string;
  let inputDir: string;
  let outputDir: string;

  beforeEach(() => {
    // Create temporary directories for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "json-schema-test-"));
    inputDir = path.join(tempDir, "schemas");
    outputDir = path.join(tempDir, "types");

    fs.mkdirSync(inputDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temporary directories
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("should convert simple schema to TypeScript", async () => {
    // Create test schema
    const schema = {
      title: "User",
      description: "A user in the system",
      type: "object",
      properties: {
        id: { type: "string", description: "User ID" },
        name: { type: "string", description: "Full name" },
        age: { type: "number", description: "Age in years" },
      },
      required: ["id", "name"],
    };

    fs.writeFileSync(
      path.join(inputDir, "user.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    // Run conversion
    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    // Check output file exists
    const outputFile = path.join(outputDir, "user.d.ts");
    expect(fs.existsSync(outputFile)).toBe(true);

    // Check file content
    const content = fs.readFileSync(outputFile, "utf-8");
    expect(content).toContain("interface User");
    // Strict mode: properties are named types
    expect(content).toContain("id: UserId;");
    expect(content).toContain("name: UserName;");
    expect(content).toContain("age?: UserAge;");

    // Check definitions of extracted types
    expect(content).toContain("type UserId = string");
    expect(content).toContain("type UserName = string");
    expect(content).toContain("type UserAge = number");

    expectExportBlockToContain(content, "User");
    expect(content).toContain("A user in the system");
  });

  it("should preserve directory structure", async () => {
    // Create nested directory structure
    const subDir = path.join(inputDir, "api", "v1");
    fs.mkdirSync(subDir, { recursive: true });

    const schema = {
      title: "ApiResponse",
      type: "object",
      properties: {
        status: { type: "string" },
        data: { type: "object" },
      },
    };

    fs.writeFileSync(
      path.join(subDir, "response.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    // Run conversion
    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    // Check nested output structure
    const outputFile = path.join(outputDir, "api", "v1", "response.d.ts");
    expect(fs.existsSync(outputFile)).toBe(true);

    const content = fs.readFileSync(outputFile, "utf-8");
    expect(content).toContain("interface ApiResponse");
    expectExportBlockToContain(content, "ApiResponse");
  });

  it("should handle schema with definitions", async () => {
    const schema = {
      definitions: {
        User: {
          title: "User",
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
          required: ["id"],
        },
        Profile: {
          title: "Profile",
          type: "object",
          properties: {
            userId: { type: "string" },
            bio: { type: "string" },
          },
        },
      },
    };

    fs.writeFileSync(
      path.join(inputDir, "entities.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    const outputFile = path.join(outputDir, "entities.d.ts");
    const content = fs.readFileSync(outputFile, "utf-8");

    expect(content).toContain("interface User");
    expect(content).toContain("interface Profile");
    expectExportBlockToContain(content, "User");
    expectExportBlockToContain(content, "Profile");
  });

  it("should handle schema with $defs", async () => {
    const schema = {
      $defs: {
        Product: {
          title: "Product",
          type: "object",
          properties: {
            id: { type: "string" },
            price: { type: "number" },
          },
        },
      },
    };

    fs.writeFileSync(
      path.join(inputDir, "product.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    const outputFile = path.join(outputDir, "product.d.ts");
    const content = fs.readFileSync(outputFile, "utf-8");

    expect(content).toContain("interface Product");
    expectExportBlockToContain(content, "Product");
  });

  it("should handle references between schemas", async () => {
    const schema = {
      definitions: {
        Address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
          },
        },
        Person: {
          type: "object",
          properties: {
            name: { type: "string" },
            address: { $ref: "#/definitions/Address" },
          },
        },
      },
    };

    fs.writeFileSync(
      path.join(inputDir, "person.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    const outputFile = path.join(outputDir, "person.d.ts");
    const content = fs.readFileSync(outputFile, "utf-8");

    expect(content).toContain("interface Address");
    expect(content).toContain("interface Person");
    // Strict mode: property 'address' gets its own type 'PersonAddress' which aliases 'Address'
    expect(content).toContain("address?: PersonAddress;");
    expect(content).toContain("type PersonAddress = Address");
  });

  it("should handle multiple schema files", async () => {
    // Create multiple schema files
    const userSchema = {
      title: "User",
      type: "object",
      properties: { id: { type: "string" } },
    };

    const productSchema = {
      title: "Product",
      type: "object",
      properties: { name: { type: "string" } },
    };

    fs.writeFileSync(
      path.join(inputDir, "user.schema.json"),
      JSON.stringify(userSchema, null, 2),
    );

    fs.writeFileSync(
      path.join(inputDir, "product.schema.json"),
      JSON.stringify(productSchema, null, 2),
    );

    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    // Check both files were created
    expect(fs.existsSync(path.join(outputDir, "user.d.ts"))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "product.d.ts"))).toBe(true);

    const userContent = fs.readFileSync(
      path.join(outputDir, "user.d.ts"),
      "utf-8",
    );
    const productContent = fs.readFileSync(
      path.join(outputDir, "product.d.ts"),
      "utf-8",
    );

    expect(userContent).toContain("interface User");
    expect(productContent).toContain("interface Product");
  });

  it("should handle invalid JSON gracefully", async () => {
    // Create invalid JSON file
    fs.writeFileSync(path.join(inputDir, "invalid.json"), "{ invalid json }");

    // Should not throw, but should warn
    await expect(
      toTypes({
        pathToJsonSchemas: inputDir,
        pathToOutputDirectory: outputDir,
        generatedTypesExportsFormat: "UNIQUE_EXPORTS",
      }),
    ).resolves.not.toThrow();

    // Output directory should still be created
    expect(fs.existsSync(outputDir)).toBe(true);
  });

  it("should create output directories as needed", async () => {
    const schema = {
      title: "Test",
      type: "object",
      properties: { id: { type: "string" } },
    };

    fs.writeFileSync(
      path.join(inputDir, "test.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    // Use non-existent output directory
    const deepOutputDir = path.join(outputDir, "deep", "nested", "path");

    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: deepOutputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    expect(fs.existsSync(path.join(deepOutputDir, "test.d.ts"))).toBe(true);
  });

  it("should export only the root type when generatedTypesExportsFormat is ROOT_ONLY", async () => {
    const schema = {
      title: "User",
      description: "A user in the system",
      type: "object",
      properties: {
        id: { type: "string", description: "User ID" },
        name: { type: "string", description: "Full name" },
        age: { type: "number", description: "Age in years" },
      },
      required: ["id", "name"],
    };

    fs.writeFileSync(
      path.join(inputDir, "entities.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "ROOT_ONLY",
    });

    const outputFile = path.join(outputDir, "entities.d.ts");
    const content = fs.readFileSync(outputFile, "utf-8");

    expect(content).toContain("export { User }");
  });

  it("should export all types when generatedTypesExportsFormat is UNIQUE_EXPORTS", async () => {
    const schema = {
      title: "User",
      description: "A user in the system",
      type: "object",
      properties: {
        id: { type: "string", description: "User ID" },
        name: { type: "string", description: "Full name" },
        age: { type: "number", description: "Age in years" },
      },
      required: ["id", "name"],
    };

    fs.writeFileSync(
      path.join(inputDir, "entities.schema.json"),
      JSON.stringify(schema, null, 2),
    );

    await toTypes({
      pathToJsonSchemas: inputDir,
      pathToOutputDirectory: outputDir,
      generatedTypesExportsFormat: "UNIQUE_EXPORTS",
    });

    const outputFile = path.join(outputDir, "entities.d.ts");
    const content = fs.readFileSync(outputFile, "utf-8");

    expectExportBlockToContain(content, "User");
    expectExportBlockToContain(content, "UserId");
    expectExportBlockToContain(content, "UserName");
    expectExportBlockToContain(content, "UserAge");
  });
});
