# json-schema-to-dts

A robust TypeScript package that converts complex JSON Schema files to TypeScript type definitions (.d.ts).

**_Disclaimer: AI assistance was used in the development of this project_**

**Key Features:**

- Handles deeply nested schemas and definitions
- Resolves references (`$ref`) accurately
- Supports `oneOf`, `anyOf`, and `allOf` combinators
- Preserves directory structure

## Requirements

- Node.js >= 14.14.0

## Installation

```bash
pnpm add json-schema-to-dts
# or
npm install json-schema-to-dts
```

## Usage

```typescript
import { toTypes } from "json-schema-to-dts";

// Convert all JSON Schema files in a directory to TypeScript definition files
await toTypes({
  pathToJsonSchemas: "./schemas",
  pathToOutputDirectory: "./src/types",
});
```

The function preserves the directory structure from input to output. For example:

- Input: `schemas/programme.schema.json` → Output: `src/types/programme.d.ts`
- Input: `schemas/v2/offer.schema.json` → Output: `src/types/v2/offer.d.ts`

## Examples

### Complex Schema Support

Input (`user.schema.json`):

```json
{
  "title": "User",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "role": { "oneOf": [{ "const": "ADMIN" }, { "const": "USER" }] },
    "meta": {
      "type": "object",
      "properties": {
        "created": { "type": "string" }
      }
    }
  }
}
```

Output (`user.d.ts`):

```typescript
export interface User {
  id?: string;
  role?: "ADMIN" | "USER";
  meta?: UserMeta;
}

export interface UserMeta {
  created?: string;
}
```

## API

### `toTypes(config: ToTypesConfig): Promise<void>`

**Parameters:**

- `config.pathToJsonSchemas` (string): Absolute or relative path to the directory containing `.json` schema files.
- `config.pathToOutputDirectory` (string): Absolute or relative path to the directory where `.d.ts` files will be written.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run tests
pnpm test
```

## License

MIT
