/**
 * Registry for managing unique TypeScript type names.
 * Ensures that generated type names don't conflict by appending numeric suffixes when needed.
 */

/**
 * Interface for the type name registry.
 * Provides methods for registering, looking up, and managing type names.
 */
export interface TypeNameRegistry {
  /**
   * Register a type name for a specific JSON pointer.
   * If the name is already taken, appends a numeric suffix.
   *
   * @param pointer - The JSON pointer (e.g., "#/definitions/User")
   * @param name - The desired type name
   * @returns The actual registered name (may have suffix if original was taken)
   */
  register(pointer: string, name: string): string;

  /**
   * Get the registered type name for a pointer.
   *
   * @param pointer - The JSON pointer to look up
   * @returns The registered type name, or undefined if not registered
   */
  get(pointer: string): string | undefined;

  /**
   * Get the original base name requested for a pointer (before any suffix was added).
   *
   * @param pointer - The JSON pointer to look up
   * @returns The original base name, or undefined if not registered
   */
  getBaseName(pointer: string): string | undefined;

  /**
   * Get all registered pointers and their names.
   *
   * @returns Map of JSON pointers to their registered type names
   */
  getAll(): Map<string, string>;

  /**
   * Remove a registration (used for cleanup/optimization).
   *
   * @param pointer - The JSON pointer to remove
   */
  delete(pointer: string): void;
}

/**
 * Internal entry structure storing both the unique name and original base name.
 */
interface RegistryEntry {
  /** The unique type name (may have numeric suffix) */
  name: string;
  /** The original requested name (without suffix) */
  baseName: string;
}

/**
 * Creates a new TypeNameRegistry instance.
 *
 * @returns A new registry for managing type names
 *
 * @example
 * const registry = createTypeNameRegistry();
 * registry.register('#/definitions/User', 'User'); // => 'User'
 * registry.register('#/properties/user', 'User');  // => 'User_1'
 */
export const createTypeNameRegistry = (): TypeNameRegistry => {
  const jsonPointerToEntryMap = new Map<string, RegistryEntry>();
  const typeNameCount = new Map<string, number>();

  /**
   * Gets a unique type name by appending a numeric suffix if needed.
   */
  const getUniqueTypeName = (baseName: string): string => {
    const count = typeNameCount.get(baseName) || 0;
    typeNameCount.set(baseName, count + 1);

    if (count === 0) {
      return baseName;
    }

    return `${baseName}_${count}`;
  };

  return {
    register(pointer, name) {
      // Return existing registration if already registered
      if (jsonPointerToEntryMap.has(pointer)) {
        return jsonPointerToEntryMap.get(pointer)!.name;
      }

      const uniqueName = getUniqueTypeName(name);
      jsonPointerToEntryMap.set(pointer, { name: uniqueName, baseName: name });
      return uniqueName;
    },

    get(pointer) {
      return jsonPointerToEntryMap.get(pointer)?.name;
    },

    getBaseName(pointer) {
      return jsonPointerToEntryMap.get(pointer)?.baseName;
    },

    getAll() {
      const result = new Map<string, string>();
      for (const [pointer, entry] of jsonPointerToEntryMap) {
        result.set(pointer, entry.name);
      }
      return result;
    },

    delete(pointer) {
      jsonPointerToEntryMap.delete(pointer);
    },
  };
};
