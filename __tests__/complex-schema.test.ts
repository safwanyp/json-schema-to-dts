import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { toTypes } from "../src/index";

describe("Complex Schema Generation", () => {
  const outputDir = path.join(__dirname, "output");
  const schemaDir = path.join(__dirname, "../test-schemas");
  const outputFile = path.join(outputDir, "programme.d.ts");

  beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup handled manually if needed for debugging
  });

  it("should generate valid types for programme.schema.json", async () => {
    // Ensure the schema file exists
    if (!fs.existsSync(path.join(schemaDir, "programme.schema.json"))) {
      console.warn("Skipping test: programme.schema.json not found");
      return;
    }

    await toTypes({
      pathToJsonSchemas: schemaDir,
      pathToOutputDirectory: outputDir,
    });

    expect(fs.existsSync(outputFile)).toBe(true);

    const content = fs.readFileSync(outputFile, "utf-8");

    // Check for Reference Resolution
    // The schema has a deep ref: "$ref": "#/properties/offers/items/definitions/ProgrammeOfferId"
    // We need to ensure the definition is exported and the usage references it correctly.

    // We expect "ProgrammeOfferId" (or a scoped version of it) to be defined.
    // The current flawed implementation might not generate it or generate it with a conflicting name.

    // Check for Unions (oneOf)
    // "offers" items has a "oneOf" with TENDER, FIXED_DISCOUNT etc.
    // We expect to see union syntax in the output
    // e.g. ( ... ) | ( ... )

    // Let's verify that basic parts exist
    expect(content).toMatch(/(interface|type) Programme/);
    expect(content).toContain("export { Programme };");

    // Check for Unions (oneOf)
    // Programme should be a union of LoyaltyProgramme and CampaignProgramme
    expect(content).toContain("LoyaltyProgramme | CampaignProgramme");

    // Check for deep nested definitions
    // The schema has definitions for ProgrammeOfferId inside offers items
    // We expect it to be exported
    expect(content).toMatch(/(interface|type) ProgrammeOfferId/);
    expect(content).toContain("export { ProgrammeOfferId };");

    // Check that ProgrammeOffer references the generated ID type
    // We need to see if the content matches something like:
    // id?: ProgrammeOfferId;
    // or
    // id: ProgrammeOfferId;
    expect(content).toMatch(/id\??:\s*ProgrammeOfferId/);
  });
});
