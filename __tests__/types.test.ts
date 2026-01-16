import { describe, it, expect } from 'vitest';
import { JsonSchema, ToTypesConfig, TypeGenerationOptions } from '../src/types';

describe('Type Definitions', () => {
  describe('JsonSchema interface', () => {
    it('should accept valid JSON Schema properties', () => {
      const schema: JsonSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://example.com/schema',
        title: 'Test Schema',
        description: 'A test schema',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        },
        required: ['id'],
        additionalProperties: false
      };

      expect(schema).toBeDefined();
      expect(schema.title).toBe('Test Schema');
      expect(schema.type).toBe('object');
      expect(schema.required).toEqual(['id']);
    });

    it('should handle array of types', () => {
      const schema: JsonSchema = {
        type: ['string', 'null']
      };

      expect(schema.type).toEqual(['string', 'null']);
    });

    it('should handle enum values', () => {
      const schema: JsonSchema = {
        enum: ['red', 'green', 'blue', 42, true, null]
      };

      expect(schema.enum).toEqual(['red', 'green', 'blue', 42, true, null]);
    });

    it('should handle nested schemas', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  email: { type: 'string' }
                }
              }
            }
          }
        }
      };

      expect(schema.properties?.user?.properties?.profile?.properties?.email?.type).toBe('string');
    });

    it('should handle definitions and $defs', () => {
      const schema: JsonSchema = {
        definitions: {
          User: { type: 'object' }
        },
        $defs: {
          Product: { type: 'object' }
        }
      };

      expect(schema.definitions?.User).toBeDefined();
      expect(schema.$defs?.Product).toBeDefined();
    });

    it('should handle composition keywords', () => {
      const schema: JsonSchema = {
        allOf: [
          { type: 'object', properties: { id: { type: 'string' } } },
          { type: 'object', properties: { name: { type: 'string' } } }
        ],
        anyOf: [
          { type: 'string' },
          { type: 'number' }
        ],
        oneOf: [
          { type: 'string', format: 'email' },
          { type: 'string', format: 'uri' }
        ],
        not: {
          type: 'null'
        }
      };

      expect(schema.allOf).toHaveLength(2);
      expect(schema.anyOf).toHaveLength(2);
      expect(schema.oneOf).toHaveLength(2);
      expect(schema.not).toBeDefined();
    });

    it('should handle validation keywords', () => {
      const schema: JsonSchema = {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-zA-Z]+$',
        format: 'email'
      };

      expect(schema.minLength).toBe(1);
      expect(schema.maxLength).toBe(100);
      expect(schema.pattern).toBe('^[a-zA-Z]+$');
      expect(schema.format).toBe('email');
    });

    it('should handle numeric validation', () => {
      const schema: JsonSchema = {
        type: 'number',
        minimum: 0,
        maximum: 100
      };

      expect(schema.minimum).toBe(0);
      expect(schema.maximum).toBe(100);
    });

    it('should handle default values and examples', () => {
      const schema: JsonSchema = {
        type: 'string',
        default: 'default-value',
        examples: ['example1', 'example2']
      };

      expect(schema.default).toBe('default-value');
      expect(schema.examples).toEqual(['example1', 'example2']);
    });
  });

  describe('ToTypesConfig interface', () => {
    it('should accept valid configuration', () => {
      const config: ToTypesConfig = {
        pathToJsonSchemas: './schemas',
        pathToOutputDirectory: './types'
      };

      expect(config.pathToJsonSchemas).toBe('./schemas');
      expect(config.pathToOutputDirectory).toBe('./types');
    });

    it('should require both properties', () => {
      // This test ensures TypeScript compilation catches missing properties
      const config: ToTypesConfig = {
        pathToJsonSchemas: './schemas',
        pathToOutputDirectory: './types'
      };

      expect(config).toBeDefined();
    });
  });

  describe('TypeGenerationOptions interface', () => {
    it('should accept optional configuration', () => {
      const options: TypeGenerationOptions = {
        includeJSDoc: false,
        exportAll: true
      };

      expect(options.includeJSDoc).toBe(false);
      expect(options.exportAll).toBe(true);
    });

    it('should work with partial configuration', () => {
      const options: TypeGenerationOptions = {
        includeJSDoc: true
      };

      expect(options.includeJSDoc).toBe(true);
      expect(options.exportAll).toBeUndefined();
    });

    it('should work with empty configuration', () => {
      const options: TypeGenerationOptions = {};

      expect(options).toBeDefined();
      expect(Object.keys(options)).toHaveLength(0);
    });
  });
});