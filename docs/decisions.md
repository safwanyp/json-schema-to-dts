# Architecture Decisions and Design Rationale

## Overview

This document outlines the key decisions made during the development of the package.

## Core Design Decisions

### 1. Function Interface Design

**Decision**: Use object parameter instead of multiple parameters
```typescript
// Chosen approach
toTypes({ pathToJsonSchemas: string; pathToOutputDirectory: string })

// Alternative considered
toTypes(inputPath: string, outputPath: string)
```

**Rationale**:
- **Clarity**: Named properties are more self-documenting than positional parameters
- **Future-proofing**: Allows for optional parameters and configuration objects

### 2. File Output Strategy

**Decision**: Generate individual `.d.ts` files instead of a single output string

**Rationale**:
- **Modularity**: Each schema becomes its own module, enabling selective imports
- **Build Integration**: Individual files work better with TypeScript's module resolution
- **Directory Structure**: Preserves logical organization from source schemas
- **Performance**: Allows for incremental compilation and tree-shaking

### 3. Directory Structure Preservation

**Decision**: Mirror input directory structure in output

**Example**:
```
Input:  schemas/user.schema.json → Output: types/user.d.ts
Input:  schemas/api/product.schema.json → Output: types/api/product.d.ts
```

**Rationale**:
- **Intuitive Mapping**: Developers can easily locate generated types
- **Namespace Organization**: Maintains logical grouping of related schemas
- **Import Paths**: Predictable import paths based on schema location

### 4. Export Strategy

**Decision**: Place all exports at the end of each file
```typescript
// Type definitions
interface User { ... }
interface Profile { ... }

// Exports at end
export { User };
export { Profile };
```

**Rationale**:
- **Readability**: Clear separation between definitions and exports
- **Convention**: Follows common TypeScript patterns
- **Maintainability**: Easy to see what's exported from each file

## Technical Implementation Decisions

### 5. JSON Schema Support

**Decision**: Support both `definitions` and `$defs` patterns

**Rationale**:
- **Compatibility**: `definitions` is legacy but widely used
- **Future-proofing**: `$defs` is the modern JSON Schema standard
- **Broad Support**: Handles schemas from different eras and tools

### 6. Type Mapping Strategy

**Decision**: Conservative type mapping with TypeScript-native types

| JSON Schema Type | TypeScript Type | Rationale |
|------------------|-----------------|-----------|
| `string` | `string` | Direct mapping |
| `number`/`integer` | `number` | TS doesn't distinguish |
| `boolean` | `boolean` | Direct mapping |
| `array` | `Type[]` | Most common array syntax |
| `enum` | Union literals | Type-safe enums |
| `object` | Interface | Better than `Record<string, any>` |

### 7. Reference Resolution

**Decision**: Convert `$ref` to TypeScript type references
```typescript
// JSON Schema
{ "$ref": "#/definitions/User" }

// Generated TypeScript
user: User;
```

**Rationale**:
- **Type Safety**: Maintains type relationships
- **IntelliSense**: Better IDE support for referenced types
- **Validation**: TypeScript compiler can validate references

### 8. JSDoc Generation

**Decision**: Generate comprehensive JSDoc from schema metadata
```typescript
/**
 * User
 * 
 * A user in the system
 * 
 * @example
 * { "id": "123", "name": "John" }
 */
interface User { ... }
```

**Rationale**:
- **Documentation**: Preserves schema documentation in generated types
- **IDE Support**: JSDoc appears in hover tooltips and autocomplete
- **Examples**: Provides usage examples directly in type definitions

## File Organization Decisions

### 9. Modular Architecture

**Decision**: Separate functionality into modules by intention/concerm

```
src/
├── types.ts          # Type definitions
├── schema-parser.ts  # Core conversion logic
├── index.ts          # Main entry point and orchestration
└── test.ts           # Testing utilities
```

**Rationale**:
- **Single Responsibility**: Each module has a clear purpose
- **Testability**: Easier to unit test individual components
- **Maintainability**: Changes are localized to relevant modules

### 10. Error Handling Strategy

**Decision**: Graceful degradation with warnings
```typescript
try {
  // Process schema
} catch (error) {
  console.warn(`Failed to process schema file ${file}:`, error);
  // Continue with other files
}
```

**Rationale**:
- **Resilience**: One bad schema doesn't break the entire process
- **Visibility**: Users are informed about issues

## Build and Development Decisions

### 11. TypeScript Configuration

**Decision**: Strict TypeScript configuration with modern targets

**Rationale**:
- **Quality**: Strict mode catches more potential issues
- **Modern Features**: ES2020 target provides good feature support
- **Compatibility**: CommonJS for broader Node.js compatibility

### 12. Dependency Management

**Decision**: Minimal dependencies with clear purposes
- `glob`: File pattern matching (well-established, reliable)
- `typescript`: Development dependency for compilation
- `@types/node`: TypeScript definitions for Node.js APIs as a development dependency

**Rationale**:
- **Security**: Fewer dependencies reduce attack surface
- **Reliability**: Less chance of dependency conflicts
- **Performance**: Smaller package size and faster installs

## Future Extensibility Decisions

### 13. Configuration Interface

**Decision**: Design for future configuration options
```typescript
interface TypeGenerationOptions {
  includeJSDoc?: boolean;       // toggle documentation
  exportAll?: boolean;          // export strategy
}
```

**Rationale**:
- **Flexibility**: Users can customize generation behavior
- **Backwards Compatibility**: Optional properties don't break existing code
- **Growth**: Easy to add new options as needs arise

### 14. Plugin Architecture Preparation

**Decision**: Structure code to support future plugins

**Rationale**:
- **Extensibility**: Custom type mappings or transformations
- **Community**: Allow community contributions for specific use cases
- **Specialization**: Domain-specific type generation rules

## Testing Strategy

### 15. Example-Driven Testing

**Decision**: Use realistic schema examples for testing

**Rationale**:
- **Real-world Validation**: Tests reflect actual usage patterns
- **Regression Prevention**: Examples catch breaking changes
- **Documentation**: Tests serve as usage examples

## Performance Considerations

### 16. Streaming vs Batch Processing

**Decision**: Process files individually rather than loading all into memory

**Rationale**:
- **Memory Efficiency**: Handles large schema directories
- **Error Isolation**: Problems with one file don't affect others
- **Progress Feedback**: Can report progress file by file

## Summary

These decisions prioritize:
1. **Developer Experience**: Intuitive interfaces and clear output
2. **Maintainability**: Modular, documented code
3. **Extensibility**: Easy to add features without breaking changes
4. **Reliability**: Graceful error handling and comprehensive testing
5. **Performance**: Efficient processing of large schema sets

The architecture balances simplicity with flexibility, providing a solid foundation for current needs while enabling future enhancements. Hopefully.
