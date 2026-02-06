# Agent Guidelines for json-schema-to-ts-types

This document contains guidelines for AI agents and developers working on this repository.

## 1. Build, Lint, and Test Commands

### Build

- **Build Project:** `pnpm run build`
  - Runs `tsc` to compile TypeScript to `dist/`.

### Test (Vitest)

- **Run All Tests:** `pnpm test` (or `pnpm dlx vitest run`)
- **Run Single Test File:** `pnpm dlx vitest run test/path/to/test.ts`
- **Run Single Test Case:** `pnpm dlx vitest run -t "name of test"`
- **Watch Mode:** `pnpm run dev` (runs tsc in watch mode) or `pnpm run test:watch` (runs vitest in watch mode)
- **Coverage:** `pnpm run test:coverage`

### Linting & Formatting

- **Type Check:** `pnpm dlx tsc --noEmit`
- **Formatting:** Use `pnpm run fmt` (uses `oxfmt`).
- **Linting:** Use `pnpm run fmt:check` to verify formatting. Rely on `tsconfig.json` strict mode for type safety.

## 2. Code Style & Conventions

### General

- **Language:** TypeScript (Target ES2020, CommonJS modules).
- **Indentation:** 2 spaces.
- **Quotes:** Single quotes `'` for strings and imports.
- **Semicolons:** Always use semicolons `;`.

### Naming Conventions

- **Files & Directories:** `kebab-case` (e.g., `schema-parser.ts`, `generated-types/`).
- **Classes & Types:** `PascalCase` (e.g., `SchemaParser`, `JsonSchema`).
- **Functions & Variables:** `camelCase` (e.g., `generateTypeDefinition`, `schemaContent`).
- **Constants:** `UPPER_CASE` or `camelCase` if they are immutable variables closer to usage.

### TypeScript Usage

- **Strict Mode:** `strict: true` is enabled. Handle `null` and `undefined` explicitly.
- **Type Definitions:** Prefer `interface` for object shapes and `type` for unions/primitives.
- **Explicit Types:** Use explicit return types for exported functions.
  ```typescript
  export async function toTypes(config: ToTypesConfig): Promise<void> { ... }
  ```
- **Function Parameters:** Use a single object parameter pattern instead of multiple named parameters. This improves extensibility and makes optional parameters clearer.

  ```typescript
  // Good - single object parameter
  function processSchema({ inputPath, outputPath, options }: ProcessSchemaConfig): void { ... }

  // Avoid - multiple named parameters
  function processSchema(inputPath: string, outputPath: string, options?: Options): void { ... }
  ```

- **Imports:**
  - Use namespace imports for Node.js built-ins: `import * as fs from 'fs';`
  - Use named imports for project files: `import { SchemaParser } from './schema-parser';`

### Error Handling

- Use `try...catch` blocks for file I/O and parsing operations.
- Use `console.warn` for non-critical errors (e.g., skipping a malformed file) to allow the process to continue.
- Fail fast for critical configuration errors.

### Documentation (JSDoc)

- Add JSDoc comments for exported functions and classes.
- Include `@param` and description.
- Include `@returns` and description

```typescript
/**
 * Convert JSON Schema files to TypeScript type definition files
 * @param config - Configuration object with input and output paths
 */
```

### Testing Guidelines

- **Framework:** Vitest (compatible with Jest API).
- **Structure:** `describe` blocks for classes/modules, `it` blocks for specific behaviors.
- **Assertions:** Use `expect(actual).toBe(expected)` or `toContain`.
- **Location:** Tests are located in the `__tests__/` directory.

## 3. Project Structure

- `src/` - Source code.
- `__tests__/` - Unit and integration tests.
- `test-schemas/` - JSON schemas used for testing input.
- `dist/` - Compiled output (do not edit).
- `generated-types/` - Example output directory.
