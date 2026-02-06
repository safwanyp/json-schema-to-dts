import { toTypes } from "./dist/index.js";

// create the directories if doesn't exist

await toTypes({
  pathToJsonSchemas: "./test-schemas",
  pathToOutputDirectory: "./generated-types",
  generatedTypesExportsFormat: "ROOT_ONLY",
});
