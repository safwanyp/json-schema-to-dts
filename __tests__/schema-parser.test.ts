import { describe, it, expect } from 'vitest';
import { generateTypeDefinition } from '../src/generation';
import { JsonSchema } from '../src/types';

describe('SchemaParser (Functional)', () => {
  describe('generateTypeDefinition', () => {
    it('should generate interface with JSDoc', () => {
      const schema: JsonSchema = {
        title: 'User',
        description: 'A user object',
        type: 'object',
        properties: {
          id: { type: 'string', description: 'User ID' },
          name: { type: 'string', description: 'User name' },
        },
        required: ['id'],
      };

      // In the new architecture, the caller (Integration/Scanner) is responsible for
      // providing the normalized, unique name.
      const result = generateTypeDefinition({ name: 'User', schema, rootSchema: schema });

      expect(result.typeName).toBe('User');
      expect(result.definition).toContain('/**');
      expect(result.definition).toContain('User');
      expect(result.definition).toContain('A user object');
      expect(result.definition).toContain('interface User');
      expect(result.definition).toContain('id: string;');
      expect(result.definition).toContain('name?: string;');
    });

    it('should handle schema with examples', () => {
      const schema: JsonSchema = {
        title: 'Product',
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        examples: [{ id: 'test-123' }],
      };

      const result = generateTypeDefinition({ name: 'Product', schema, rootSchema: schema });

      expect(result.definition).toContain('@example');
      expect(result.definition).toContain('"id": "test-123"');
    });
  });

  describe('type mapping', () => {
    it('should map primitive types correctly', () => {
      const testCases = [
        { schema: { type: 'string' }, expected: 'string' },
        { schema: { type: 'number' }, expected: 'number' },
        { schema: { type: 'integer' }, expected: 'number' },
        { schema: { type: 'boolean' }, expected: 'boolean' },
        { schema: { type: 'null' }, expected: 'null' },
      ];

      testCases.forEach(({ schema, expected }) => {
        const result = generateTypeDefinition({
          name: 'Test',
          schema: schema as JsonSchema,
          rootSchema: schema as JsonSchema,
        });
        expect(result.definition).toContain(expected);
      });
    });

    it('should handle enum types', () => {
      const schema: JsonSchema = {
        type: 'string',
        enum: ['admin', 'user', 'guest'],
      };

      const result = generateTypeDefinition({ name: 'Role', schema, rootSchema: schema });
      expect(result.definition).toContain('"admin" | "user" | "guest"');
    });

    it('should handle const values', () => {
      const schema: JsonSchema = {
        const: 'fixed-value',
      };

      const result = generateTypeDefinition({ name: 'Constant', schema, rootSchema: schema });
      expect(result.definition).toContain('"fixed-value"');
    });

    it('should handle array types', () => {
      const schema: JsonSchema = {
        type: 'array',
        items: { type: 'string' },
      };

      const result = generateTypeDefinition({ name: 'Tags', schema, rootSchema: schema });
      expect(result.definition).toContain('string[]');
    });

    it('should handle array of union types', () => {
      const schema: JsonSchema = {
        type: 'array',
        items: {
          enum: ['red', 'green', 'blue'],
        },
      };

      const result = generateTypeDefinition({ name: 'Colors', schema, rootSchema: schema });
      expect(result.definition).toContain('("red" | "green" | "blue")[]');
    });

    it('should handle union types', () => {
      const schema: JsonSchema = {
        type: ['string', 'number'],
      };

      const result = generateTypeDefinition({ name: 'Mixed', schema, rootSchema: schema });
      expect(result.definition).toContain('string | number');
    });
  });

  describe('object type generation', () => {
    it('should generate object with required and optional properties', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['id', 'name'],
      };

      const result = generateTypeDefinition({ name: 'Person', schema, rootSchema: schema });

      expect(result.definition).toContain('id: string;');
      expect(result.definition).toContain('name: string;');
      expect(result.definition).toContain('age?: number;');
    });

    it('should handle nested objects', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      };

      const result = generateTypeDefinition({ name: 'Data', schema, rootSchema: schema });
      expect(result.definition).toContain('user?:');
      expect(result.definition).toContain('id?: string;');
      expect(result.definition).toContain('profile?:');
      expect(result.definition).toContain('email?: string;');
    });
  });

  describe('reference handling', () => {
    it('should resolve $ref to type names', () => {
      const rootSchema: JsonSchema = {
        definitions: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
        type: 'object',
        properties: {
          owner: { $ref: '#/definitions/User' },
        },
      };

      const result = generateTypeDefinition({ name: 'Document', schema: rootSchema, rootSchema });
      expect(result.definition).toContain('owner?: User;');
    });

    it('should handle $defs references', () => {
      const rootSchema: JsonSchema = {
        $defs: {
          Category: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        type: 'object',
        properties: {
          category: { $ref: '#/$defs/Category' },
        },
      };

      const result = generateTypeDefinition({ name: 'Product', schema: rootSchema, rootSchema });
      expect(result.definition).toContain('category?: Category;');
    });
  });

  describe('naming conventions', () => {
    it('should respect the provided name (assuming it is pre-normalized)', () => {
      const testCases = [
        { input: 'UserProfile', expected: 'UserProfile' },
        { input: 'ApiResponse', expected: 'ApiResponse' },
        { input: 'ProgrammeOffer', expected: 'ProgrammeOffer' },
        { input: 'Simple', expected: 'Simple' },
      ];

      testCases.forEach(({ input, expected }) => {
        const schema: JsonSchema = { type: 'object' };
        // We now pass the pre-normalized name
        const result = generateTypeDefinition({ name: input, schema, rootSchema: schema });
        expect(result.typeName).toBe(expected);
        expect(result.definition).toContain(expected);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty object schema', () => {
      const schema: JsonSchema = {
        type: 'object',
      };

      const result = generateTypeDefinition({ name: 'Empty', schema, rootSchema: schema });
      expect(result.definition).toContain('Record<string, any>');
    });

    it('should handle array without items', () => {
      const schema: JsonSchema = {
        type: 'array',
      };

      const result = generateTypeDefinition({ name: 'List', schema, rootSchema: schema });
      expect(result.definition).toContain('any[]');
    });

    it('should handle unknown type', () => {
      const schema: JsonSchema = {
        type: 'unknown' as any,
      };

      const result = generateTypeDefinition({ name: 'Mystery', schema, rootSchema: schema });
      expect(result.definition).toContain('any');
    });
  });
});
